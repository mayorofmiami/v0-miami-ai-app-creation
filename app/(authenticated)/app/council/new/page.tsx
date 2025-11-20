import { Suspense } from "react"
import { CouncilBuilderView } from "@/components/council/council-builder-view"

export const metadata = {
  title: "Create Council - The Council | Miami.AI",
  description: "Build your custom Council of AI advisors with adjustable personalities",
  robots: "noindex, nofollow",
}

export default function NewCouncilPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CouncilBuilderView />
    </Suspense>
  )
}
