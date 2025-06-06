import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies"
import type { NextRequest } from "next/server"

// ✅ Server-Side Supabase Client
export const createServerClient = (
  cookieStore: ReadonlyRequestCookies | NextRequest["cookies"]
): SupabaseClient => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: (key) => cookieStore.get(key)?.value,
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    window.__SUPABASE_BROWSER_CLIENT__ = createClient(supabaseUrl, supabaseAnonKey)
    console.log("[Supabase] Browser client created")
  }

  return window.__SUPABASE_BROWSER_CLIENT__
}
