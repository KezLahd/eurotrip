"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function UserAuthButton() {
  const [user, setUser] = useState<any>(null) // Store user session data
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()
  const router = useRouter()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [supabase])

  const handleSignOut = async () => {
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

  if (loading) {
    return null // Or a small spinner if desired
  }

  if (user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        disabled={loading}
        className="text-primary-blue hover:bg-primary-blue/10"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    )
  }

  // If not logged in, don't render anything here. Middleware handles redirect to login.
  return null
}
