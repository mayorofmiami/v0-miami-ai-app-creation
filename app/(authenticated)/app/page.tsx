import { AuthenticatedLanding } from "@/components/landing/authenticated-landing-clean"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

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

  return <AuthenticatedLanding user={user} />
}
