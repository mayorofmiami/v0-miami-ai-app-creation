"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import AlertTriangle from "@/components/icons/AlertTriangle"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // global error boundaries should use external error tracking
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-[#111] p-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">Critical Error</h1>
              <p className="text-gray-400">Something went critically wrong. Please refresh the page.</p>
            </div>
            <Button onClick={reset} className="bg-[#FFB6C1] hover:bg-[#FFB6C1]/90">
              Refresh Page
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}
