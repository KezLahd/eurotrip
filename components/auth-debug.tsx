"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase-client"
import type { User } from "@supabase/supabase-js"

export function AuthDebug() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [supabase])

  if (loading) {
    return (
      <div className="fixed bottom-4 left-4 bg-gray-800 text-white p-2 rounded-md text-xs z-50">
        Auth Status: Loading...
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 bg-gray-800 text-white p-2 rounded-md text-xs z-50">
      Auth Status: {user ? `Logged in as ${user.email}` : "Logged out"}
    </div>
  )
}
