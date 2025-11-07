"use client"

import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import AlertTriangle from "@/components/icons/AlertTriangle"
import Home from "@/components/icons/Home"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * RouteErrorBoundary
 *
 * Error boundary for page-level/route errors.
 * Provides navigation options and full page error UI.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("[v0] Route error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="text-center space-y-6 max-w-md">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Page Error</h1>
              <p className="text-lg text-muted-foreground">
                {this.state.error?.message || "This page encountered an error and couldn't load properly."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => (window.location.href = "/")} className="gap-2">
                <Home className="w-4 h-4" />
                Go Home
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline">
                Reload Page
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">If this problem persists, please contact support.</p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
