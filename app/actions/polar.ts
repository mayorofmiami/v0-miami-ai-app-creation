"use server"

import { headers } from "next/headers"
import { polar, POLAR_PRODUCT_IDS } from "@/lib/polar"

export async function startCheckoutSession(productId: string, userId: string, userEmail: string) {
  const headersList = await headers()
  const origin = headersList.get("origin") || "http://localhost:3000"

  // Map our product ID to Polar product ID
  const polarProductId = productId === "miami-ai-pro" ? POLAR_PRODUCT_IDS.pro : POLAR_PRODUCT_IDS.pro

  try {
    // Create checkout session with Polar
    const checkout = await polar.checkouts.create({
      productId: polarProductId,
      customerEmail: userEmail,
      successUrl: `${origin}/subscription/success?checkout_id={CHECKOUT_ID}`,
      metadata: {
        userId,
        productId,
      },
    })

    return {
      checkoutId: checkout.id,
      checkoutUrl: checkout.url,
    }
  } catch (error) {
    throw new Error("Failed to create checkout session")
  }
}

export async function getCheckoutSession(checkoutId: string) {
  try {
    const checkout = await polar.checkouts.get({ id: checkoutId })
    return checkout
  } catch (error) {
    throw new Error("Failed to get checkout session")
  }
}

export async function createCustomerPortalUrl(customerId: string) {
  // Polar uses a different approach - customers can manage subscriptions through their dashboard
  // Return the Polar customer portal URL
  return `https://polar.sh/customer/${customerId}`
}
