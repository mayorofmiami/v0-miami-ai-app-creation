"use client"

import { useEffect, useState } from "react"
import { startCheckoutSession } from "@/app/actions/polar"
import X from "@/components/icons/X"

interface CheckoutModalProps {
  productId: string
  userId: string
  userEmail: string
  onClose: () => void
}

export function CheckoutModal({ productId, userId, userEmail, onClose }: CheckoutModalProps) {
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function initCheckout() {
      try {
        const { checkoutUrl } = await startCheckoutSession(productId, userId, userEmail)
        setCheckoutUrl(checkoutUrl)
      } catch (err) {
        setError("Failed to start checkout session")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    initCheckout()
  }, [productId, userId, userEmail])

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="p-6 h-full">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-miami-aqua"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">{error}</p>
              <button onClick={onClose} className="mt-4 text-miami-aqua hover:underline">
                Close
              </button>
            </div>
          ) : checkoutUrl ? (
            <iframe
              src={checkoutUrl}
              className="w-full h-[calc(90vh-3rem)] rounded-lg border-0"
              title="Polar Checkout"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
