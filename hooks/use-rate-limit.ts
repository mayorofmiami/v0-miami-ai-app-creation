"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { toast } from "@/lib/toast"

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  message?: string
}

interface RateLimitState {
  isLimited: boolean
  remaining: number
  resetTime: number | null
}

/**
 * Client-side rate limiting hook
 * Prevents users from spamming requests
 */
export function useRateLimit(config: RateLimitConfig) {
  const { maxRequests, windowMs, message = "Too many requests. Please wait." } = config

  const [state, setState] = useState<RateLimitState>({
    isLimited: false,
    remaining: maxRequests,
    resetTime: null,
  })

  const requestTimestamps = useRef<number[]>([])
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Clean up old timestamps outside the window
  const cleanupTimestamps = useCallback(() => {
    const now = Date.now()
    requestTimestamps.current = requestTimestamps.current.filter((timestamp) => now - timestamp < windowMs)
  }, [windowMs])

  // Reset rate limit
  const reset = useCallback(() => {
    requestTimestamps.current = []
    setState({
      isLimited: false,
      remaining: maxRequests,
      resetTime: null,
    })
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = null
    }
  }, [maxRequests])

  // Check if request is allowed
  const checkLimit = useCallback((): boolean => {
    cleanupTimestamps()

    const now = Date.now()
    const recentRequests = requestTimestamps.current.length

    if (recentRequests >= maxRequests) {
      const oldestRequest = requestTimestamps.current[0]
      const resetTime = oldestRequest + windowMs

      setState({
        isLimited: true,
        remaining: 0,
        resetTime,
      })

      // Set timeout to auto-reset
      if (!resetTimeoutRef.current) {
        const timeUntilReset = resetTime - now
        resetTimeoutRef.current = setTimeout(() => {
          reset()
          toast.success("Rate limit reset. You can search again.")
        }, timeUntilReset)
      }

      // Calculate seconds until reset
      const secondsUntilReset = Math.ceil((resetTime - now) / 1000)
      toast.error(`${message} Please wait ${secondsUntilReset} second${secondsUntilReset !== 1 ? "s" : ""}.`)

      return false
    }

    // Request is allowed
    requestTimestamps.current.push(now)
    setState({
      isLimited: false,
      remaining: maxRequests - (recentRequests + 1),
      resetTime: null,
    })

    return true
  }, [cleanupTimestamps, maxRequests, windowMs, message, reset])

  // Attempt to execute a function with rate limiting
  const attempt = useCallback(
    async (fn: () => Promise<any> | any): Promise<any | null> => {
      if (!checkLimit()) {
        return null
      }
      return await fn()
    },
    [checkLimit],
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [])

  return {
    ...state,
    checkLimit,
    attempt,
    reset,
  }
}

/**
 * Preset configurations for common use cases
 */
export const RATE_LIMIT_PRESETS = {
  // 5 searches per minute
  search: {
    maxRequests: 5,
    windowMs: 60 * 1000,
    message: "Too many searches.",
  },
  // 3 image generations per minute
  imageGeneration: {
    maxRequests: 3,
    windowMs: 60 * 1000,
    message: "Too many image generation requests.",
  },
  // 10 API calls per minute (general)
  api: {
    maxRequests: 10,
    windowMs: 60 * 1000,
    message: "Too many requests.",
  },
}
