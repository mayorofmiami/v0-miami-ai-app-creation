import { Google } from "arctic"

// Initialize Google OAuth provider
export const google = new Google(
  process.env.GOOGLE_CLIENT_ID || "",
  process.env.GOOGLE_CLIENT_SECRET || "",
  process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
    : "http://localhost:3000/api/auth/callback/google",
)

export interface GoogleUser {
  sub: string // Google user ID
  email: string
  name: string
  picture?: string
  email_verified: boolean
}
