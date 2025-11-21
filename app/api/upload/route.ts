import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }
  return "unknown"
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    let file = formData.get("file") as File
    const userId = formData.get("userId") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const isAuthenticated = userId && userId.length > 0
    const allowedTypes = isAuthenticated
      ? ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf", "text/plain", "text/csv"]
      : ["image/jpeg", "image/png", "image/webp", "image/gif"]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: isAuthenticated
            ? "Invalid file type. Allowed: images, PDFs, text files, CSV"
            : "Free users can only upload images. Sign in for more file types.",
        },
        { status: 400 },
      )
    }

    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 255)

    const maxSize = isAuthenticated ? 20 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File too large. Max size: ${isAuthenticated ? "20MB" : "5MB"}`,
        },
        { status: 400 },
      )
    }

    if (file.type.startsWith("image/")) {
      try {
        const arrayBuffer = await file.arrayBuffer()

        if (arrayBuffer.byteLength === 0) {
          return NextResponse.json({ error: "Invalid image file - file is empty" }, { status: 400 })
        }

        file = new File([arrayBuffer], sanitizedFileName, { type: file.type })
      } catch (error) {
        return NextResponse.json({ error: "Invalid image file or corrupted data" }, { status: 400 })
      }
    }

    const rateLimit = await checkRateLimit(userId || "anonymous", "attachment")

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Upload limit exceeded. Please try again later.`,
          remaining: rateLimit.remaining,
          resetAt: rateLimit.resetAt,
        },
        { status: 429 },
      )
    }

    const blob = await put(sanitizedFileName, file, {
      access: "public",
      addRandomSuffix: true,
    })

    return NextResponse.json({
      url: blob.url,
      filename: sanitizedFileName,
      size: file.size,
      type: file.type,
      rateLimit: {
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      },
    })
  } catch (error) {
    logger.error("Upload error", { error })
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
