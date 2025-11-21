import "server-only"
import { neon } from "@neondatabase/serverless"
import { logger } from "@/lib/logger"
import crypto from "crypto"

const sql = neon(process.env.DATABASE_URL!)

export interface AdminAction {
  adminUserId: string
  actionType: string
  targetType?: string
  targetId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function logAdminAction(action: AdminAction): Promise<void> {
  try {
    const id = crypto.randomUUID()

    await sql`
      INSERT INTO admin_actions (
        id, 
        admin_user_id, 
        action_type, 
        target_type, 
        target_id, 
        details, 
        ip_address, 
        user_agent,
        created_at
      )
      VALUES (
        ${id},
        ${action.adminUserId},
        ${action.actionType},
        ${action.targetType || null},
        ${action.targetId || null},
        ${JSON.stringify(action.details || {})},
        ${action.ipAddress || null},
        ${action.userAgent || null},
        NOW()
      )
    `

    logger.info("Admin action logged:", action.actionType)
  } catch (error) {
    logger.error("Failed to log admin action:", error)
  }
}

export async function getAdminActions(limit = 50, offset = 0) {
  try {
    const actions = await sql`
      SELECT 
        aa.*,
        u.email as admin_email,
        u.name as admin_name
      FROM admin_actions aa
      JOIN users u ON aa.admin_user_id = u.id
      ORDER BY aa.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    return actions
  } catch (error) {
    logger.error("Failed to fetch admin actions:", error)
    return []
  }
}
