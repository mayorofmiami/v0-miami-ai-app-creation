import { Suspense } from "react"
import { CouncilDebateView } from "@/components/council/council-debate-view"

export const metadata = {
  title: "Council Debate - The Council | Miami.AI",
  description: "Watch your Council of AI advisors debate and provide recommendations",
  robots: "noindex, nofollow",
}

export default async function CouncilDebatePage({
  params,
}: {
  params: Promise<{ councilId: string }>
}) {
  const { councilId } = await params

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading debate...</div>}>
      <CouncilDebateView councilId={councilId} />
    </Suspense>
  )
}
