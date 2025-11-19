import { Suspense } from "react"
import { CouncilDebateView } from "@/components/council/council-debate-view"

export const metadata = {
  title: "Council Debate - The Council | Miami.ai",
  description: "Watch your Council of AI advisors debate and provide recommendations",
}

export default function CouncilDebatePage({ params }: { params: { councilId: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading debate...</div>}>
      <CouncilDebateView councilId={params.councilId} />
    </Suspense>
  )
}
