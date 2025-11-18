import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { checkAttachmentRateLimit, incrementAttachmentRateLimit } from "@/lib/rate-limit"

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
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const isAuthenticated = userId && userId.length > 0
    const allowedTypes = isAuthenticated
      ? ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf", "text/plain", "text/csv"]
      : ["image/jpeg", "image/png", "image/webp", "image/gif"]

    // Validate MIME type
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

    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 255)

    const maxSize = isAuthenticated ? 20 * 1024 * 1024 : 5 * 1024 * 1024 // 20MB for auth, 5MB for free
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File too large. Max size: ${isAuthenticated ? "20MB" : "5MB"}`,
        },
        { status: 400 },
      )
    }

    if (file.type.startsWith('image/')) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const blob = new Blob([arrayBuffer], { type: file.type })
        
        // Check if it's a valid image by trying to read it
        const bitmap = await createImageBitmap(blob)
        
        // Limit image dimensions to prevent memory issues
        const maxDimension = 10000 // 10k pixels max per side
        if (bitmap.width > maxDimension || bitmap.height > maxDimension) {
          bitmap.close()
          return NextResponse.json(
            {
              error: `Image dimensions too large. Max: ${maxDimension}x${maxDimension} pixels`,
            },
            { status: 400 },
          )
        }
        bitmap.close()

        // Recreate file from validated buffer
        const validatedFile = new File([arrayBuffer], sanitizedFileName, { type: file.type })
        file = validatedFile as any
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid image file or corrupted data" },
          { status: 400 },
        )
      }
    }

    const ipAddress = getClientIp(request)
    const rateLimit = await checkAttachmentRateLimit(userId, ipAddress)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. ${isAuthenticated ? "50" : "5"} attachments per day. Resets at ${rateLimit.resetAt.toLocaleString()}`,
          remaining: rateLimit.remaining,
          limit: rateLimit.limit,
          resetAt: rateLimit.resetAt,
        },
        { status: 429 },
      )
    }

    const blob = await put(sanitizedFileName, file, {
      access: "public",
      addRandomSuffix: true,
    })

    await incrementAttachmentRateLimit(userId, ipAddress)

    return NextResponse.json({
      url: blob.url,
      filename: sanitizedFileName,
      size: file.size,
      type: file.type,
      rateLimit: {
        remaining: rateLimit.remaining - 1,
        limit: rateLimit.limit,
        resetAt: rateLimit.resetAt,
      },
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
