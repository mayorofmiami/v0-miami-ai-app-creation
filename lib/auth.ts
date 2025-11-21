import "server-only"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { sql } from "./db"
import { logger } from "./logger"

export interface User {
  id: string
  email: string
  name: string | null
  created_at: string
  role?: string
  oauth_provider?: string
  oauth_id?: string
  avatar_url?: string
}

export interface Session {
  id: string
  user_id: string
  expires_at: string
}

export async function hashPassword(password: string): Promise<string> {
  // Generate random salt (16 bytes)
  const saltArray = new Uint8Array(16)
  crypto.getRandomValues(saltArray)
  const salt = Array.from(saltArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  // Hash password with salt using SHA-256
  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

  return salt + ":" + hash
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(":")

  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const verifyHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

  return key === verifyHash
}

export async function createSession(userId: string): Promise<string> {
  await sql`
    DELETE FROM sessions 
    WHERE user_id = ${userId}
    AND expires_at < NOW() + INTERVAL '7 days'
  `

  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  await sql`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (${sessionId}, ${userId}, ${expiresAt.toISOString()})
  `

  const cookieStore = await cookies()
  cookieStore.set("session", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  })

  logger.info("Session created", { userId, sessionId })

  return sessionId
}

export async function getSession(): Promise<{ userId: string } | null> {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session")?.value

    if (!sessionId) return null

    const result = await sql`
      SELECT user_id
      FROM sessions
      WHERE id = ${sessionId}
      AND expires_at > NOW()
    `

    if (result.length === 0) return null

    return { userId: result[0].user_id }
  } catch (error) {
    logger.error("Failed to get session", { error })
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session")?.value

    if (!sessionId) return null

    const result = await sql`
      SELECT u.id, u.email, u.name, u.created_at, u.role, u.oauth_provider, u.oauth_id, u.avatar_url
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ${sessionId}
      AND s.expires_at > NOW()
    `

    if (result.length === 0) return null

    return result[0] as User
  } catch (error) {
    logger.error("Failed to get current user", { error })
    return null
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  return user
}

export async function logout() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session")?.value

  if (sessionId) {
    await sql`DELETE FROM sessions WHERE id = ${sessionId}`
    logger.info("Session deleted from database", { sessionId })
  }

  cookieStore.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  })

  logger.info("Session cookie cleared")
}

export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    logger.info("Sign up attempt", { email })

    const existing = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existing.length > 0) {
      logger.warn("Sign up failed - email exists", { email })
      return { success: false, error: "Email already exists" }
    }

    const passwordHash = await hashPassword(password)
    const userId = crypto.randomUUID()

    const role = email === "spencer@miami.ai" ? "owner" : "user"

    const result = await sql`
      INSERT INTO users (id, email, password_hash, name, role, created_at)
      VALUES (${userId}, ${email}, ${passwordHash}, ${name}, ${role}, NOW())
      RETURNING id
    `

    logger.info("Sign up successful", { userId: result[0].id })
    return { success: true, userId: result[0].id }
  } catch (error) {
    logger.error("Sign up error", { error })
    return { success: false, error: "Failed to create account" }
  }
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    const result = await sql`
      SELECT id, password_hash FROM users WHERE email = ${email}
    `

    if (result.length === 0) {
      return { success: false, error: "Invalid email or password" }
    }

    const user = result[0]

    if (!user.password_hash) {
      return { success: false, error: "This account uses social login. Please sign in with Google." }
    }

    const isValid = await verifyPassword(password, user.password_hash)

    if (!isValid) {
      return { success: false, error: "Invalid email or password" }
    }

    return { success: true, userId: user.id }
  } catch (error) {
    logger.error("Sign in error", { error })
    return { success: false, error: "Failed to sign in" }
  }
}

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  if (user.role !== "owner" && user.role !== "admin") {
    redirect("/app")
  }
  return user
}

export async function createOrUpdateOAuthUser(
  provider: string,
  providerId: string,
  email: string,
  name: string,
  avatarUrl?: string,
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    logger.info("OAuth user creation attempt", { provider, email })

    const existingOAuth = await sql`
      SELECT id FROM users 
      WHERE oauth_provider = ${provider} 
      AND oauth_id = ${providerId}
    `

    if (existingOAuth.length > 0) {
      logger.info("Found existing OAuth user, updating info", { userId: existingOAuth[0].id })
      await sql`
        UPDATE users 
        SET name = ${name}, 
            avatar_url = ${avatarUrl || null},
            email = ${email}
        WHERE id = ${existingOAuth[0].id}
      `
      return { success: true, userId: existingOAuth[0].id }
    }

    const existingEmail = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingEmail.length > 0) {
      logger.info("Found existing email user, linking OAuth account", { userId: existingEmail[0].id })
      await sql`
        UPDATE users 
        SET oauth_provider = ${provider},
            oauth_id = ${providerId},
            avatar_url = ${avatarUrl || null},
            name = COALESCE(name, ${name})
        WHERE id = ${existingEmail[0].id}
      `
      logger.info("Successfully linked OAuth to existing account", { userId: existingEmail[0].id })
      return { success: true, userId: existingEmail[0].id }
    }

    logger.info("Creating new OAuth user", { provider, email })
    const userId = crypto.randomUUID()
    const role = email === "spencer@miami.ai" ? "owner" : "user"

    await sql`
      INSERT INTO users (
        id, 
        email, 
        name, 
        oauth_provider, 
        oauth_id, 
        avatar_url,
        role,
        created_at
      )
      VALUES (
        ${userId}, 
        ${email}, 
        ${name}, 
        ${provider}, 
        ${providerId}, 
        ${avatarUrl || null},
        ${role},
        NOW()
      )
    `

    logger.info("Successfully created new OAuth user", { userId })
    return { success: true, userId }
  } catch (error) {
    logger.error("OAuth user creation error", { error })
    return { success: false, error: error instanceof Error ? error.message : "Failed to create or update user" }
  }
}

export async function createPasswordResetToken(
  email: string,
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const user = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (user.length === 0) {
      return { success: true }
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await sql`
      INSERT INTO password_reset_tokens (token, user_id, expires_at)
      VALUES (${token}, ${user[0].id}, ${expiresAt.toISOString()})
    `

    return { success: true, token }
  } catch (error) {
    logger.error("Password reset token creation error", { error })
    return { success: false, error: "Failed to create reset token" }
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await sql`
      SELECT user_id, expires_at FROM password_reset_tokens
      WHERE token = ${token}
    `

    if (result.length === 0) {
      return { success: false, error: "Invalid or expired reset token" }
    }

    const resetToken = result[0]
    if (new Date(resetToken.expires_at) < new Date()) {
      return { success: false, error: "Reset token has expired" }
    }

    const passwordHash = await hashPassword(newPassword)

    await sql`
      UPDATE users
      SET password_hash = ${passwordHash}
      WHERE id = ${resetToken.user_id}
    `

    await sql`
      DELETE FROM password_reset_tokens WHERE token = ${token}
    `

    await sql`
      DELETE FROM sessions WHERE user_id = ${resetToken.user_id}
    `

    return { success: true }
  } catch (error) {
    logger.error("Password reset error", { error })
    return { success: false, error: "Failed to reset password" }
  }
}
