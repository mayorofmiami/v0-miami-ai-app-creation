"use client"

import { Component, type ReactNode } from "react"
import AlertTriangle from "@/components/icons/AlertTriangle"
import { logger } from "@/lib/logger"

interface Props {
  children: ReactNode
  componentName?: string
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * ComponentErrorBoundary
 *
 * Lightweight error boundary for isolated component failures.
 * Prevents entire page crashes when individual components fail.
 */
export class ComponentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error(`Component error${this.props.componentName ? ` in ${this.props.componentName}` : ""}`, {
      error,
      errorInfo,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-700">
                {this.props.componentName ? `${this.props.componentName} unavailable` : "Component unavailable"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This component failed to load. The rest of the app should work normally.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
