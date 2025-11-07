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
} as const
