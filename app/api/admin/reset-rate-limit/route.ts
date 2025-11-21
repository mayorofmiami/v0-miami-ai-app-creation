import { neon } from "@neondatabase/serverless"
import { getSession } from "@/lib/auth"
import { logger } from "@/lib/logger"

export async function GET(request: Request) {
  try {
    // Get the authenticated user
    const session = await getSession()
    const userId = session?.userId

    if (!userId) {
      return Response.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    // Delete the rate limit record for this user
    const sql = neon(process.env.DATABASE_URL!)
    await sql`DELETE FROM rate_limits WHERE user_id = ${userId}`

    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rate Limit Reset</title>
          <style>
            body { 
              font-family: system-ui; 
              max-width: 600px; 
              margin: 50px auto; 
              padding: 20px; 
              text-align: center;
            }
            .success { 
              background: #d4edda; 
              color: #155724; 
              padding: 20px; 
              border-radius: 8px;
              font-size: 18px;
            }
          </style>
        </head>
        <body>
          <div class="success">
            <h1>✅ Rate Limit Reset Successfully!</h1>
            <p>Your rate limit has been reset. You now have 1000 queries available.</p>
            <p><a href="/">← Back to Miami.AI</a></p>
          </div>
        </body>
      </html>
      `,
      {
        headers: { "Content-Type": "text/html" },
      },
    )
  } catch (error) {
    logger.error("Rate limit reset error:", error)
    return Response.json(
      { error: "Failed to reset rate limit", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  // Keep POST handler for API access
  try {
    const session = await getSession()
    const userId = session?.userId

    if (!userId) {
      return Response.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    const sql = neon(process.env.DATABASE_URL!)
    await sql`DELETE FROM rate_limits WHERE user_id = ${userId}`

    return Response.json({
      success: true,
      message: "Rate limit reset successfully",
      userId,
    })
  } catch (error) {
    logger.error("Rate limit reset error:", error)
    return Response.json(
      { error: "Failed to reset rate limit", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
