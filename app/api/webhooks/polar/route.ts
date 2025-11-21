import { headers } from "next/headers"
import { updateSubscription } from "@/lib/db"
import { validateEvent } from "@polar-sh/sdk/webhooks"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()

  // Validate webhook signature using Polar's webhook secret
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET!

  let event
  try {
    event = await validateEvent(body, headersList, webhookSecret)
  } catch (err) {
    logger.error("Webhook signature verification failed:", err)
    return Response.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.created": {
        logger.info("Checkout created:", event.data.id)
        break
      }

      case "checkout.updated": {
        const checkout = event.data

        // Check if checkout is completed
        if (checkout.status === "confirmed") {
          const userId = checkout.metadata?.userId

          if (!userId) {
            logger.error("No userId in checkout metadata")
            break
          }

          // Update subscription in database
          await updateSubscription(userId, {
            polar_customer_id: checkout.customerId || "",
            polar_subscription_id: checkout.subscriptionId || "",
            plan: "pro",
            status: "active",
          })

          logger.info("Subscription created for user:", userId)
        }
        break
      }

      case "subscription.created": {
        const subscription = event.data
        logger.info("Subscription created:", subscription.id)
        break
      }

      case "subscription.updated": {
        const subscription = event.data
        const customerId = subscription.customerId

        // Map Polar status to our status
        const status =
          subscription.status === "active" ? "active" : subscription.status === "canceled" ? "canceled" : "past_due"

        logger.info("Subscription updated for customer:", customerId, "Status:", status)
        break
      }

      case "subscription.canceled": {
        const subscription = event.data
        const customerId = subscription.customerId

        logger.info("Subscription canceled for customer:", customerId)
        break
      }

      case "customer.created": {
        logger.info("Customer created:", event.data.id)
        break
      }

      case "customer.updated": {
        logger.info("Customer updated:", event.data.id)
        break
      }

      default:
        logger.info("Unhandled event type:", event.type)
    }

    return Response.json({ received: true })
  } catch (error) {
    logger.error("Webhook handler error:", error)
    return Response.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
