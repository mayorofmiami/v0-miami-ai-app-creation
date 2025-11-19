import { NextRequest, NextResponse } from "next/server"
import { getUserDebates, searchUserDebates, getDebateDetails } from "@/lib/council/db"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')
  const search = searchParams.get('search')
  const debateId = searchParams.get('debateId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  try {
    // Get specific debate details
    if (debateId) {
      const debate = await getDebateDetails(debateId)
      return NextResponse.json({ debate })
    }

    // Search debates
    if (search) {
      const debates = await searchUserDebates(userId, search)
      return NextResponse.json({ debates })
    }

    // Get all user debates
    const debates = await getUserDebates(userId)
    return NextResponse.json({ debates })
  } catch (error) {
    console.error('[v0] Error fetching debates:', error)
    return NextResponse.json({ error: 'Failed to fetch debates' }, { status: 500 })
  }
}
