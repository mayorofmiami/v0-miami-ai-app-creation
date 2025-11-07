"use client"

import { useState, useCallback } from "react"
import type { Citation, SearchMode } from "@/types"
import { getCachedSearchResult, cacheSearchResult } from "@/lib/redis"

/**
 * useSearchCache Hook
 *
 * Manages search result caching with automatic cache key generation,
 * TTL management, and cache invalidation strategies.
 */

export interface CachedSearchResult {
  response: string
  citations: Citation[]
  cachedAt: number
}

interface UseSearchCacheOptions {
  enabled?: boolean
  ttl?: number // Time to live in seconds
  staleTime?: number // Time before cache is considered stale (but still usable)
}

export function useSearchCache(options: UseSearchCacheOptions = {}) {
  const { enabled = true, ttl = 86400, staleTime = 3600 } = options

  const [cacheStatus, setCacheStatus] = useState<"idle" | "hit" | "miss" | "stale">("idle")
  const [lastCacheTime, setLastCacheTime] = useState<number | null>(null)

  const getCached = useCallback(
    async (query: string, mode: SearchMode): Promise<CachedSearchResult | null> => {
      if (!enabled) {
        setCacheStatus("idle")
        return null
      }

      try {
        const cached = await getCachedSearchResult(query, mode)

        if (!cached) {
          setCacheStatus("miss")
          return null
        }

        const age = Date.now() - cached.cachedAt
        const isStale = age > staleTime * 1000

        setCacheStatus(isStale ? "stale" : "hit")
        setLastCacheTime(cached.cachedAt)

        return cached
      } catch (error) {
        console.error("[v0] Cache read error:", error)
        setCacheStatus("miss")
        return null
      }
    },
    [enabled, staleTime],
  )

  const setCached = useCallback(
    async (query: string, mode: SearchMode, response: string, citations: Citation[]): Promise<void> => {
      if (!enabled) return

      try {
        await cacheSearchResult(query, mode, response, citations)
        setLastCacheTime(Date.now())
      } catch (error) {
        console.error("[v0] Cache write error:", error)
      }
    },
    [enabled],
  )

  const isCacheStale = useCallback(() => {
    if (!lastCacheTime) return true
    const age = Date.now() - lastCacheTime
    return age > staleTime * 1000
  }, [lastCacheTime, staleTime])

  const getCacheAge = useCallback(() => {
    if (!lastCacheTime) return null
    return Math.floor((Date.now() - lastCacheTime) / 1000)
  }, [lastCacheTime])

  const shouldRefresh = useCallback(() => {
    return cacheStatus === "miss" || cacheStatus === "stale"
  }, [cacheStatus])

  return {
    getCached,
    setCached,
    cacheStatus,
    isCacheStale,
    getCacheAge,
    shouldRefresh,
    lastCacheTime,
  }
}

/**
 * useSearchWithCache Hook
 *
 * High-level hook that combines search execution with automatic caching.
 * Handles cache-first strategy with background refresh for stale data.
 */

interface UseSearchWithCacheOptions extends UseSearchCacheOptions {
  onCacheHit?: (result: CachedSearchResult) => void
  onCacheMiss?: () => void
}

export function useSearchWithCache(options: UseSearchWithCacheOptions = {}) {
  const { onCacheHit, onCacheMiss, ...cacheOptions } = options
  const cache = useSearchCache(cacheOptions)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const searchWithCache = useCallback(
    async (
      query: string,
      mode: SearchMode,
      searchFn: (query: string, mode: SearchMode) => Promise<{ response: string; citations: Citation[] }>,
    ): Promise<{ response: string; citations: Citation[]; fromCache: boolean }> => {
      // Try cache first
      const cached = await cache.getCached(query, mode)

      if (cached) {
        onCacheHit?.(cached)

        // If stale, refresh in background
        if (cache.isCacheStale()) {
          setIsRefreshing(true)
          searchFn(query, mode)
            .then((result) => {
              cache.setCached(query, mode, result.response, result.citations)
            })
            .catch((error) => console.error("[v0] Background refresh error:", error))
            .finally(() => setIsRefreshing(false))
        }

        return { ...cached, fromCache: true }
      }

      // Cache miss - execute search
      onCacheMiss?.()
      const result = await searchFn(query, mode)
      await cache.setCached(query, mode, result.response, result.citations)

      return { ...result, fromCache: false }
    },
    [cache, onCacheHit, onCacheMiss],
  )

  return {
    searchWithCache,
    isRefreshing,
    ...cache,
  }
}
