import "server-only"

import { Polar } from "@polar-sh/sdk"

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
})

// Helper to get product IDs from environment or use defaults
export const POLAR_PRODUCT_IDS = {
  pro: process.env.POLAR_PRO_PRODUCT_ID || "your-pro-product-id",
}
