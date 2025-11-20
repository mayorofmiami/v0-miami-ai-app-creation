import { AuthenticatedHome } from "@/components/authenticated-home"

export const metadata = {
  title: "Search - Miami.AI",
  description: "AI-powered search with real-time results and citations",
  robots: "noindex, nofollow",
}

export default function AuthenticatedHomePage() {
  return <AuthenticatedHome />
}
