import "server-only"
import { neon } from "@neondatabase/serverless"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

let _sql: ReturnType<typeof neon> | null = null

function getSQL() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set")
    }
    _sql = neon(process.env.DATABASE_URL)
  }
  return _sql
}

export interface User {
  id: string
  email: string
  name: string | null
  created_at: string
  role?: string
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
  const sql = getSQL()
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
    expires: expiresAt,
  })

  return sessionId
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session")?.value

    if (!sessionId) return null

    const sql = getSQL()
    const result = await sql`
      SELECT u.id, u.email, u.name, u.created_at, u.role
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
  const sql = getSQL()
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session")?.value

  if (sessionId) {
    await sql`DELETE FROM sessions WHERE id = ${sessionId}`
  }

  cookieStore.delete("session")
}

export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    console.log("[v0] Sign up attempt for email:", email)

    const sql = getSQL()

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
    const sql = getSQL()
    const result = await sql`
      SELECT id, password_hash FROM users WHERE email = ${email}
    `

    if (result.length === 0) {
      return { success: false, error: "Invalid email or password" }
    }

    const user = result[0]
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
    redirect("/")
  }
  return user
}
