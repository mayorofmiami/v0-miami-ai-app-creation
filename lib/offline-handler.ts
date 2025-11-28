type Subscriber = (isOnline: boolean) => void

class OfflineHandler {
  private subscribers: Set<Subscriber> = new Set()
  private isOnline = true

  constructor() {
    if (typeof window !== "undefined") {
      this.isOnline = navigator.onLine

      window.addEventListener("online", this.handleOnline)
      window.addEventListener("offline", this.handleOffline)
    }
  }

  private handleOnline = () => {
    this.isOnline = true
    this.notify()
  }

  private handleOffline = () => {
    this.isOnline = false
    this.notify()
  }

  private notify() {
    this.subscribers.forEach((subscriber) => subscriber(this.isOnline))
  }

  getStatus(): boolean {
    return this.isOnline
  }

  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback)
    return () => {
      this.subscribers.delete(callback)
    }
  }
}

export const offlineHandler = new OfflineHandler()
