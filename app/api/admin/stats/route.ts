import { neon } from "@neondatabase/serverless"
import { requireAdmin } from "@/lib/auth"
import { logAdminAction } from "@/lib/admin-logger"
import { getModelUsageStats } from "@/lib/cost-tracker"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin()

    await logAdminAction({
      adminUserId: admin.id,
      actionType: "view_stats",
      details: { timestamp: new Date().toISOString() },
    })

    const usersResult = await sql`SELECT COUNT(*) as count FROM users`
    const totalUsers = Number(usersResult[0]?.count || 0)

    // Get total searches
    const searchesResult = await sql`SELECT COUNT(*) as count FROM search_history`
    const totalSearches = Number(searchesResult[0]?.count || 0)

    // Get pro subscribers
    const proResult = await sql`SELECT COUNT(*) as count FROM subscriptions WHERE plan = 'pro' AND status = 'active'`
    const proSubscribers = Number(proResult[0]?.count || 0)

    // Get searches today
    const todayResult = await sql`
      SELECT COUNT(*) as count FROM search_history 
      WHERE created_at >= CURRENT_DATE
    `
    const searchesToday = Number(todayResult[0]?.count || 0)

    // Get searches by mode
    const modeResult = await sql`
      SELECT mode, COUNT(*) as count 
      FROM search_history 
      GROUP BY mode
    `
    const searchesByMode = modeResult.reduce(
      (acc, row) => {
        acc[row.mode as string] = Number(row.count)
        return acc
      },
      {} as Record<string, number>,
    )

    const trendsResult = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM search_history
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    const topQueriesResult = await sql`
      SELECT query, COUNT(*) as count
      FROM search_history
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY query
      ORDER BY count DESC
      LIMIT 10
    `

    const userGrowthResult = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    // Get recent searches
    const recentSearches = await sql`
      SELECT 
        sh.query, 
        sh.mode, 
        sh.created_at,
        u.email
      FROM search_history sh
      LEFT JOIN users u ON sh.user_id = u.id
      ORDER BY sh.created_at DESC
      LIMIT 10
    `

    const modelUsageStats = await getModelUsageStats(30)
    const totalCost = modelUsageStats.reduce((sum: number, stat: any) => sum + Number(stat.total_cost || 0), 0)
    const estimatedCost = totalCost.toFixed(2)

    return Response.json({
      stats: {
        totalUsers,
        totalSearches,
        proSubscribers,
        searchesToday,
        searchesByMode,
        estimatedCost,
        revenue: (proSubscribers * 9.99).toFixed(2),
        dailyTrends: trendsResult,
        topQueries: topQueriesResult,
        userGrowth: userGrowthResult,
        modelUsage: modelUsageStats,
      },
      recentSearches,
    })
  } catch (error) {
    console.error("[v0] Admin stats error:", error)
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
