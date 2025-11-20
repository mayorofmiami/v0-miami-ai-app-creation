"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function SetupImageGenerationClientPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runSetup = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/setup-image-generation")
      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || "Failed to setup database")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Image Generation Setup</h1>

        <div className="space-y-4">
          <div className="p-4 border border-border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Database Setup</h2>
            <p className="text-muted-foreground mb-4">
              This will create the necessary database tables for image generation.
            </p>
            <Button onClick={runSetup} disabled={loading} className="w-full">
              {loading ? "Setting up..." : "Setup Image Generation Database"}
            </Button>
          </div>

          {result && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <h3 className="text-lg font-semibold text-green-500 mb-2">✓ Success!</h3>
              <p className="text-sm">{result.message}</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <h3 className="text-lg font-semibold text-red-500 mb-2">✗ Error</h3>
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
