import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname
  const isLoginPage = pathname === "/login"
  const isProtectedPage = pathname === "/"

  // ✅ Redirect unauthenticated users away from protected routes
  if (!session && isProtectedPage) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    return NextResponse.redirect(loginUrl)
  }

  // ✅ Redirect authenticated users away from login
  if (session && isLoginPage) {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = "/"
    return NextResponse.redirect(homeUrl)
  }

  return response
}

// ✅ Apply to all routes except static assets and APIs
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon-|manifest|placeholder.svg|api).*)",
  ],
}
