"use client"

import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import AlertTriangle from "@/components/icons/AlertTriangle"
import RefreshCw from "@/components/icons/RefreshCw"
import { logger } from "@/lib/logger"

interface Props {
  children: ReactNode
  onRetry?: () => void
  fallbackMessage?: string
}

interface State {
  hasError: boolean
  error?: Error
  errorCount: number
}

/**
 * SearchErrorBoundary
 *
 * Specialized error boundary for search operations.
 * Provides retry functionality and graceful degradation.
 */
export class SearchErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorCount: 0 }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error("Search error caught", { error, errorInfo })
    this.setState((prev) => ({ errorCount: prev.errorCount + 1 }))
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
    this.props.onRetry?.()
  }

  render() {
    if (this.state.hasError) {
      const isRecurringError = this.state.errorCount > 2

      return (
        <div className="p-6 rounded-lg border border-red-500/20 bg-red-500/5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-red-500">Search Error</h3>
              <p className="text-sm text-muted-foreground">
                {this.props.fallbackMessage ||
                  this.state.error?.message ||
                  "Failed to complete search. Please try again."}
              </p>
              {isRecurringError && (
                <p className="text-sm text-amber-600">
                  This error has occurred multiple times. Please refresh the page or contact support if it persists.
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={this.handleRetry} variant="outline" className="gap-2 bg-transparent">
                  <RefreshCw className="w-4 h-4" />
                  Retry Search
                </Button>
                <Button size="sm" onClick={() => window.location.reload()} variant="ghost">
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
