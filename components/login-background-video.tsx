"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

interface LoginBackgroundVideoProps {
  landscapeVideoUrl: string | null
  portraitVideoUrl: string | null
  landscapeBackgroundUrl: string | null
  portraitBackgroundUrl: string | null
  fadeToStaticBackground: boolean // Changed from showStaticBackground to indicate it's a transition
}

export function LoginBackgroundVideo({
  landscapeVideoUrl,
  portraitVideoUrl,
  landscapeBackgroundUrl,
  portraitBackgroundUrl,
  fadeToStaticBackground,
}: LoginBackgroundVideoProps) {
  const isPortrait = useMediaQuery("(orientation: portrait)")
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Set the appropriate URLs based on orientation
  useEffect(() => {
    if (isPortrait) {
      setCurrentVideoUrl(portraitVideoUrl)
      setCurrentImageUrl(portraitBackgroundUrl)
    } else {
      setCurrentVideoUrl(landscapeVideoUrl)
      setCurrentImageUrl(landscapeBackgroundUrl)
    }
  }, [isPortrait, landscapeVideoUrl, portraitVideoUrl, landscapeBackgroundUrl, portraitBackgroundUrl])

  return (
    <>
      {/* Video element - always present but fades out */}
      {currentVideoUrl && (
        <video
          ref={videoRef}
          src={currentVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          className={cn(
            "absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-800", // Changed from duration-500 to duration-800
            fadeToStaticBackground ? "opacity-0" : "opacity-100",
          )}
          aria-hidden="true"
        >
          Your browser does not support the video tag.
        </video>
      )}

      {/* Background image - always present but fades in */}
      {currentImageUrl && (
        <Image
          src={currentImageUrl || "/placeholder.svg"}
          alt="Background scene"
          layout="fill"
          objectFit="cover"
          className={cn(
            "absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-800", // Changed from duration-500 to duration-800
            fadeToStaticBackground ? "opacity-100" : "opacity-0",
          )}
          crossOrigin="anonymous"
          quality={100}
          priority
          sizes="100vw"
        />
      )}

      {/* Fallback if neither video nor image is available */}
      {!currentVideoUrl && !currentImageUrl && <div className="absolute inset-0 bg-gray-900" />}
    </>
  )
}
