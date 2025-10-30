"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PrivacyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PrivacyDialog({ open, onOpenChange }: PrivacyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Privacy Policy</DialogTitle>
          <DialogDescription>Last updated: January 29, 2025</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">1. Information We Collect</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Account information (email, name, password)</li>
                <li>Search queries and search history</li>
                <li>Usage data and preferences</li>
                <li>Device and browser information</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. How We Use Your Information</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Provide, maintain, and improve our services</li>
                <li>Personalize your search experience</li>
                <li>Save your search history for easy access</li>
                <li>Communicate with you about updates and features</li>
                <li>Detect and prevent fraud or abuse</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. Data Storage and Security</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your data is stored securely using industry-standard encryption. We use Neon PostgreSQL for database
                storage and implement security best practices including password hashing, secure session management, and
                HTTPS encryption.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Third-Party Services</h3>
              <p className="text-muted-foreground leading-relaxed">
                We use third-party services to provide our AI-powered search, including OpenAI, Anthropic, and Google.
                Your search queries may be processed by these services in accordance with their privacy policies.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Cookies and Tracking</h3>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar technologies to maintain your session, remember your preferences, and analyze
                usage patterns. You can control cookies through your browser settings.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Your Rights</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and data</li>
                <li>Export your search history</li>
                <li>Opt out of marketing communications</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Data Retention</h3>
              <p className="text-muted-foreground leading-relaxed">
                We retain your search history and account information for as long as your account is active. You can
                delete your search history at any time from your profile settings.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">8. Children's Privacy</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal
                information from children under 13.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">9. Changes to Privacy Policy</h3>
              <p className="text-muted-foreground leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any material changes by
                posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">10. Contact Us</h3>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about this privacy policy, please contact us at{" "}
                <a href="mailto:privacy@miami.ai" className="text-miami-aqua hover:underline">
                  privacy@miami.ai
                </a>
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
