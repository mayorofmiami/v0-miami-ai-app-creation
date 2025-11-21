import { analyzeQuestion } from "@/lib/council/quick-council"
import { createCouncil, createCouncilAdvisor, getArchetypeByKey } from "@/lib/council/db"
import { generateSystemPrompt, selectModelFromExperience } from "@/lib/council/prompts"
import type { SliderValues } from "@/lib/council/types"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const { userId, question } = await req.json()

    if (!userId || !question) {
      return Response.json({ error: "User ID and question required" }, { status: 400 })
    }

    // Analyze question and select advisors
    const analysis = analyzeQuestion(question)

    // Create a quick council
    const council = await createCouncil(userId, `Quick Council - ${new Date().toLocaleDateString()}`, "quick")

    // Create advisors with default slider values (all at 50 = balanced)
    const defaultSliders: SliderValues = {
      ethics: 50,
      risk: 50,
      timeHorizon: 50,
      ideology: 50,
      experience: 50,
    }

    const advisors = []
    for (let i = 0; i < analysis.suggestedAdvisors.length; i++) {
      const archetypeKey = analysis.suggestedAdvisors[i]
      const archetype = await getArchetypeByKey(archetypeKey)

      if (!archetype) continue

      const systemPrompt = generateSystemPrompt(archetype, defaultSliders)
      const model = selectModelFromExperience(defaultSliders.experience)

      const advisor = await createCouncilAdvisor({
        council_id: council.id,
        archetype: archetype.archetype_key,
        display_name: archetype.display_name,
        position: i + 1,
        ethics_score: defaultSliders.ethics,
        risk_score: defaultSliders.risk,
        time_horizon_score: defaultSliders.timeHorizon,
        ideology_score: defaultSliders.ideology,
        experience_score: defaultSliders.experience,
        personality_preset: null,
        model,
        system_prompt: systemPrompt,
      })

      advisors.push(advisor)
    }

    return Response.json({
      council: { ...council, advisors },
      analysis,
    })
  } catch (error) {
    logger.error("Error creating quick council", error)
    return Response.json({ error: "Failed to create quick council" }, { status: 500 })
  }
}
