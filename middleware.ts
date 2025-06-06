import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase-client" // Using your existing server client

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  // Pass request.cookies to createServerClient for middleware
  const supabase = createServerClient(request.cookies)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // If the user is not authenticated and tries to access a protected route (not /login)
  if (!session && pathname !== "/login") {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // If the user is authenticated and tries to access the login page, redirect to home
  if (session && pathname === "/login") {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  response.headers.set("x-url", request.nextUrl.pathname)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /icon- (PWA icons)
     * - /manifest.ts (PWA manifest)
     * - /placeholder.svg (placeholder images)
     * - /api (API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|icon-|manifest.ts|placeholder.svg|api).*)",
  ],
}
