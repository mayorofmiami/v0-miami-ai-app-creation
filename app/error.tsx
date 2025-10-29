"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[v0] Page error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Oops! Something went wrong</h1>
          <p className="text-muted-foreground">{error.message || "An unexpected error occurred"}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} className="bg-miami-pink hover:bg-miami-pink/90">
            Try Again
          </Button>
          <Link href="/">
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
