import { createCouncil, getUserCouncils, getCouncilAdvisors } from "@/lib/council/db"
import { createCouncilAdvisor } from "@/lib/council/db"
import { getArchetypeByKey } from "@/lib/council/db"
import { generateSystemPrompt, selectModelFromExperience } from "@/lib/council/prompts"
import type { SliderValues } from "@/lib/council/types"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return Response.json({ error: "User ID required" }, { status: 400 })
    }

    const councils = await getUserCouncils(userId)

    const councilsWithAdvisors = await Promise.all(
      councils.map(async (council) => {
        const advisors = await getCouncilAdvisors(council.id)
        return { ...council, advisorCount: advisors.length }
      }),
    )

    return Response.json(
      { councils: councilsWithAdvisors },
      {
        headers: {
          "Cache-Control": "private, max-age=120, stale-while-revalidate=240",
        },
      },
    )
  } catch (error) {
    logger.error("Error fetching councils", error)
    return Response.json({ error: "Failed to fetch councils" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { userId, name, description, type, advisors } = await req.json()

    if (!userId || !name || !advisors || !Array.isArray(advisors)) {
      return Response.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Create council
    const council = await createCouncil(userId, name, type || "custom", description)

    // Create advisors
    for (let i = 0; i < advisors.length; i++) {
      const advisorData = advisors[i]
      const archetype = await getArchetypeByKey(advisorData.archetype)

      if (!archetype) {
        throw new Error(`Archetype not found: ${advisorData.archetype}`)
      }

      const sliders: SliderValues = {
        ethics: advisorData.ethics ?? archetype.default_ethics,
        risk: advisorData.risk ?? archetype.default_risk,
        timeHorizon: advisorData.timeHorizon ?? archetype.default_time_horizon,
        ideology: advisorData.ideology ?? archetype.default_ideology,
        experience: advisorData.experience ?? archetype.default_experience,
      }

      const systemPrompt = generateSystemPrompt(archetype, sliders, advisorData.personalityPreset)
      const model = selectModelFromExperience(sliders.experience)

      await createCouncilAdvisor({
        council_id: council.id,
        archetype: archetype.archetype_key,
        display_name: archetype.display_name,
        position: i + 1,
        ethics_score: sliders.ethics,
        risk_score: sliders.risk,
        time_horizon_score: sliders.timeHorizon,
        ideology_score: sliders.ideology,
        experience_score: sliders.experience,
        personality_preset: advisorData.personalityPreset || null,
        model,
        system_prompt: systemPrompt,
      })
    }

    // Fetch full council with advisors
    const councilAdvisors = await getCouncilAdvisors(council.id)

    return Response.json({
      council: { ...council, advisors: councilAdvisors },
    })
  } catch (error) {
    logger.error("Error creating council", error)
    return Response.json({ error: "Failed to create council" }, { status: 500 })
  }
}
