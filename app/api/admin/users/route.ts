import { neon } from "@neondatabase/serverless"
import { requireAdmin } from "@/lib/auth"
import { logAdminAction } from "@/lib/admin-logger"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin()

    const { searchParams } = new URL(req.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const search = searchParams.get("search") || ""
    const limit = 20
    const offset = (page - 1) * limit

    await logAdminAction({
      adminUserId: admin.id,
      actionType: "view_users",
      details: { page, search },
    })

    let users
    let totalResult

    if (search) {
      users = await sql`
        SELECT 
          u.id,
          u.email,
          u.name,
          u.role,
          u.created_at,
          s.plan,
          s.status,
          COUNT(sh.id) as search_count
        FROM users u
        LEFT JOIN subscriptions s ON u.id = s.user_id
        LEFT JOIN search_history sh ON u.id = sh.user_id
        WHERE u.email ILIKE ${"%" + search + "%"} OR u.name ILIKE ${"%" + search + "%"}
        GROUP BY u.id, u.email, u.name, u.role, u.created_at, s.plan, s.status
        ORDER BY u.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `

      totalResult = await sql`
        SELECT COUNT(*) as count FROM users 
        WHERE email ILIKE ${"%" + search + "%"} OR name ILIKE ${"%" + search + "%"}
      `
    } else {
      users = await sql`
        SELECT 
          u.id,
          u.email,
          u.name,
          u.role,
          u.created_at,
          s.plan,
          s.status,
          COUNT(sh.id) as search_count
        FROM users u
        LEFT JOIN subscriptions s ON u.id = s.user_id
        LEFT JOIN search_history sh ON u.id = sh.user_id
        GROUP BY u.id, u.email, u.name, u.role, u.created_at, s.plan, s.status
        ORDER BY u.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `

      totalResult = await sql`SELECT COUNT(*) as count FROM users`
    }

    const total = Number(totalResult[0]?.count || 0)

    return Response.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("[v0] Admin users error:", error)
    return Response.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
