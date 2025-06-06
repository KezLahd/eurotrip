"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import AuthForm from "@/components/auth-form"
import { LoginBackgroundVideo } from "@/components/login-background-video"
import { createBrowserClient } from "@/lib/supabase-client"
import { WelcomePopup } from "@/components/welcome-popup" // Import the new component

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
  const [showWelcomePopup, setShowWelcomePopup] = useState(false) // New state for popup
  const router = useRouter()

  const supabase = useMemo(() => createBrowserClient(), [])

  // Effect 1: Check session on initial load and set up auth listener
  useEffect(() => {
    let authListenerSubscription: any

    async function checkUserSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        setIsAuthenticated(true)
      }
      setCheckingSession(false)
    }

    checkUserSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session) // Update isAuthenticated based on session presence
    })
    authListenerSubscription = subscription

    return () => {
      if (authListenerSubscription) {
        authListenerSubscription.unsubscribe()
      }
    }
  }, [supabase])

  // Effect 2: Handle post-authentication flow (video play, fade, redirect)
  useEffect(() => {
    if (isAuthenticated && !checkingSession) {
      setShowAuthForm(false) // Hide form
      setShowWelcomePopup(true) // Show welcome popup

      const videoPlayDuration = 3000 // 3 seconds (changed from 2000)
      const fadeTransitionDuration = 800 // 800ms, matches CSS transition

      // Start the fade to static background after videoPlayDuration
      const fadeTimer = setTimeout(() => {
        setFadeToStaticBackground(true)
      }, videoPlayDuration)

      // Redirect after the fade completes (videoPlayDuration + fade transition duration)
      const redirectTimer = setTimeout(() => {
        window.location.replace("/")
      }, videoPlayDuration + fadeTransitionDuration) // This will be 3800ms (3000 + 800)

      return () => {
        clearTimeout(fadeTimer)
        clearTimeout(redirectTimer)
      }
    } else if (!isAuthenticated && !checkingSession) {
      // If not authenticated and session check is done, show form
      setShowAuthForm(true)
      setFadeToStaticBackground(false)
      setShowWelcomePopup(false)
    }
  }, [isAuthenticated, checkingSession, router]) // Dependencies for this effect

  const handleLoginSuccess = () => {
    // This function is called by AuthForm.
    // The onAuthStateChange listener in Effect 1 will detect the new session
    // and update `isAuthenticated`, which in turn triggers Effect 2.
    // No direct state changes needed here for the video/redirect flow.
  }

  if (checkingSession) {
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

      {showAuthForm && (
        <div className="relative z-20 p-4">
          <AuthForm supabase={supabase} onSuccess={handleLoginSuccess} />
        </div>
      )}

      <WelcomePopup show={showWelcomePopup} />
    </div>
  )
}
