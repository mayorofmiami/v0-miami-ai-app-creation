"use client"

import type React from "react"

import { useState } from "react"
import { signInAction } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"

export default function LoginPage() {
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await signInAction(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Image
              src="/images/design-mode/MiamiAILogo.png"
              alt="MIAMI.AI"
              width={300}
              height={60}
              className="neon-glow"
            />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
          <p className="text-muted-foreground">Sign in to your Miami.AI account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                disabled={loading}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={loading}
                className="bg-background/50"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">{error}</div>
          )}

          <Button type="submit" className="w-full bg-miami-pink hover:bg-miami-pink/90" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/signup" className="text-miami-blue hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
