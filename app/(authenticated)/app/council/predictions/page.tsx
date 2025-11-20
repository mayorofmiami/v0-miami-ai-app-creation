import { Suspense } from "react"
import { PredictionsView } from "@/components/council/predictions-view"

export const metadata = {
  title: "Predictions - The Council | Miami.AI",
  description: "Track and verify your Council's predictions",
  robots: "noindex, nofollow",
}

export default function PredictionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PredictionsView />
    </Suspense>
  )
}
