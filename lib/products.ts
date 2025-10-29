export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  features: string[]
}

export const PRODUCTS: Product[] = [
  {
    id: "miami-ai-pro",
    name: "Miami.ai Pro",
    description: "Unlimited AI searches with Deep Research mode",
    priceInCents: 999, // $9.99/month
    features: ["Unlimited searches", "Deep Research mode", "Priority support", "Search history", "Advanced citations"],
  },
]
