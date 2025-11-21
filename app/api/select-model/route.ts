import { type NextRequest, NextResponse } from "next/server"
import { selectModel, getModelById, AVAILABLE_MODELS } from "@/lib/model-selection"
import { getModelPreference } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, mode, userId, manualSelection } = body

    if (!query || !mode) {
      return NextResponse.json({ error: "Query and mode are required" }, { status: 400 })
    }

    if (manualSelection) {
      const model = getModelById(manualSelection)
      const modelInfo = AVAILABLE_MODELS[model]

      return NextResponse.json({
        model,
        modelInfo,
        reason: `Manually selected ${modelInfo.name}`,
        confidence: 1,
        autoSelected: false,
      })
    }

    if (userId) {
      const preference = await getModelPreference(userId)

      if (preference?.model_preference === "manual" && preference.selected_model) {
        const model = getModelById(preference.selected_model)
        const modelInfo = AVAILABLE_MODELS[model]

        return NextResponse.json({
          model,
          modelInfo,
          reason: `Using your preferred model: ${modelInfo.name}`,
          confidence: 1,
          autoSelected: false,
        })
      }
    }

    const selection = selectModel(query, mode)

    return NextResponse.json({
      model: selection.model,
      modelInfo: selection.modelInfo,
      reason: selection.reason,
      confidence: selection.confidence,
      autoSelected: true,
      analysis: selection.analysis,
    })
  } catch (error) {
    logger.error("Error selecting model", { error })
    return NextResponse.json({ error: "Failed to select model" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    models: Object.values(AVAILABLE_MODELS),
  })
}
