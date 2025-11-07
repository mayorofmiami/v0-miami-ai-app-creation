export function prefetchCommonRoutes() {
  if (typeof window === "undefined") return

  // Prefetch common routes
  const commonRoutes = ["/login", "/signup", "/profile"]

  commonRoutes.forEach((route) => {
    const link = document.createElement("link")
    link.rel = "prefetch"
    link.href = route
    document.head.appendChild(link)
  })
}

export async function prefetchInitData() {
  if (typeof window === "undefined") return

  // Prefetch init data in the background
  try {
    await fetch("/api/init", {
      method: "GET",
      credentials: "include",
    })
  } catch (error) {
    console.error("[v0] Failed to prefetch init data:", error)
  }
}
