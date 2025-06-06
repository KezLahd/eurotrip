import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies"
import type { NextRequest } from "next/server"
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs"

// ✅ Server-Side Supabase Client
export const createServerClient = (
  cookieStore: ReadonlyRequestCookies | NextRequest["cookies"]
): SupabaseClient => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: (key) => Promise.resolve(cookieStore.get(key)?.value ?? null),
        setItem: () => {},
        removeItem: () => {},
      },
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// ✅ Browser-Side Singleton Supabase Client (with type safety)
declare global {
  interface Window {
    __SUPABASE_BROWSER_CLIENT__?: SupabaseClient
  }
}

export const createBrowserClient = (): SupabaseClient => {
  if (typeof window === "undefined") {
    throw new Error("createBrowserClient should only be called in the browser.")
  }

  if (!window.__SUPABASE_BROWSER_CLIENT__) {
    window.__SUPABASE_BROWSER_CLIENT__ = createPagesBrowserClient()
    console.log("[Supabase] Browser client created")
  }

  return window.__SUPABASE_BROWSER_CLIENT__
}
