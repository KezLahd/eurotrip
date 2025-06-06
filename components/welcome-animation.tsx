"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface WelcomeAnimationProps {
  videoUrl: string | null
  backgroundUrl: string | null
  onAnimationComplete: () => void
}

export function WelcomeAnimation({ videoUrl, backgroundUrl, onAnimationComplete }: WelcomeAnimationProps) {
  const [showVideo, setShowVideo] = useState(true)
  const [showBackground, setShowBackground] = useState(false)
  const [showText, setShowText] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!videoUrl) {
      // If no video, just show background and text
      setShowVideo(false)
      setShowBackground(true)
      setShowText(true)
      return
    }

    // Start the animation sequence
    const videoTimer = setTimeout(() => {
      setShowVideo(false)
      setShowBackground(true)
    }, 3000) // Show video for 3 seconds

    const backgroundTimer = setTimeout(() => {
      setShowText(false)
      onAnimationComplete()
    }, 3800) // 3000 + 800ms for background transition

    return () => {
      clearTimeout(videoTimer)
      clearTimeout(backgroundTimer)
    }
  }, [videoUrl, onAnimationComplete])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Video Layer */}
      {showVideo && videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          muted
          playsInline
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            "transition-opacity duration-800",
            !showVideo && "opacity-0"
          )}
        >
          Your browser does not support the video tag.
        </video>
      )}

      {/* Background Layer */}
      {showBackground && backgroundUrl && (
        <div
          className={cn(
            "absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat",
            "transition-opacity duration-800",
            !showBackground && "opacity-0"
          )}
          style={{ backgroundImage: `url(${backgroundUrl})` }}
        />
      )}

      {/* Welcome Text */}
      {showText && (
        <div
          className={cn(
            "relative z-10 text-center",
            "transition-opacity duration-800",
            !showText && "opacity-0"
          )}
        >
          <h1 className="text-4xl md:text-6xl font-extrabold text-accent-pink animate-fade-in">
            Welcome To Eurotrip
          </h1>
        </div>
      )}
    </div>
  )
} 