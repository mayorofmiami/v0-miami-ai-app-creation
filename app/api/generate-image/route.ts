import { type NextRequest, NextResponse } from "next/server"
import * as fal from "@fal-ai/serverless-client"
import { put } from "@vercel/blob"
import { neon } from "@neondatabase/serverless"

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY,
})

const sql = neon(process.env.DATABASE_URL!)

// Rate limits
const ANONYMOUS_DAILY_LIMIT = 3
const AUTH_DAILY_LIMIT = 50

async function checkRateLimit(userId: string | null, ipAddress: string) {
  const identifier = userId || ipAddress
  const identifierType = userId ? "user_id" : "ip_address"

  // Get current count for today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const result = await sql`
    SELECT COUNT(*) as count
    FROM generated_images
    WHERE ${identifierType === "user_id" ? sql`user_id = ${identifier}` : sql`ip_address = ${identifier}`}
    AND created_at >= ${today.toISOString()}
  `

  const currentCount = Number.parseInt(result[0]?.count || "0")
  const limit = userId ? AUTH_DAILY_LIMIT : ANONYMOUS_DAILY_LIMIT

  return {
    allowed: currentCount < limit,
    currentCount,
    limit,
    remaining: Math.max(0, limit - currentCount),
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, userId, resolution = "square_hd", model = "fal-ai/flux/schnell" } = await request.json()

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Get IP address for rate limiting
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    // Check rate limit
    const rateLimit = await checkRateLimit(userId, ipAddress)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: userId
            ? `You've reached your daily limit of ${rateLimit.limit} images. Upgrade for more!`
            : `You've used all ${rateLimit.limit} free images today. Sign up for ${AUTH_DAILY_LIMIT} images per day!`,
          currentCount: rateLimit.currentCount,
          limit: rateLimit.limit,
        },
        { status: 429 },
      )
    }

    console.log("[v0] Starting image generation with fal...")

    // Convert resolution to fal-compatible format
    let imageSize: string | { width: number; height: number } = "square_hd"

    if (resolution.includes("x")) {
      // Parse "1024x1024" format to object
      const [width, height] = resolution.split("x").map(Number)
      imageSize = { width, height }
    } else {
      // Use preset size names
      imageSize = resolution
    }

    // Generate image using fal
    const result = (await fal.subscribe(model, {
      input: {
        prompt,
        image_size: imageSize,
        num_inference_steps: model.includes("schnell") ? 4 : 28,
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log("[v0] fal queue update:", update.status)
      },
    })) as any

    console.log("[v0] fal result:", JSON.stringify(result, null, 2))

    if (!result.images || !Array.isArray(result.images) || result.images.length === 0) {
      console.error("[v0] Invalid fal result structure:", JSON.stringify(result))
      throw new Error("No image generated from fal")
    }

    const generatedImageUrl = result.images[0].url

    if (!generatedImageUrl) {
      console.error("[v0] No URL in fal result:", result.images[0])
      throw new Error("No image URL in fal result")
    }

    console.log("[v0] Downloading image from fal:", generatedImageUrl)

    // Download the image from fal
    const imageResponse = await fetch(generatedImageUrl)

    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`)
    }

    const imageBlob = await imageResponse.blob()
    console.log("[v0] Image downloaded, size:", imageBlob.size, "bytes")

    // Upload to Vercel Blob
    console.log("[v0] Uploading to Vercel Blob...")
    const filename = `generated-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
    const blob = await put(filename, imageBlob, {
      access: "public",
      addRandomSuffix: false,
    })
    console.log("[v0] Uploaded to Blob:", blob.url)

    // Save to database
    console.log("[v0] Saving to database...")
    const [savedImage] = await sql`
      INSERT INTO generated_images (user_id, prompt, image_url, model_used, resolution, ip_address)
      VALUES (
        ${userId || null},
        ${prompt},
        ${blob.url},
        ${model},
        ${resolution},
        ${userId ? null : ipAddress}
      )
      RETURNING *
    `
    console.log("[v0] Saved to database, id:", savedImage.id)

    // Get updated rate limit info
    const updatedRateLimit = await checkRateLimit(userId, ipAddress)

    return NextResponse.json({
      success: true,
      image: {
        id: savedImage.id,
        url: blob.url,
        prompt: savedImage.prompt,
        model: savedImage.model_used,
        resolution: savedImage.resolution,
        createdAt: savedImage.created_at,
      },
      rateLimit: updatedRateLimit,
    })
  } catch (error: any) {
    console.error("[v0] Image generation error:", error)
    console.error("[v0] Error message:", error?.message)
    console.error("[v0] Error stack:", error?.stack)

    return NextResponse.json(
      {
        error: "Failed to generate image",
        details: error?.message || String(error),
        stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 },
    )
  }
}

// GET endpoint to check rate limit status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    const rateLimit = await checkRateLimit(userId, ipAddress)

    return NextResponse.json({ rateLimit })
  } catch (error: any) {
    console.error("[v0] Rate limit check error:", error)
    return NextResponse.json({ error: "Failed to check rate limit" }, { status: 500 })
  }
}
