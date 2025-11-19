import { getUserPredictions, savePrediction } from "@/lib/council/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status') as 'pending' | 'all' || 'pending'
    
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 })
    }
    
    const predictions = await getUserPredictions(userId, status)
    
    return Response.json({ predictions })
  } catch (error) {
    console.error('[v0] Error fetching predictions:', error)
    return Response.json({ error: 'Failed to fetch predictions' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { debateId, advisorArchetype, advisorName, predictionText, confidenceScore, dueDate } = await req.json()
    
    if (!debateId || !advisorArchetype || !advisorName || !predictionText) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const prediction = await savePrediction(
      debateId,
      advisorArchetype,
      advisorName,
      predictionText,
      confidenceScore || 50,
      new Date(dueDate)
    )
    
    return Response.json({ prediction })
  } catch (error) {
    console.error('[v0] Error saving prediction:', error)
    return Response.json({ error: 'Failed to save prediction' }, { status: 500 })
  }
}
