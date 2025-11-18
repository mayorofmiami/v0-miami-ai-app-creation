"use client"

import { useState, useEffect } from "react"
import { offlineHandler } from "@/lib/offline-handler"
import WifiOff from "@/components/icons/WifiOff"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(offlineHandler.getStatus())
    
    const unsubscribe = offlineHandler.subscribe((online) => {
      setIsOnline(online)
    })

    return unsubscribe
  }, [])

  if (isOnline) return null

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm flex items-center gap-3">
        <WifiOff className="w-5 h-5 text-red-500" />
        <div>
          <p className="text-sm font-medium text-red-500">No Internet Connection</p>
          <p className="text-xs text-muted-foreground">Some features may be unavailable</p>
        </div>
      </div>
    </div>
  )
}
