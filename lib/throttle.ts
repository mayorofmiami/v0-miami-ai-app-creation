/**
 * Throttles a function to only execute once per specified delay
 * @param fn - Function to throttle
 * @param delay - Minimum time between executions in milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeout: NodeJS.Timeout | null = null

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    const timeSinceLastCall = now - lastCall

    if (timeSinceLastCall >= delay) {
      lastCall = now
      fn.apply(this, args)
    } else {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => {
        lastCall = Date.now()
        fn.apply(this, args)
      }, delay - timeSinceLastCall)
    }
  }
}
