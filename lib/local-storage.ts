/**
 * Safe localStorage wrapper with error handling, SSR support, and size limits
 */

const isBrowser = typeof window !== "undefined"

const CACHE_EXPIRATION_MS = 60 * 60 * 1000 // 1 hour
const MAX_STORAGE_SIZE = 4 * 1024 * 1024 // 4MB limit (localStorage is typically 5-10MB)
const MAX_CACHE_ENTRIES = 50 // Maximum number of cache entries
const MAINTENANCE_INTERVAL_MS = 60 * 60 * 1000 // 1 hour between maintenance checks
const STORAGE_WARNING_THRESHOLD = 0.8 // Warn at 80% capacity

function getStorageSize(): number {
  if (!isBrowser) return 0

  let totalSize = 0
  try {
    for (const key in window.localStorage) {
      if (window.localStorage.hasOwnProperty(key) && key.startsWith("miami-ai:")) {
        totalSize += window.localStorage[key].length + key.length
      }
    }
  } catch (error) {
    console.error("Error calculating storage size:", error)
  }
  return totalSize
}

function cleanOldCacheEntries(): void {
  if (!isBrowser) return

  try {
    const cacheKeys = Object.keys(window.localStorage).filter(
      (key) => key.startsWith("miami-ai:") && !key.includes("theme") && !key.includes("model-preference"),
    )

    // Sort by timestamp (older first)
    const entriesWithAge = cacheKeys
      .map((key) => {
        try {
          const item = window.localStorage.getItem(key)
          if (!item) return { key, timestamp: 0 }
          const parsed = JSON.parse(item)
          return { key, timestamp: parsed.timestamp || 0 }
        } catch {
          return { key, timestamp: 0 }
        }
      })
      .sort((a, b) => a.timestamp - b.timestamp)

    // Remove oldest 25% of entries
    const toRemove = Math.ceil(entriesWithAge.length * 0.25)
    for (let i = 0; i < toRemove; i++) {
      window.localStorage.removeItem(entriesWithAge[i].key)
    }

    console.log(`[v0] Cleaned ${toRemove} old cache entries to free up space`)
  } catch (error) {
    console.error("Error cleaning cache entries:", error)
  }
}

function shouldPerformMaintenance(): boolean {
  if (!isBrowser) return false

  try {
    const lastMaintenanceStr = window.localStorage.getItem("miami-ai:last-maintenance")
    const lastMaintenance = lastMaintenanceStr ? Number.parseInt(lastMaintenanceStr) : 0
    const now = Date.now()

    return now - lastMaintenance > MAINTENANCE_INTERVAL_MS
  } catch {
    return false
  }
}

function performMaintenance(): void {
  if (!isBrowser) return

  try {
    const currentSize = getStorageSize()

    // Clean if we're at 80% capacity
    if (currentSize > MAX_STORAGE_SIZE * STORAGE_WARNING_THRESHOLD) {
      console.warn(
        `[v0] Storage at ${Math.round((currentSize / MAX_STORAGE_SIZE) * 100)}% capacity, cleaning old entries`,
      )
      cleanOldCacheEntries()
    }

    // Update last maintenance timestamp
    window.localStorage.setItem("miami-ai:last-maintenance", Date.now().toString())
  } catch (error) {
    console.error("Error performing maintenance:", error)
  }
}

export const storage = {
  getItem: (key: string, defaultValue: any): any => {
    if (!isBrowser) return defaultValue

    try {
      const item = window.localStorage.getItem(key)
      if (!item) return defaultValue

      const parsed = JSON.parse(item)

      if (parsed.timestamp && Date.now() - parsed.timestamp > CACHE_EXPIRATION_MS) {
        window.localStorage.removeItem(key)
        return defaultValue
      }

      return parsed
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error)
      return defaultValue
    }
  },

  setItem: (key: string, value: any): void => {
    if (!isBrowser) return

    try {
      const dataToStore =
        value && typeof value === "object" && !Array.isArray(value) ? { ...value, timestamp: Date.now() } : value

      const serialized = JSON.stringify(dataToStore)

      if (shouldPerformMaintenance()) {
        performMaintenance()
      }

      window.localStorage.setItem(key, serialized)
    } catch (error) {
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        console.error(`[v0] localStorage quota exceeded, cleaning old entries`)
        cleanOldCacheEntries()

        // Try again after cleaning
        try {
          const dataToStore =
            value && typeof value === "object" && !Array.isArray(value) ? { ...value, timestamp: Date.now() } : value
          window.localStorage.setItem(key, JSON.stringify(dataToStore))
        } catch (retryError) {
          console.error(`[v0] Failed to save ${key} even after cleaning:`, retryError)
        }
      } else {
        console.error(`Error writing to localStorage (${key}):`, error)
      }
    }
  },

  removeItem: (key: string): void => {
    if (!isBrowser) return

    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error)
    }
  },

  clear: (): void => {
    if (!isBrowser) return

    try {
      window.localStorage.clear()
    } catch (error) {
      console.error("Error clearing localStorage:", error)
    }
  },
}

// Storage keys - only for authenticated users
export const STORAGE_KEYS = {
  SIDEBAR_COLLAPSED: "miami-ai:sidebar-collapsed",
} as const

export interface LocalThread {
  id: string
  title: string
  queries: string[]
  lastMessageAt: number
  messageCount: number
}

export const threadStorage = {
  getCurrentThreadId: (): string | null => {
    return storage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, null)
  },

  setCurrentThreadId: (threadId: string | null): void => {
    if (threadId === null) {
      storage.removeItem(STORAGE_KEYS.SIDEBAR_COLLAPSED)
    } else {
      storage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, threadId)
    }
  },

  getThreads: (): LocalThread[] => {
    return storage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, [])
  },

  addThread: (thread: LocalThread): void => {
    const threads = threadStorage.getThreads()
    threads.unshift(thread)
    storage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, threads.slice(0, MAX_CACHE_ENTRIES))
  },

  updateThread: (threadId: string, updates: Partial<LocalThread>): void => {
    const threads = threadStorage.getThreads()
    const index = threads.findIndex((t) => t.id === threadId)
    if (index !== -1) {
      threads[index] = { ...threads[index], ...updates }
      storage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, threads)
    }
  },

  getThread: (threadId: string): LocalThread | null => {
    const threads = threadStorage.getThreads()
    return threads.find((t) => t.id === threadId) || null
  },

  clearCurrentThread: (): void => {
    storage.removeItem(STORAGE_KEYS.SIDEBAR_COLLAPSED)
  },
}
