"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { getCheckoutSession } from "@/app/actions/polar"

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams()
  const checkoutId = searchParams.get("checkout_id")
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")

  useEffect(() => {
    async function verifyCheckout() {
      if (!checkoutId) {
        setStatus("error")
        return
      }

      try {
        const checkout = await getCheckoutSession(checkoutId)

        if (checkout.status === "confirmed") {
          setStatus("success")
        } else {
          setStatus("error")
        }
      } catch (error) {
        console.error("[v0] Failed to verify checkout:", error)
        setStatus("error")
      }
    }

    verifyCheckout()
  }, [checkoutId])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border backdrop-blur-sm bg-background/80">
        <div className="container mx-auto px-4 py-4">
          <Logo />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 mx-auto text-miami-aqua animate-spin" />
              <h1 className="text-2xl font-bold">Processing your subscription...</h1>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto text-miami-aqua" />
              <h1 className="text-3xl font-bold gradient-text">Welcome to Miami.ai Pro!</h1>
              <p className="text-muted-foreground text-balance">
                Your subscription is now active. Enjoy unlimited searches and Deep Research mode.
              </p>
              <Link href="/">
                <Button className="bg-miami-aqua hover:bg-miami-aqua/80 text-miami-dark">Start Searching</Button>
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
              <p className="text-muted-foreground">Please contact support if you continue to have issues.</p>
              <Link href="/pricing">
                <Button variant="outline">Back to Pricing</Button>
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
