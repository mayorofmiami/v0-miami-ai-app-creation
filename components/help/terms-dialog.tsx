"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TermsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TermsDialog({ open, onOpenChange }: TermsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Terms of Service</DialogTitle>
          <DialogDescription>Last updated: January 29, 2025</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">1. Acceptance of Terms</h3>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using Miami.ai, you accept and agree to be bound by the terms and provision of this
                agreement. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. Use of Service</h3>
              <p className="text-muted-foreground leading-relaxed">
                Miami.ai provides AI-powered search capabilities. You agree to use the service only for lawful purposes
                and in accordance with these Terms. You agree not to use the service:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
                <li>In any way that violates any applicable law or regulation</li>
                <li>To transmit any harmful or malicious code</li>
                <li>To impersonate or attempt to impersonate Miami.ai or another user</li>
                <li>To engage in any automated use of the system without permission</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. User Accounts</h3>
              <p className="text-muted-foreground leading-relaxed">
                When you create an account with us, you must provide accurate and complete information. You are
                responsible for safeguarding your account credentials and for any activities or actions under your
                account.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Intellectual Property</h3>
              <p className="text-muted-foreground leading-relaxed">
                The service and its original content, features, and functionality are owned by Miami.ai and are
                protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Rate Limits and Usage</h3>
              <p className="text-muted-foreground leading-relaxed">
                We implement rate limits to ensure fair usage. Free users are limited to 100 queries per 24 hours.
                Registered users receive 1000 queries per 24 hours. Excessive use may result in temporary suspension.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Disclaimer</h3>
              <p className="text-muted-foreground leading-relaxed">
                Miami.ai provides AI-generated responses that may contain errors or inaccuracies. The service is
                provided "as is" without warranties of any kind. Always verify important information from authoritative
                sources.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Changes to Terms</h3>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of any material changes by
                posting the new Terms of Service on this page.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">8. Contact</h3>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms, please contact us at{" "}
                <a href="mailto:legal@miami.ai" className="text-miami-aqua hover:underline">
                  legal@miami.ai
                </a>
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
