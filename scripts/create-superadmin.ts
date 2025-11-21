import { hashPassword } from "../lib/auth"
import { sql } from "../lib/db"

async function createSuperAdmin() {
  const email = "spencer@miami.ai"
  const password = "PAssword!33!"
  const name = "Spencer"
  const role = "owner"

  try {
    // Check if user already exists
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`

    if (existing.length > 0) {
      console.log("User already exists:", email)
      // Update to owner role if needed
      await sql`UPDATE users SET role = ${role} WHERE email = ${email}`
      console.log("Updated user role to owner")
      return
    }

    // Hash the password
    const passwordHash = await hashPassword(password)
    const userId = crypto.randomUUID()

    // Create the superadmin user
    await sql`
      INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
      VALUES (${userId}, ${email}, ${passwordHash}, ${name}, ${role}, NOW(), NOW())
    `

    console.log("✓ Superadmin user created successfully!")
    console.log("Email:", email)
    console.log("Role:", role)
    console.log("User ID:", userId)
  } catch (error) {
    console.error("Failed to create superadmin user:", error)
    throw error
  }
}

createSuperAdmin()
