import { UnauthenticatedLanding } from "@/components/landing/unauthenticated-landing"

export const metadata = {
  title: "Miami.AI - AI-Powered Search Engine",
  description:
    "Get instant answers with real-time web research and citations. Your intelligent search companion powered by AI.",
}

export default function HomePage() {
  return <UnauthenticatedLanding />
}
