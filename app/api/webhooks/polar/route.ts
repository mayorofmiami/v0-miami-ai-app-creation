import { headers } from "next/headers"
import { updateSubscription } from "@/lib/db"
import { validateEvent } from "@polar-sh/sdk/webhooks"

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()

  // Validate webhook signature using Polar's webhook secret
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET!

  let event
  try {
    event = await validateEvent(body, headersList, webhookSecret)
  } catch (err) {
    console.error("[v0] Webhook signature verification failed:", err)
    return Response.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.created": {
        console.log("[v0] Checkout created:", event.data.id)
        break
      }

      case "checkout.updated": {
        const checkout = event.data

        // Check if checkout is completed
        if (checkout.status === "confirmed") {
          const userId = checkout.metadata?.userId

          if (!userId) {
            console.error("[v0] No userId in checkout metadata")
            break
          }

          // Update subscription in database
          await updateSubscription(userId, {
            polar_customer_id: checkout.customerId || "",
            polar_subscription_id: checkout.subscriptionId || "",
            plan: "pro",
            status: "active",
          })

          console.log("[v0] Subscription created for user:", userId)
        }
        break
      }

      case "subscription.created": {
        const subscription = event.data
        console.log("[v0] Subscription created:", subscription.id)
        break
      }

      case "subscription.updated": {
        const subscription = event.data
        const customerId = subscription.customerId

        // Map Polar status to our status
        const status =
          subscription.status === "active" ? "active" : subscription.status === "canceled" ? "canceled" : "past_due"

        console.log("[v0] Subscription updated for customer:", customerId, "Status:", status)
        break
      }

      case "subscription.canceled": {
        const subscription = event.data
        const customerId = subscription.customerId

        console.log("[v0] Subscription canceled for customer:", customerId)
        break
      }

      case "customer.created": {
        console.log("[v0] Customer created:", event.data.id)
        break
      }

      case "customer.updated": {
        console.log("[v0] Customer updated:", event.data.id)
        break
      }

      default:
        console.log("[v0] Unhandled event type:", event.type)
    }

    return Response.json({ received: true })
  } catch (error) {
    console.error("[v0] Webhook handler error:", error)
    return Response.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
