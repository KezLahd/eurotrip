import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies" // For cookies()
import type { NextRequest } from "next/server" // For middleware request.cookies

// This function creates a Supabase client for server-side environments (Server Components, Server Actions, Route Handlers)
// It needs access to the request's cookies to manage sessions.
export const createServerClient = (
  cookieStore: ReadonlyRequestCookies | NextRequest["cookies"], // Accepts either cookies() from next/headers or request.cookies from NextRequest
) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // This is crucial for server-side session management
      // It tells Supabase how to read and write cookies
      storage: {
        getItem: (key) => cookieStore.get(key)?.value,
        setItem: (key, value) => {
          // In a server environment, you typically don't set cookies directly here.
          // Supabase's auth helpers handle setting the `Set-Cookie` header in the response.
          // For `createServerClient`, we primarily need `getItem`.
        },
        removeItem: (key) => {
          // Similar to setItem, removal is handled by auth helpers or explicit cookies().delete()
        },
      },
      autoRefreshToken: false, // Server-side doesn't need auto-refresh
      persistSession: false, // Server-side doesn't persist session across requests
    },
  })
}

// Client-side client (singleton pattern using window object)
export const createBrowserClient = (): SupabaseClient => {
  // Ensure this code only runs in the browser environment
  if (typeof window === "undefined") {
    // This function should ideally only be called in client components.
    // If it's somehow called on the server, return a dummy client to prevent errors.
    console.warn("createBrowserClient called on server. Returning a dummy client.")
    return createClient("http://dummy-url", "dummy-key")
  }

  // Use a global property on the window object to store the client instance.
  // This ensures it's truly a singleton across different module evaluations
  // within the same browser session.
  if (!(window as any).__SUPABASE_BROWSER_CLIENT__) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ;(window as any).__SUPABASE_BROWSER_CLIENT__ = createClient(supabaseUrl, supabaseAnonKey)
    console.log("Supabase browser client initialized and stored on window.")
  }
  return (window as any).__SUPABASE_BROWSER_CLIENT__
}
