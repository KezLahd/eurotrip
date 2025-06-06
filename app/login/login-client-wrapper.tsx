"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import AuthForm from "@/components/auth-form"
import { LoginBackgroundVideo } from "@/components/login-background-video"
import { createBrowserClient } from "@/lib/supabase-client"
import { WelcomePopup } from "@/components/welcome-popup"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"

interface LoginClientWrapperProps {
  landscapeVideoUrl: string | null
  portraitVideoUrl: string | null
  landscapeBackgroundUrl: string | null
  portraitBackgroundUrl: string | null
}

export default function LoginClientWrapper({
  landscapeVideoUrl,
  portraitVideoUrl,
  landscapeBackgroundUrl,
  portraitBackgroundUrl,
}: LoginClientWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [showAuthForm, setShowAuthForm] = useState(true)
  const [fadeToStaticBackground, setFadeToStaticBackground] = useState(false)
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [supabase, setSupabase] = useState<any>(null)

  const router = useRouter()

  useEffect(() => {
    setSupabase(createBrowserClient())
  }, [])

  useEffect(() => {
    if (!supabase) return;
    let authListenerSubscription: any

    async function checkUserSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setIsAuthenticated(!!session)
      setCheckingSession(false)
    }

    checkUserSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setIsAuthenticated(!!session)
    })

    authListenerSubscription = subscription

    return () => {
      if (authListenerSubscription) {
        authListenerSubscription.unsubscribe()
      }
    }
  }, [supabase])

  // Removed the problematic early return here.
  // The redirect logic will now be handled exclusively by Effect 2.

  // Effect 2: Post-login transition flow
  useEffect(() => {
    if (isAuthenticated && !checkingSession) {
      setShowAuthForm(false)
      setShowWelcomePopup(true)

      const videoPlayDuration = 3000
      const fadeTransitionDuration = 800

      const fadeTimer = setTimeout(() => {
        setFadeToStaticBackground(true)
      }, videoPlayDuration)

      const redirectTimer = setTimeout(() => {
        window.location.replace("/")
      }, videoPlayDuration + fadeTransitionDuration)

      return () => {
        clearTimeout(fadeTimer)
        clearTimeout(redirectTimer)
      }
    } else if (!isAuthenticated && !checkingSession) {
      setShowAuthForm(true)
      setFadeToStaticBackground(false)
      setShowWelcomePopup(false)
    }
  }, [isAuthenticated, checkingSession]) // Dependencies for this effect

  const handleLoginSuccess = () => {
    window.location.reload();
  }

  if (checkingSession || !supabase) {
    return (
      <div className="relative h-screen w-screen flex items-center justify-center overflow-hidden">
        <LoginBackgroundVideo
          landscapeVideoUrl={landscapeVideoUrl}
          portraitVideoUrl={portraitVideoUrl}
          landscapeBackgroundUrl={landscapeBackgroundUrl}
          portraitBackgroundUrl={portraitBackgroundUrl}
          fadeToStaticBackground={false}
        />
        <div className="relative z-20 text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-screen flex items-center justify-center overflow-hidden">
      <LoginBackgroundVideo
        landscapeVideoUrl={landscapeVideoUrl}
        portraitVideoUrl={portraitVideoUrl}
        landscapeBackgroundUrl={landscapeBackgroundUrl}
        portraitBackgroundUrl={portraitBackgroundUrl}
        fadeToStaticBackground={fadeToStaticBackground}
      />

      {showAuthForm && supabase && (
        <div className="relative z-20 p-4">
          <AuthForm supabase={supabase} onSuccess={handleLoginSuccess} />
        </div>
      )}

      <WelcomePopup show={showWelcomePopup} />
    </div>
  )
}
