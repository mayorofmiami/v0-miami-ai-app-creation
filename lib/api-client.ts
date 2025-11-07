import { requestDeduplicator } from "./request-deduplicator"

type FetchOptions = RequestInit & {
  timeout?: number
  retry?: number
  retryDelay?: number
  dedupe?: boolean
}

interface ApiError extends Error {
  status?: number
  data?: any
}

class ApiClient {
  private baseUrl: string
  private defaultOptions: RequestInit

  constructor(baseUrl = "", defaultOptions: RequestInit = {}) {
    this.baseUrl = baseUrl
    this.defaultOptions = {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...defaultOptions.headers,
      },
      ...defaultOptions,
    }
  }

  private async fetchWithTimeout(url: string, options: FetchOptions): Promise<Response> {
    const { timeout = 30000, dedupe = true, ...fetchOptions } = options

    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)

    try {
      const fetchFn =
        dedupe && (fetchOptions.method === "GET" || fetchOptions.method === "POST")
          ? (u: string, o: RequestInit) => requestDeduplicator.fetch(u, o)
          : fetch

      const response = await fetchFn(url, {
        ...fetchOptions,
        signal: controller.signal,
      })
      clearTimeout(id)
      return response
    } catch (error) {
      clearTimeout(id)
      throw error
    }
  }

  private async fetchWithRetry(url: string, options: FetchOptions): Promise<Response> {
    const { retry = 0, retryDelay = 1000, ...fetchOptions } = options
    let lastError: Error | null = null

    for (let i = 0; i <= retry; i++) {
      try {
        const response = await this.fetchWithTimeout(url, fetchOptions)

        // Don't retry on 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500) {
          return response
        }

        // Retry on 5xx errors (server errors)
        if (response.status >= 500 && i < retry) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * (i + 1)))
          continue
        }

        return response
      } catch (error) {
        lastError = error as Error
        if (i < retry) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * (i + 1)))
        }
      }
    }

    throw lastError || new Error("Request failed")
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get("content-type")
    const isJson = contentType?.includes("application/json")

    if (!response.ok) {
      const error: ApiError = new Error(`API Error: ${response.statusText}`)
      error.status = response.status

      if (isJson) {
        try {
          error.data = await response.json()
        } catch {
          // If JSON parsing fails, ignore
        }
      }

      throw error
    }

    if (isJson) {
      return response.json()
    }

    return response.text() as any
  }

  async get<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await this.fetchWithRetry(url, {
      ...this.defaultOptions,
      ...options,
      method: "GET",
    })
    return this.handleResponse<T>(response)
  }

  async post<T = any>(endpoint: string, data?: any, options: FetchOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const isFormData = data instanceof FormData

    const response = await this.fetchWithRetry(url, {
      ...this.defaultOptions,
      ...options,
      method: "POST",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...this.defaultOptions.headers,
        ...options.headers,
      },
      body: isFormData ? data : data ? JSON.stringify(data) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  async put<T = any>(endpoint: string, data?: any, options: FetchOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await this.fetchWithRetry(url, {
      ...this.defaultOptions,
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  async patch<T = any>(endpoint: string, data?: any, options: FetchOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await this.fetchWithRetry(url, {
      ...this.defaultOptions,
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  async delete<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await this.fetchWithRetry(url, {
      ...this.defaultOptions,
      ...options,
      method: "DELETE",
    })
    return this.handleResponse<T>(response)
  }

  // Raw fetch for streaming responses or special cases
  async fetch(endpoint: string, options: FetchOptions = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`
    return this.fetchWithRetry(url, {
      ...this.defaultOptions,
      ...options,
    })
  }
}

// Export a singleton instance
export const apiClient = new ApiClient()

// Export the class for custom instances
export { ApiClient }

// Helper to check if error is ApiError
export function isApiError(error: any): error is ApiError {
  return error && typeof error === "object" && "status" in error
}
