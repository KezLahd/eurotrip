import { createServerClient } from "@/lib/supabase-client"
import LoginClientWrapper from "./login-client-wrapper"

export default async function LoginPage() {
  const supabase = createServerClient()

  let landscapeVideoUrl: string | null = null
  let portraitVideoUrl: string | null = null
  let landscapeBackgroundUrl: string | null = null
  let portraitBackgroundUrl: string | null = null

  try {
    // Fetch initial_load animation URLs
    const { data: landscapeAnimation, error: landscapeAnimError } = await supabase
      .from("animations")
      .select("url")
      .eq("name", "initial_load")
      .eq("screen_aspect_ratio", "16:9")
      .single()

    if (landscapeAnimError)
      console.error(
        "Error fetching landscape initial_load URL:",
        landscapeAnimError.message || String(landscapeAnimError),
      )
    else landscapeVideoUrl = landscapeAnimation?.url || null

    const { data: portraitAnimation, error: portraitAnimError } = await supabase
      .from("animations")
      .select("url")
      .eq("name", "initial_load")
      .eq("screen_aspect_ratio", "9:16")
      .single()

    if (portraitAnimError)
      console.error("Error fetching portrait initial_load URL:", portraitAnimError.message || String(portraitAnimError))
    else portraitVideoUrl = portraitAnimation?.url || null

    // Fetch background image URLs
    const { data: landscapeBackground, error: landscapeBgError } = await supabase
      .from("animations")
      .select("url")
      .eq("name", "background")
      .eq("screen_aspect_ratio", "16:9")
      .single()

    if (landscapeBgError)
      console.error("Error fetching landscape background URL:", landscapeBgError.message || String(landscapeBgError))
    else landscapeBackgroundUrl = landscapeBackground?.url || null

    const { data: portraitBackground, error: portraitBgError } = await supabase
      .from("animations")
      .select("url")
      .eq("name", "background")
      .eq("screen_aspect_ratio", "9:16")
      .single()

    if (portraitBgError)
      console.error("Error fetching portrait background URL:", portraitBgError.message || String(portraitBgError))
    else portraitBackgroundUrl = portraitBackground?.url || null
  } catch (e: any) {
    console.error("An unexpected error occurred during Supabase data fetching in LoginPage:", e.message || String(e))
  }

  return (
    <LoginClientWrapper
      landscapeVideoUrl={landscapeVideoUrl}
      portraitVideoUrl={portraitVideoUrl}
      landscapeBackgroundUrl={landscapeBackgroundUrl} // New prop
      portraitBackgroundUrl={portraitBackgroundUrl} // New prop
    />
  )
}
