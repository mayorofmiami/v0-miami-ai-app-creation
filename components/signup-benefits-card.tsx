"use client"

import Link from "next/link"
import { Sparkles, Zap, History, Layers } from 'lucide-react'

export function SignupBenefitsCard() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 md:px-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-background via-background to-muted/20 p-6 md:p-8 backdrop-blur-sm">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-miami-aqua/5 via-miami-blue/5 to-miami-purple/5 pointer-events-none" />
        
        <div className="relative space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-miami-aqua via-miami-blue to-miami-purple bg-clip-text text-transparent">
              Unlock the Full Experience
            </h3>
            <p className="text-sm md:text-base text-muted-foreground">
              Sign up for free to access premium features and unlimited searches
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Benefit 1 */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-miami-aqua/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-miami-aqua" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground">1,000 Searches/Day</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Up from 3 daily searches</p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-miami-blue/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-miami-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground">50 Images/Day</h4>
                <p className="text-xs text-muted-foreground mt-0.5">AI-powered image generation</p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-miami-purple/10 flex items-center justify-center">
                <Layers className="w-4 h-4 text-miami-purple" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground">All AI Models</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Access to premium models</p>
              </div>
            </div>

            {/* Benefit 4 */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-miami-aqua/10 flex items-center justify-center">
                <History className="w-4 h-4 text-miami-aqua" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground">Search History</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Save and revisit searches</p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Link href="/login" className="block">
            <button className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-miami-aqua via-miami-blue to-miami-purple text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-miami-blue/20">
              Sign Up Free
            </button>
          </Link>

          <p className="text-xs text-center text-muted-foreground">
            No credit card required
          </p>
        </div>
      </div>
    </div>
  )
}
