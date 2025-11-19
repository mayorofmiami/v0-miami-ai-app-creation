import { neon } from "@neondatabase/serverless"
import type { Council, CouncilAdvisor, CouncilDebate, CouncilDebateResponse, CouncilPrediction, AdvisorArchetype } from "./types"

const sql = neon(process.env.DATABASE_URL!)

// Council operations
export async function createCouncil(
  userId: string,
  name: string,
  type: 'custom' | 'quick' | 'preset',
  description?: string
): Promise<Council> {
  const result = await sql`
    INSERT INTO councils (user_id, name, description, type)
    VALUES (${userId}, ${name}, ${description || ''}, ${type})
    RETURNING *
  `
  return result[0] as Council
}

export async function getUserCouncils(userId: string): Promise<Council[]> {
  return await sql`
    SELECT * FROM councils
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
  ` as Council[]
}

export async function getCouncilById(councilId: string): Promise<Council | null> {
  const result = await sql`
    SELECT * FROM councils
    WHERE id = ${councilId}
    LIMIT 1
  `
  return result[0] as Council || null
}

export async function incrementCouncilUsage(councilId: string): Promise<void> {
  await sql`
    UPDATE councils
    SET uses_count = uses_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${councilId}
  `
}

// Advisor operations
export async function createCouncilAdvisor(advisor: Omit<CouncilAdvisor, 'id' | 'created_at'>): Promise<CouncilAdvisor> {
  const result = await sql`
    INSERT INTO council_advisors (
      council_id, archetype, display_name, position,
      ethics_score, risk_score, time_horizon_score, ideology_score, experience_score,
      personality_preset, model, system_prompt
    )
    VALUES (
      ${advisor.council_id}, ${advisor.archetype}, ${advisor.display_name}, ${advisor.position},
      ${advisor.ethics_score}, ${advisor.risk_score}, ${advisor.time_horizon_score}, 
      ${advisor.ideology_score}, ${advisor.experience_score},
      ${advisor.personality_preset || null}, ${advisor.model}, ${advisor.system_prompt}
    )
    RETURNING *
  `
  return result[0] as CouncilAdvisor
}

export async function getCouncilAdvisors(councilId: string): Promise<CouncilAdvisor[]> {
  return await sql`
    SELECT * FROM council_advisors
    WHERE council_id = ${councilId}
    ORDER BY position ASC
  ` as CouncilAdvisor[]
}

// Debate operations
export async function createDebate(
  userId: string,
  councilId: string | null,
  question: string,
  threadId?: string
): Promise<CouncilDebate> {
  const result = await sql`
    INSERT INTO council_debates (user_id, council_id, question, thread_id, status)
    VALUES (${userId}, ${councilId}, ${question}, ${threadId || null}, 'in_progress')
    RETURNING *
  `
  return result[0] as CouncilDebate
}

export async function saveDebateResponse(
  debateId: string,
  advisorArchetype: string,
  advisorName: string,
  roundNumber: number,
  content: string,
  modelUsed: string
): Promise<void> {
  await sql`
    INSERT INTO council_debate_responses (
      debate_id, advisor_archetype, advisor_name, round_number, content, model_used
    )
    VALUES (${debateId}, ${advisorArchetype}, ${advisorName}, ${roundNumber}, ${content}, ${modelUsed})
  `
}

export async function getDebateResponses(debateId: string, roundNumber?: number): Promise<CouncilDebateResponse[]> {
  if (roundNumber) {
    return await sql`
      SELECT * FROM council_debate_responses
      WHERE debate_id = ${debateId} AND round_number = ${roundNumber}
      ORDER BY created_at ASC
    ` as CouncilDebateResponse[]
  }
  return await sql`
    SELECT * FROM council_debate_responses
    WHERE debate_id = ${debateId}
    ORDER BY round_number ASC, created_at ASC
  ` as CouncilDebateResponse[]
}

export async function completeDebate(debateId: string, verdict: string): Promise<void> {
  await sql`
    UPDATE council_debates
    SET status = 'completed',
        verdict = ${verdict},
        completed_at = CURRENT_TIMESTAMP
    WHERE id = ${debateId}
  `
}

export async function getUserDebates(userId: string, limit: number = 50): Promise<any[]> {
  return await sql`
    SELECT 
      d.*,
      c.name as council_name,
      c.type as council_type,
      (SELECT COUNT(*) FROM council_debate_responses WHERE debate_id = d.id) as response_count
    FROM council_debates d
    LEFT JOIN councils c ON d.council_id = c.id
    WHERE d.user_id = ${userId}
    ORDER BY d.created_at DESC
    LIMIT ${limit}
  ` as any[]
}

export async function getDebateDetails(debateId: string): Promise<any> {
  const debate = await sql`
    SELECT 
      d.*,
      c.name as council_name,
      c.type as council_type
    FROM council_debates d
    LEFT JOIN councils c ON d.council_id = c.id
    WHERE d.id = ${debateId}
    LIMIT 1
  `
  
  if (!debate[0]) return null
  
  const responses = await getDebateResponses(debateId)
  const predictions = await sql`
    SELECT * FROM council_predictions
    WHERE debate_id = ${debateId}
    ORDER BY created_at ASC
  `
  
  return {
    ...debate[0],
    responses,
    predictions
  }
}

export async function searchUserDebates(userId: string, searchTerm: string): Promise<any[]> {
  return await sql`
    SELECT 
      d.*,
      c.name as council_name,
      c.type as council_type,
      (SELECT COUNT(*) FROM council_debate_responses WHERE debate_id = d.id) as response_count
    FROM council_debates d
    LEFT JOIN councils c ON d.council_id = c.id
    WHERE d.user_id = ${userId} 
      AND (d.question ILIKE ${'%' + searchTerm + '%'} OR d.verdict ILIKE ${'%' + searchTerm + '%'})
    ORDER BY d.created_at DESC
    LIMIT 50
  ` as any[]
}

export async function toggleDebateVisibility(debateId: string, isPublic: boolean): Promise<void> {
  // First, we need to add is_public column to council_debates if it doesn't exist
  // For now, we'll store it in the councils table since debates reference councils
  await sql`
    UPDATE councils
    SET is_public = ${isPublic}
    WHERE id = (SELECT council_id FROM council_debates WHERE id = ${debateId})
  `
}

// Prediction operations
export async function savePrediction(
  debateId: string,
  advisorArchetype: string,
  advisorName: string,
  predictionText: string,
  confidenceScore: number,
  dueDate: Date
): Promise<CouncilPrediction> {
  const result = await sql`
    INSERT INTO council_predictions (
      debate_id, advisor_archetype, advisor_name, prediction_text, confidence_score, due_date
    )
    VALUES (${debateId}, ${advisorArchetype}, ${advisorName}, ${predictionText}, ${confidenceScore}, ${dueDate.toISOString()})
    RETURNING *
  `
  return result[0] as CouncilPrediction
}

export async function getUserPredictions(userId: string, status: 'pending' | 'all' = 'pending'): Promise<CouncilPrediction[]> {
  if (status === 'pending') {
    return await sql`
      SELECT p.* FROM council_predictions p
      JOIN council_debates d ON p.debate_id = d.id
      WHERE d.user_id = ${userId} AND p.outcome = 'pending'
      ORDER BY p.due_date ASC
    ` as CouncilPrediction[]
  }
  return await sql`
    SELECT p.* FROM council_predictions p
    JOIN council_debates d ON p.debate_id = d.id
    WHERE d.user_id = ${userId}
    ORDER BY p.due_date DESC
  ` as CouncilPrediction[]
}

// Archetype operations
export async function getAllArchetypes(): Promise<AdvisorArchetype[]> {
  return await sql`
    SELECT * FROM advisor_archetypes
    ORDER BY 
      CASE category
        WHEN 'executive' THEN 1
        WHEN 'wisdom' THEN 2
        WHEN 'creative' THEN 3
        WHEN 'life' THEN 4
        WHEN 'wild_card' THEN 5
      END,
      display_name ASC
  ` as AdvisorArchetype[]
}

export async function getArchetypesByCategory(category: string): Promise<AdvisorArchetype[]> {
  return await sql`
    SELECT * FROM advisor_archetypes
    WHERE category = ${category}
    ORDER BY display_name ASC
  ` as AdvisorArchetype[]
}

export async function getArchetypeByKey(key: string): Promise<AdvisorArchetype | null> {
  const result = await sql`
    SELECT * FROM advisor_archetypes
    WHERE archetype_key = ${key}
    LIMIT 1
  `
  return result[0] as AdvisorArchetype || null
}
