import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import ArrowLeft from "@/components/icons/ArrowLeft"
import Sparkles from "@/components/icons/Sparkles"
import Link from "next/link"

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border backdrop-blur-sm sticky top-0 z-40 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold gradient-text">Pricing Plans</h1>
            <p className="text-xl text-muted-foreground text-balance">
              Miami.ai is currently free for all users while we build out premium features.
            </p>
          </div>

          {/* Coming Soon Card */}
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-miami-pink to-miami-aqua rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300" />

            {/* Card */}
            <div className="relative rounded-2xl border-2 border-border bg-card p-12 space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-miami-aqua/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-miami-aqua" />
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl font-bold">Pro Plans Coming Soon</h2>
                <p className="text-lg text-muted-foreground">
                  We're working on premium tiers with advanced features like unlimited searches, priority support, and
                  exclusive AI models.
                </p>
              </div>

              <div className="pt-6 space-y-3">
                <p className="text-sm text-muted-foreground">
                  For now, enjoy unlimited access to all features completely free!
                </p>
                <Link href="/">
                  <Button size="lg" className="bg-gradient-to-r from-miami-pink to-miami-aqua hover:opacity-90">
                    Start Searching
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Features Preview */}
          <div className="pt-8 space-y-4">
            <h3 className="text-xl font-semibold">Currently Available (Free)</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-left">
              <div className="rounded-lg border border-border bg-card/50 p-4">
                <div className="flex items-center gap-2 text-miami-aqua mb-2">
                  <div className="w-2 h-2 rounded-full bg-miami-aqua" />
                  <span className="font-medium">Unlimited Searches</span>
                </div>
                <p className="text-sm text-muted-foreground">Search as much as you want, no limits</p>
              </div>
              <div className="rounded-lg border border-border bg-card/50 p-4">
                <div className="flex items-center gap-2 text-miami-pink mb-2">
                  <div className="w-2 h-2 rounded-full bg-miami-pink" />
                  <span className="font-medium">Deep Research Mode</span>
                </div>
                <p className="text-sm text-muted-foreground">Get comprehensive, detailed answers</p>
              </div>
              <div className="rounded-lg border border-border bg-card/50 p-4">
                <div className="flex items-center gap-2 text-miami-aqua mb-2">
                  <div className="w-2 h-2 rounded-full bg-miami-aqua" />
                  <span className="font-medium">Search History</span>
                </div>
                <p className="text-sm text-muted-foreground">Access all your past searches</p>
              </div>
              <div className="rounded-lg border border-border bg-card/50 p-4">
                <div className="flex items-center gap-2 text-miami-pink mb-2">
                  <div className="w-2 h-2 rounded-full bg-miami-pink" />
                  <span className="font-medium">Verified Citations</span>
                </div>
                <p className="text-sm text-muted-foreground">All answers backed by sources</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
