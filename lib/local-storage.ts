/**
 * Safe localStorage wrapper with error handling and SSR support
 */

const isBrowser = typeof window !== "undefined"

export const storage = {
  getItem: (key: string, defaultValue: any): any => {
    if (!isBrowser) return defaultValue

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error)
      return defaultValue
    }
  },

  setItem: (key: string, value: any): void => {
    if (!isBrowser) return

    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error)
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

// Storage keys
export const STORAGE_KEYS = {
  RECENT_SEARCHES: "miami-ai:recent-searches",
  THEME: "miami-ai:theme",
  SIDEBAR_COLLAPSED: "miami-ai:sidebar-collapsed",
  MODEL_PREFERENCE: "miami-ai:model-preference",
  CURRENT_THREAD_ID: "miami-ai:current-thread-id",
  THREADS: "miami-ai:threads",
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
    return storage.getItem(STORAGE_KEYS.CURRENT_THREAD_ID, null)
  },

  setCurrentThreadId: (threadId: string | null): void => {
    if (threadId === null) {
      storage.removeItem(STORAGE_KEYS.CURRENT_THREAD_ID)
    } else {
      storage.setItem(STORAGE_KEYS.CURRENT_THREAD_ID, threadId)
    }
  },

  getThreads: (): LocalThread[] => {
    return storage.getItem(STORAGE_KEYS.THREADS, [])
  },

  addThread: (thread: LocalThread): void => {
    const threads = threadStorage.getThreads()
    threads.unshift(thread)
    storage.setItem(STORAGE_KEYS.THREADS, threads.slice(0, 5))
  },

  updateThread: (threadId: string, updates: Partial<LocalThread>): void => {
    const threads = threadStorage.getThreads()
    const index = threads.findIndex((t) => t.id === threadId)
    if (index !== -1) {
      threads[index] = { ...threads[index], ...updates }
      storage.setItem(STORAGE_KEYS.THREADS, threads)
    }
  },

  getThread: (threadId: string): LocalThread | null => {
    const threads = threadStorage.getThreads()
    return threads.find((t) => t.id === threadId) || null
  },

  clearCurrentThread: (): void => {
    storage.removeItem(STORAGE_KEYS.CURRENT_THREAD_ID)
  },
}
