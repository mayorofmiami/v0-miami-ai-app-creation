export class OfflineHandler {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true
  private listeners: Set<(online: boolean) => void> = new Set()

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)
    }
  }

  private handleOnline = () => {
    this.isOnline = true
    this.notifyListeners()
  }

  private handleOffline = () => {
    this.isOnline = false
    this.notifyListeners()
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline))
  }

  public subscribe(listener: (online: boolean) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  public getStatus() {
    return this.isOnline
  }

  public cleanup() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
    }
    this.listeners.clear()
  }
}

export const offlineHandler = new OfflineHandler()
