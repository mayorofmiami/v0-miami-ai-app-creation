/**
 * Request deduplication utility to prevent duplicate in-flight requests
 * Useful for preventing multiple identical search queries from being sent simultaneously
 */

interface PendingRequest {
  promise: Promise<any>
  timestamp: number
}

class RequestDeduplicator {
  private pending: Map<string, PendingRequest> = new Map()
  private readonly timeout: number = 60000 // 60 seconds default timeout

  /**
   * Generate a cache key from request parameters
   */
  private generateKey(url: string, options?: RequestInit): string {
    const method = options?.method || "GET"
    const body = options?.body ? JSON.stringify(options.body) : ""
    return `${method}:${url}:${body}`
  }

  /**
   * Execute a fetch request with deduplication
   * If the same request is already in-flight, return the existing promise
   */
  async fetch(url: string, options?: RequestInit): Promise<Response> {
    const key = this.generateKey(url, options)

    // Check if there's a pending request for this key
    const existing = this.pending.get(key)

    if (existing) {
      const age = Date.now() - existing.timestamp

      // If request is still valid (not timed out), return existing promise
      if (age < this.timeout) {
        console.log("[v0] Request deduplicated:", key)
        return existing.promise
      }

      // If timed out, remove it
      this.pending.delete(key)
    }

    // Create new request
    const promise = fetch(url, options)
      .then((response) => {
        // Clean up after successful response
        this.pending.delete(key)
        return response
      })
      .catch((error) => {
        // Clean up after error
        this.pending.delete(key)
        throw error
      })

    // Store the pending request
    this.pending.set(key, {
      promise,
      timestamp: Date.now(),
    })

    return promise
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pending.clear()
  }

  /**
   * Clear a specific request by its parameters
   */
  clearRequest(url: string, options?: RequestInit): void {
    const key = this.generateKey(url, options)
    this.pending.delete(key)
  }

  /**
   * Get the number of pending requests
   */
  getPendingCount(): number {
    return this.pending.size
  }
}

// Export singleton instance
export const requestDeduplicator = new RequestDeduplicator()
