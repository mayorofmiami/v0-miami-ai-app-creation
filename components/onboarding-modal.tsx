"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Sparkles from "@/components/icons/Sparkles"
import Zap from "@/components/icons/Zap"
import Shield from "@/components/icons/Shield"
import Image from "next/image"

export function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("miami-ai-onboarding")
    if (!hasSeenOnboarding) {
      setOpen(true)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem("miami-ai-onboarding", "true")
    setOpen(false)
  }

  const steps = [
    {
      icon: (
        <Image src="/images/design-mode/MiamiAILogo.png" alt="MIAMI.AI" width={300} height={60} className="neon-glow" />
      ),
      title: "Welcome to MIAMI.AI",
      description:
        "Your AI-powered search assistant with real-time web research and citations. Get instant, accurate answers to any question.",
    },
    {
      icon: <Zap className="w-16 h-16 text-miami-pink" />,
      title: "Quick Search",
      description: "Get fast answers in seconds. Perfect for quick facts, definitions, and straightforward questions.",
    },
    {
      icon: <Sparkles className="w-16 h-16 text-miami-blue" />,
      title: "Deep Research",
      description:
        "Activate Deep Research mode for comprehensive analysis with multiple sources and detailed citations.",
    },
    {
      icon: <Shield className="w-16 h-16 text-miami-pink" />,
      title: "Free & Pro Plans",
      description: "Start with 10 free searches per day. Upgrade to Pro for unlimited searches at $9.99/month.",
    },
  ]

  const currentStep = steps[step]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md bg-background border-miami-pink/20">
        <DialogHeader>
          <div className="flex justify-center mb-4">{currentStep.icon}</div>
          <DialogTitle className="text-2xl text-center gradient-text">{currentStep.title}</DialogTitle>
          <DialogDescription className="text-center text-base pt-2">{currentStep.description}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between pt-4">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-all ${i === step ? "bg-miami-pink w-6" : "bg-muted"}`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {step < steps.length - 1 ? (
              <>
                <Button variant="ghost" onClick={handleComplete}>
                  Skip
                </Button>
                <Button
                  onClick={() => setStep(step + 1)}
                  className="bg-gradient-to-r from-miami-pink to-miami-blue hover:opacity-90"
                >
                  Next
                </Button>
              </>
            ) : (
              <Button
                onClick={handleComplete}
                className="bg-gradient-to-r from-miami-pink to-miami-blue hover:opacity-90"
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
