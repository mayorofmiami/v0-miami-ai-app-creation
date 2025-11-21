import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { logger } from "@/lib/logger"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get("session")
  const hasSession = !!sessionCookie?.value

  if (pathname.startsWith("/admin")) {
    if (!hasSession) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Verify admin role from session token
    try {
      const sessionValue = sessionCookie.value
      // Parse JWT or session token to check role
      // For now, we'll check against the database in the admin pages
      // This middleware just ensures they're authenticated
    } catch (error) {
      logger.error("Admin middleware error", error)
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/share/") ||
    pathname.startsWith("/shared/")

  const isAuthRoute = pathname.startsWith("/app")

  if (hasSession && (pathname === "/" || pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/app", request.url))
  }

  if (!hasSession && isAuthRoute) {
    const redirectUrl = new URL("/login", request.url)
    if (pathname !== "/app") {
      redirectUrl.searchParams.set("redirect", pathname)
    }
    return NextResponse.redirect(redirectUrl)
  }

  const response = NextResponse.next()
  response.headers.set("X-DNS-Prefetch-Control", "on")
  response.headers.set("X-Frame-Options", "SAMEORIGIN")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  if (pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname === "/app") {
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120")
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
