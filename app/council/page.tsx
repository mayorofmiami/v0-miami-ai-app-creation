import { CouncilLandingView } from "@/components/council/council-landing-view"
import { Suspense } from "react"

export const metadata = {
  title: "The Council - AI Advisory Board | Miami.ai",
  description: "Summon your Council of AI advisors with custom personalities to debate important decisions",
}

export default function CouncilPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CouncilLandingView />
    </Suspense>
  )
}
