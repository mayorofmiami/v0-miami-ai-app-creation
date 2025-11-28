import type { NextRequest } from "next/server"

export const runtime = "edge"
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt?.trim()) {
      return Response.json({ error: "Prompt is required" }, { status: 400 })
    }

    const falKey = process.env.FAL_KEY
    if (!falKey) {
      return Response.json({ error: "Image generation API not configured" }, { status: 500 })
    }

    // Use fal.ai for image generation
    const falResponse = await fetch("https://queue.fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${falKey}`,
      },
      body: JSON.stringify({
        prompt,
        image_size: "landscape_16_9",
        num_inference_steps: 4,
        num_images: 1,
      }),
    })

    if (!falResponse.ok) {
      throw new Error("Image generation failed")
    }

    const result = await falResponse.json()

    // fal.ai returns images in result.images array
    const imageUrl = result.images?.[0]?.url || result.image?.url

    if (!imageUrl) {
      throw new Error("No image URL in response")
    }

    return Response.json({
      imageUrl,
      prompt,
    })
  } catch (error) {
    console.error("[Image Generation API Error]:", error)
    return Response.json({ error: "Failed to generate image" }, { status: 500 })
  }
}
