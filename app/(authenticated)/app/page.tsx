import { getCurrentUser } from "@/lib/auth"
import { AuthenticatedHome } from "@/components/authenticated-home"
import { sql } from "@vercel/postgres"

export const metadata = {
  title: "Search - Miami.AI",
  description: "AI-powered search with real-time results and citations",
  robots: "noindex, nofollow", // Auth-required page, don't index
}

export default async function AuthenticatedHomePage() {
  // User is guaranteed to exist due to layout's requireAuth()
  const user = await getCurrentUser()

  // Fetch initial data for the authenticated landing
  const initialHistory = await sql`
    SELECT query, mode, created_at
    FROM search_history
    WHERE user_id = ${user!.id}
    ORDER BY created_at DESC
    LIMIT 10
  `

  const modelPreferenceResult = await sql`
    SELECT model_preference, selected_model
    FROM model_preferences
    WHERE user_id = ${user!.id}
    LIMIT 1
  `

  const initialModelPreference = modelPreferenceResult.rows[0] || null

  const bookmarksResult = await sql`
    SELECT b.id, sh.query, sh.response, sh.created_at, b.created_at as bookmarked_at
    FROM bookmarks b
    JOIN search_history sh ON b.search_id = sh.id
    WHERE b.user_id = ${user!.id}
    ORDER BY b.created_at DESC
    LIMIT 10
  `

  return (
    <AuthenticatedHome
      user={user!}
      initialHistory={initialHistory.rows}
      initialModelPreference={initialModelPreference}
      initialBookmarks={bookmarksResult.rows}
    />
  )
}
