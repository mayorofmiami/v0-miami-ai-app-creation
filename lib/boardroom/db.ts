import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface BoardSession {
  id: string
  thread_id: string
  user_id: string
  query: string
  board_type: string
  status: string
  created_at: Date
}

export interface BoardResponse {
  id: string
  session_id: string
  persona_name: string
  persona_model: string
  round_number: number
  content: string
  created_at: Date
}

export async function createBoardSession(
  userId: string,
  threadId: string,
  query: string,
  boardType: string,
): Promise<BoardSession> {
  const result = await sql`
    INSERT INTO board_sessions (user_id, thread_id, query, board_type, status)
    VALUES (${userId}, ${threadId}, ${query}, ${boardType}, 'in_progress')
    RETURNING *
  `
  return result[0] as BoardSession
}

export async function saveBoardResponse(
  sessionId: string,
  personaName: string,
  personaModel: string,
  roundNumber: number,
  content: string,
): Promise<void> {
  await sql`
    INSERT INTO board_responses (session_id, persona_name, persona_model, round_number, content)
    VALUES (${sessionId}, ${personaName}, ${personaModel}, ${roundNumber}, ${content})
  `
}

export async function getBoardResponses(sessionId: string, roundNumber?: number): Promise<BoardResponse[]> {
  if (roundNumber) {
    return (await sql`
      SELECT id, session_id, persona_name, persona_model, round_number, content, created_at
      FROM board_responses
      WHERE session_id = ${sessionId} AND round_number = ${roundNumber}
      ORDER BY created_at ASC
    `) as BoardResponse[]
  }
  return (await sql`
    SELECT id, session_id, persona_name, persona_model, round_number, content, created_at
    FROM board_responses
    WHERE session_id = ${sessionId}
    ORDER BY round_number ASC, created_at ASC
  `) as BoardResponse[]
}

export async function completeBoardSession(sessionId: string): Promise<void> {
  await sql`
    UPDATE board_sessions
    SET status = 'completed'
    WHERE id = ${sessionId}
  `
}
