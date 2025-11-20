import { DebateHistoryView } from "@/components/council/debate-history-view"
import { Suspense } from "react"

export const metadata = {
  title: "Debate History - The Council | Miami.AI",
  description: "Browse, search, and revisit your past Council debates",
  robots: "noindex, nofollow",
}

export default function DebateHistoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <DebateHistoryView />
    </Suspense>
  )
}
