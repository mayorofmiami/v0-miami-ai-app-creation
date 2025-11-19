import { Suspense } from "react"
import { PredictionsView } from "@/components/council/predictions-view"

export const metadata = {
  title: "Predictions - The Council | Miami.ai",
  description: "Track and verify your Council's predictions",
}

export default function PredictionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PredictionsView />
    </Suspense>
  )
}
