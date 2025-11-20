import "server-only"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { sql } from "./db"

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

  console.log("[v0] Session created for user:", userId, "sessionId:", sessionId)

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
    console.error("[v0] getSession error:", error)
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
    console.error("[v0] getCurrentUser error:", error)
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
    console.log("[v0] Deleted session from database:", sessionId)
  }

  cookieStore.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  })

  console.log("[v0] Session cookie cleared")
}

export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    console.log("[v0] Sign up attempt for email:", email)

    const existing = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existing.length > 0) {
      console.log("[v0] Sign up failed: Email already exists")
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

    console.log("[v0] Sign up successful for user:", result[0].id)
    return { success: true, userId: result[0].id }
  } catch (error) {
    console.error("[v0] Sign up error:", error)
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
    console.error("[v0] Sign in error:", error)
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
    console.log("[v0] OAuth user creation attempt:", { provider, email, name })

    // Check if user exists with this OAuth provider
    const existingOAuth = await sql`
      SELECT id FROM users 
      WHERE oauth_provider = ${provider} 
      AND oauth_id = ${providerId}
    `

    if (existingOAuth.length > 0) {
      console.log("[v0] Found existing OAuth user, updating info")
      // User exists, update their info
      await sql`
        UPDATE users 
        SET name = ${name}, 
            avatar_url = ${avatarUrl || null},
            email = ${email}
        WHERE id = ${existingOAuth[0].id}
      `
      return { success: true, userId: existingOAuth[0].id }
    }

    // Check if user exists with this email (link accounts)
    const existingEmail = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingEmail.length > 0) {
      console.log("[v0] Found existing email user, linking OAuth account")
      // Link OAuth to existing account
      await sql`
        UPDATE users 
        SET oauth_provider = ${provider},
            oauth_id = ${providerId},
            avatar_url = ${avatarUrl || null},
            name = COALESCE(name, ${name})
        WHERE id = ${existingEmail[0].id}
      `
      console.log("[v0] Successfully linked OAuth to existing account")
      return { success: true, userId: existingEmail[0].id }
    }

    console.log("[v0] Creating new OAuth user")
    // Create new user
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

    console.log("[v0] Successfully created new OAuth user")
    return { success: true, userId }
  } catch (error) {
    console.error("[v0] OAuth user creation error:", error)
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
      // Don't reveal if email exists
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
    console.error("[v0] Password reset token creation error:", error)
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

    // Delete used token
    await sql`
      DELETE FROM password_reset_tokens WHERE token = ${token}
    `

    // Invalidate all existing sessions for security
    await sql`
      DELETE FROM sessions WHERE user_id = ${resetToken.user_id}
    `

    return { success: true }
  } catch (error) {
    console.error("[v0] Password reset error:", error)
    return { success: false, error: "Failed to reset password" }
  }
}
