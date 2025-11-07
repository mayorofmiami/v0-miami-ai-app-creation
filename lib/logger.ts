type LogLevel = "debug" | "info" | "warn" | "error"

interface LogOptions {
  prefix?: string
  data?: any
  error?: Error | unknown
}

class Logger {
  private isDevelopment: boolean
  private prefix: string

  constructor(prefix = "v0") {
    this.isDevelopment = process.env.NODE_ENV === "development"
    this.prefix = prefix
  }

  private formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
    const prefix = options?.prefix || this.prefix
    const timestamp = new Date().toISOString()
    return `[${prefix}] [${level.toUpperCase()}] ${timestamp} - ${message}`
  }

  private log(level: LogLevel, message: string, options?: LogOptions) {
    const formattedMessage = this.formatMessage(level, message, options)

    switch (level) {
      case "debug":
        if (this.isDevelopment) {
          console.log(formattedMessage, options?.data || "")
        }
        break
      case "info":
        console.log(formattedMessage, options?.data || "")
        break
      case "warn":
        console.warn(formattedMessage, options?.data || "")
        break
      case "error":
        console.error(formattedMessage, options?.error || options?.data || "")
        break
    }
  }

  debug(message: string, data?: any) {
    this.log("debug", message, { data })
  }

  info(message: string, data?: any) {
    this.log("info", message, { data })
  }

  warn(message: string, data?: any) {
    this.log("warn", message, { data })
  }

  error(message: string, error?: Error | unknown, data?: any) {
    this.log("error", message, { error, data })
  }

  // Specialized logging methods
  api(method: string, endpoint: string, status?: number) {
    this.info(`API ${method} ${endpoint}`, status ? { status } : undefined)
  }

  auth(action: string, email?: string, userId?: string) {
    this.info(`Auth: ${action}`, { email, userId })
  }

  database(operation: string, table?: string, detail?: any) {
    this.debug(`Database ${operation}`, { table, ...detail })
  }

  search(action: string, query?: string, detail?: any) {
    this.info(`Search: ${action}`, { query, ...detail })
  }

  // Create a child logger with a custom prefix
  child(prefix: string): Logger {
    return new Logger(`${this.prefix}:${prefix}`)
  }
}

// Export singleton instance
export const logger = new Logger()

// Export class for custom loggers
export { Logger }

// Convenience exports for common patterns
export const apiLogger = logger.child("api")
export const authLogger = logger.child("auth")
export const dbLogger = logger.child("db")
export const searchLogger = logger.child("search")
