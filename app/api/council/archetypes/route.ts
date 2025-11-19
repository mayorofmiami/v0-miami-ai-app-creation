import { getAllArchetypes, getArchetypesByCategory } from "@/lib/council/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    
    const archetypes = category 
      ? await getArchetypesByCategory(category)
      : await getAllArchetypes()
    
    return Response.json({ archetypes })
  } catch (error) {
    console.error('[v0] Error fetching archetypes:', error)
    return Response.json({ error: 'Failed to fetch archetypes' }, { status: 500 })
  }
}
