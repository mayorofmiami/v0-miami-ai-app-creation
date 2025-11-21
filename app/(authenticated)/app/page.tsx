import { AuthenticatedLanding } from "@/components/landing/authenticated-landing"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getSearchHistory, getModelPreference } from "@/lib/db"
import { getBookmarks } from "@/lib/bookmarks"

export const metadata = {
  title: "Search - Miami.AI",
  description: "AI-powered search with real-time results and citations",
  robots: "noindex, nofollow",
}

export default async function AuthenticatedHomePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/")
  }

  const [history, modelPreference, bookmarks] = await Promise.all([
    getSearchHistory(user.id, 50).catch(() => []),
    getModelPreference(user.id).catch(() => null),
    getBookmarks(user.id).catch(() => []),
  ])

  return (
    <AuthenticatedLanding
      user={user}
      initialHistory={history}
      initialModelPreference={modelPreference}
      initialBookmarks={bookmarks}
    />
  )
}
