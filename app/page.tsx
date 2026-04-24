import { createServerClient } from "@/lib/supabase-client"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers" // Import cookies
import ItineraryClientWrapper from "./itinerary-client-wrapper"
import Landing from "@/components/marketing/landing"
// Removed: import { fetchItineraryData } from "@/actions/itinerary" // No longer fetching here

export default async function HomePage() {
  // Use the auth-helpers server-component client to read the session cookie
  // that middleware.ts set via createMiddlewareClient — these two must agree
  // on cookie shape, so we use the same family here.
  const authClient = createServerComponentClient({ cookies })
  const {
    data: { user },
  } = await authClient.auth.getUser()

  // Unauthenticated visitors get the public landing page. Logged-in users
  // fall through to the itinerary app below.
  if (!user) {
    return <Landing />
  }

  // Existing data-fetching client keeps its custom cookie adapter — the
  // animations table isn't RLS-gated so either reader works here.
  const supabase = createServerClient(cookies())

  let landscapeBackgroundUrl: string | null = null
  let portraitBackgroundUrl: string | null = null

  try {
    // Fetch background image URLs
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
