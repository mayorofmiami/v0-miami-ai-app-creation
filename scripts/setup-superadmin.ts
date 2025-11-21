import { hashPassword } from "../lib/auth"
import { sql } from "../lib/db.tsx"

async function setupSuperadmin() {
  const email = "spencer@miami.ai"
  const password = "PAssword!33!"
  const name = "Spencer"

  // Hash password using the app's auth function
  const passwordHash = await hashPassword(password)

  // Update or create user with hashed password
  await sql`
    INSERT INTO users (email, password_hash, name, role)
    VALUES (${email}, ${passwordHash}, ${name}, 'owner')
    ON CONFLICT (email) 
    DO UPDATE SET 
      password_hash = ${passwordHash},
      role = 'owner',
      updated_at = NOW()
  `

  console.log("✓ Superadmin account ready!")
  console.log("Email:", email)
  console.log("Role: owner")
  console.log("Password: PAssword!33!")
}

setupSuperadmin()
