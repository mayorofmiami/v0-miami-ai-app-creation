import { type NextRequest, NextResponse } from "next/server"
import * as fal from "@fal-ai/serverless-client"
import { put } from "@vercel/blob"
import { neon } from "@neondatabase/serverless"
import { checkRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

fal.config({
  credentials: process.env.FAL_KEY,
})

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { prompt, userId, resolution = "square_hd", model = "fal-ai/flux/schnell" } = await request.json()

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const rateLimit = await checkRateLimit(userId || "anonymous", "image_generation")

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: userId
            ? `You've reached your daily limit. Please try again later.`
            : `You've used all your free images today. Sign up for more!`,
          remaining: rateLimit.remaining,
          resetAt: rateLimit.resetAt,
        },
        { status: 429 },
      )
    }

    let imageSize: string | { width: number; height: number } = "square_hd"

    if (resolution.includes("x")) {
      const [width, height] = resolution.split("x").map(Number)
      imageSize = { width, height }
    } else {
      imageSize = resolution
    }

    const result = (await fal.subscribe(model, {
      input: {
        prompt,
        image_size: imageSize,
        num_inference_steps: model.includes("schnell") ? 4 : 28,
      },
      logs: true,
    })) as any

    if (!result.images || !Array.isArray(result.images) || result.images.length === 0) {
      throw new Error("No image generated from fal")
    }

    const generatedImageUrl = result.images[0].url

    if (!generatedImageUrl) {
      throw new Error("No image URL in fal result")
    }

    const imageResponse = await fetch(generatedImageUrl)

    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`)
    }

    const imageBlob = await imageResponse.blob()

    const filename = `generated-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
    const blob = await put(filename, imageBlob, {
      access: "public",
      addRandomSuffix: false,
    })

    const [savedImage] = await sql`
      INSERT INTO generated_images (user_id, prompt, image_url, model_used, resolution, ip_address)
      VALUES (
        ${userId || null},
        ${prompt},
        ${blob.url},
        ${model},
        ${resolution},
        ${userId ? null : request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"}
      )
      RETURNING *
    `

    const updatedRateLimit = await checkRateLimit(userId || "anonymous", "image_generation")

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
      rateLimit: {
        remaining: updatedRateLimit.remaining,
        resetAt: updatedRateLimit.resetAt,
      },
    })
  } catch (error: any) {
    logger.error("Image generation error", error)

    return NextResponse.json(
      {
        error: "Failed to generate image",
        details: error?.message || String(error),
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    const rateLimit = await checkRateLimit(userId || "anonymous", "image_generation")

    return NextResponse.json(
      {
        rateLimit: {
          remaining: rateLimit.remaining,
          resetAt: rateLimit.resetAt,
          allowed: rateLimit.allowed,
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=10, must-revalidate",
        },
      },
    )
  } catch (error: any) {
    logger.error("Rate limit check error", error)
    return NextResponse.json({ error: "Failed to check rate limit" }, { status: 500 })
  }
}
