"use client"

import Check from "@/components/icons/Check"
import { Button } from "@/components/ui/button"

interface PricingCardProps {
  name: string
  price: string
  description: string
  features: string[]
  isPopular?: boolean
  onSubscribe?: () => void
  buttonText?: string
}

export function PricingCard({
  name,
  price,
  description,
  features,
  isPopular,
  onSubscribe,
  buttonText = "Get Started",
}: PricingCardProps) {
  return (
    <div
      className={`relative rounded-xl p-8 ${
        isPopular
          ? "bg-gradient-to-br from-miami-aqua/20 to-miami-pink/20 border-2 border-miami-aqua"
          : "bg-muted/50 border border-border"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-miami-aqua text-miami-dark text-sm font-bold rounded-full">
          Most Popular
        </div>
      )}
      <div className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold text-foreground">{name}</h3>
          <p className="text-muted-foreground mt-2 text-pretty">{description}</p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold gradient-text">{price}</span>
          {price !== "Free" && <span className="text-muted-foreground">/month</span>}
        </div>
        <Button
          onClick={onSubscribe}
          className={`w-full ${
            isPopular
              ? "bg-miami-aqua hover:bg-miami-aqua/80 text-miami-dark"
              : "bg-muted hover:bg-muted/80 text-foreground"
          }`}
        >
          {buttonText}
        </Button>
        <div className="space-y-3 pt-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <Check className={`w-5 h-5 flex-shrink-0 ${isPopular ? "text-miami-aqua" : "text-muted-foreground"}`} />
              <span className="text-sm text-foreground text-pretty">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
