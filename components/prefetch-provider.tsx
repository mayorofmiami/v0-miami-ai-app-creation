"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function PrefetchProvider() {
  const pathname = usePathname()

  useEffect(() => {
    // Prefetch common routes on initial load
    if (pathname === "/") {
      const routesToPrefetch = ["/login", "/signup", "/profile", "/admin"]

      routesToPrefetch.forEach((route) => {
        const link = document.createElement("link")
        link.rel = "prefetch"
        link.href = route
        link.as = "document"
        document.head.appendChild(link)
      })
    }

    // Prefetch static assets
    const imagesToPrefetch = ["/miami-ai-logo.png"]

    imagesToPrefetch.forEach((src) => {
      const link = document.createElement("link")
      link.rel = "prefetch"
      link.href = src
      link.as = "image"
      document.head.appendChild(link)
    })
  }, [pathname])

  return null
}
