// Model temperature constants
export const MODEL_TEMPERATURES = {
  CREATIVE: 0.8, // For creative tasks, related searches
  BALANCED: 0.7, // Default for most searches
  PRECISE: 0.6, // For debates, analysis
  DETERMINISTIC: 0.3, // For titles, structured output
} as const

// Rate limit constants
export const RATE_LIMITS = {
  FREE_USER_DAILY: 1000,
  FREE_USER_HOURLY: 100,
  ATTACHMENT_LIMIT: 50,
  PREMIUM_MULTIPLIER: 10,
} as const

// Cache durations (in seconds)
export const CACHE_DURATIONS = {
  SEARCH_RESULT: 3600, // 1 hour
  WEB_SEARCH: 3600, // 1 hour
  MODEL_PREFERENCE: 86400, // 24 hours
} as const

// API timeouts (in milliseconds)
export const TIMEOUTS = {
  SEARCH: 30000, // 30 seconds
  IMAGE_GEN: 60000, // 60 seconds
} as const
