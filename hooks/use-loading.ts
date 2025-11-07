"use client"

import { useState, useCallback, useRef } from "react"

/**
 * useLoading Hook
 *
 * Manages loading states with automatic error handling and race condition prevention.
 * Supports multiple concurrent loading operations and timeout handling.
 */

interface UseLoadingOptions {
  timeout?: number
  onTimeout?: () => void
  onError?: (error: Error) => void
}

export function useLoading(options: UseLoadingOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const loadingCountRef = useRef(0)
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)

  const startLoading = useCallback(() => {
    loadingCountRef.current += 1
    setIsLoading(true)
    setError(null)

    if (options.timeout) {
      timeoutIdRef.current = setTimeout(() => {
        options.onTimeout?.()
        stopLoading()
      }, options.timeout)
    }
  }, [options])

  const stopLoading = useCallback(() => {
    loadingCountRef.current = Math.max(0, loadingCountRef.current - 1)

    if (loadingCountRef.current === 0) {
      setIsLoading(false)
    }

    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
      timeoutIdRef.current = null
    }
  }, [])

  const setLoadingError = useCallback(
    (err: Error) => {
      setError(err)
      stopLoading()
      options.onError?.(err)
    },
    [stopLoading, options],
  )

  const withLoading = useCallback(
    async <T,>(asyncFn: () => Promise<T>): Promise<T | null> => {
      startLoading()
      try {
        const result = await asyncFn()
        stopLoading()
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setLoadingError(error)
        return null
      }
    },
    [startLoading, stopLoading, setLoadingError],
  )

  const reset = useCallback(() => {
    loadingCountRef.current = 0
    setIsLoading(false)
    setError(null)
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
      timeoutIdRef.current = null
    }
  }, [])

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    withLoading,
    reset,
  }
}

/**
 * useMultipleLoading Hook
 *
 * Manages multiple named loading states simultaneously.
 * Useful for components that need to track different operations independently.
 */

export function useMultipleLoading() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const startLoading = useCallback((key: string) => {
    setLoadingStates((prev) => ({ ...prev, [key]: true }))
  }, [])

  const stopLoading = useCallback((key: string) => {
    setLoadingStates((prev) => ({ ...prev, [key]: false }))
  }, [])

  const isLoading = useCallback((key: string) => loadingStates[key] === true, [loadingStates])

  const isAnyLoading = useCallback(() => Object.values(loadingStates).some((state) => state), [loadingStates])

  const withLoading = useCallback(
    async <T,>(key: string, asyncFn: () => Promise<T>): Promise<T | null> => {
      startLoading(key)
      try {
        const result = await asyncFn()
        stopLoading(key)
        return result
      } catch (error) {
        stopLoading(key)
        throw error
      }
    },
    [startLoading, stopLoading],
  )

  const reset = useCallback((key?: string) => {
    if (key) {
      setLoadingStates((prev) => ({ ...prev, [key]: false }))
    } else {
      setLoadingStates({})
    }
  }, [])

  return {
    loadingStates,
    startLoading,
    stopLoading,
    isLoading,
    isAnyLoading,
    withLoading,
    reset,
  }
}
