import { google, type GoogleUser } from "@/lib/oauth"
import { createOrUpdateOAuthUser, createSession } from "@/lib/auth"
import { cookies } from "next/headers"
import { OAuth2RequestError } from "arctic"

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")

  const cookieStore = await cookies()
  const storedState = cookieStore.get("google_oauth_state")?.value
  const storedCodeVerifier = cookieStore.get("google_code_verifier")?.value

  if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
    return new Response("Invalid OAuth state", { status: 400 })
  }

  try {
    const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier)

    // Decode ID token to get user info
    const idTokenPayload = JSON.parse(Buffer.from(tokens.idToken().split(".")[1], "base64").toString()) as GoogleUser

    if (!idTokenPayload.email_verified) {
      return new Response("Email not verified", { status: 400 })
    }

    // Create or update user
    const result = await createOrUpdateOAuthUser(
      "google",
      idTokenPayload.sub,
      idTokenPayload.email,
      idTokenPayload.name,
      idTokenPayload.picture,
    )

    if (!result.success || !result.userId) {
      return new Response("Failed to create user", { status: 500 })
    }

    // Create session
    await createSession(result.userId)

    console.log("[v0] OAuth session created, redirecting to home")

    // Clear OAuth cookies
    cookieStore.delete("google_oauth_state")
    cookieStore.delete("google_code_verifier")

    return Response.redirect(new URL("/", request.url))
  } catch (error) {
    console.error("[v0] Google OAuth callback error:", error)

    if (error instanceof OAuth2RequestError) {
      return new Response("Invalid authorization code", { status: 400 })
    }

    return new Response("Internal server error", { status: 500 })
  }
}
