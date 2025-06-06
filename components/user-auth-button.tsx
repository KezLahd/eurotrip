"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase-client"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function UserAuthButton() {
  const [user, setUser] = useState<any>(null) // Store user session data
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    setSupabase(createBrowserClient())
  }, [])

  useEffect(() => {
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [supabase])

  const handleSignOut = async () => {
    if (!supabase) return;
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Error signing out:", error.message)
      setLoading(false)
    } else {
      console.log("Signed out successfully. Redirecting to login.")
      router.push("/login") // Explicitly redirect to /login
    }
  }

  if (loading || !supabase) {
    return null // Or a small spinner if desired
  }

  if (user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        disabled={loading}
        className="text-purple-700 hover:bg-purple-200/40 text-lg font-bold flex items-center"
      >
        <LogOut className="h-6 w-6 mr-2 text-purple-700" />
        <span className="text-purple-700 text-lg font-bold">Sign Out</span>
      </Button>
    )
  }

  // If not logged in, don't render anything here. Middleware handles redirect to login.
  return null
}
