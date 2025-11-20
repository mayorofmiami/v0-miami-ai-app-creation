import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get("session")
  const hasSession = !!sessionCookie?.value

  // Public routes that don't require authentication
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

  // Protected authenticated routes
  const isAuthRoute = pathname.startsWith("/app")

  // Admin routes
  const isAdminRoute = pathname.startsWith("/admin")

  // If authenticated user tries to access public auth pages, redirect to app
  if (hasSession && (pathname === "/" || pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/app", request.url))
  }

  // If unauthenticated user tries to access protected routes, redirect to login
  if (!hasSession && (isAuthRoute || isAdminRoute)) {
    const redirectUrl = new URL("/login", request.url)
    // Preserve the intended destination for post-login redirect
    if (pathname !== "/app") {
      redirectUrl.searchParams.set("redirect", pathname)
    }
    return NextResponse.redirect(redirectUrl)
  }

  // Set security headers
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
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
