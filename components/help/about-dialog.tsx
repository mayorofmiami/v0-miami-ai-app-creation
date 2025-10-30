"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AboutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-miami-aqua to-miami-pink bg-clip-text text-transparent">
            About Miami.ai
          </DialogTitle>
          <DialogDescription>Your intelligent search companion for Miami and beyond</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">What is Miami.ai?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Miami.ai is an advanced AI-powered search engine designed to provide intelligent, contextual answers to
                your questions. Whether you're researching Miami's tech scene, exploring local real estate, or diving
                into complex topics, Miami.ai delivers comprehensive, cited responses powered by cutting-edge AI
                technology.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                We're building the future of search - one that understands context, provides accurate information with
                sources, and helps you discover insights faster than ever before. Miami.ai combines the power of
                multiple AI models with real-time web search to give you the best possible answers.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Features</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Quick Search for instant answers</li>
                <li>Deep Research for comprehensive analysis</li>
                <li>Multiple AI models (GPT-4, Claude, Gemini, and more)</li>
                <li>Real-time web search with citations</li>
                <li>Search history and personalization</li>
                <li>Mobile-friendly progressive web app</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Contact Us</h3>
              <p className="text-muted-foreground leading-relaxed">
                Have questions or feedback? Reach out to us at{" "}
                <a href="mailto:support@miami.ai" className="text-miami-aqua hover:underline">
                  support@miami.ai
                </a>
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
