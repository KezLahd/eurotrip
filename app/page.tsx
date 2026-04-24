import { createServerClient as createLegacyServerClient } from "@/lib/supabase-client"
import { createServerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import ItineraryClientWrapper from "./itinerary-client-wrapper"
import Landing from "@/components/marketing/landing"

export default async function HomePage() {
  // ── Auth check ─────────────────────────────────────────────────────────
  // Reads the same session cookies the middleware writes via createServerClient.
  // Matches cookie shape exactly — we use the new auth-helpers v0.15 API here
  // and in middleware.ts.
  const cookieStore = await cookies()
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // No-op in Server Components — Next won't let us mutate cookies here.
          // Session refresh happens in middleware.ts.
        },
      },
    }
  )
  const {
    data: { user },
  } = await authClient.auth.getUser()

  // Unauthenticated visitors see the public landing.
  if (!user) {
    return <Landing />
  }

  // ── Existing itinerary path for signed-in users ────────────────────────
  const supabase = createLegacyServerClient(cookieStore)

  let landscapeBackgroundUrl: string | null = null
  let portraitBackgroundUrl: string | null = null

  try {
    const { data: landscapeBackground, error: landscapeBgError } = await supabase
      .from("animations")
      .select("url")
      .eq("name", "background")
      .eq("screen_aspect_ratio", "16:9")
      .single()

    if (landscapeBgError) {
      console.error("Error fetching landscape background URL:", landscapeBgError.message || String(landscapeBgError))
    } else {
      landscapeBackgroundUrl = landscapeBackground?.url || null
    }

    const { data: portraitBackground, error: portraitBgError } = await supabase
      .from("animations")
      .select("url")
      .eq("name", "background")
      .eq("screen_aspect_ratio", "9:16")
      .single()

    if (portraitBgError) {
      console.error("Error fetching portrait background URL:", portraitBgError.message || String(portraitBgError))
    } else {
      portraitBackgroundUrl = portraitBackground?.url || null
    }
  } catch (e: any) {
    console.error("An unexpected error occurred during Supabase data fetching:", e.message || String(e))
  }

  return (
    <ItineraryClientWrapper
      landscapeBackgroundUrl={landscapeBackgroundUrl}
      portraitBackgroundUrl={portraitBackgroundUrl}
    />
  )
}
