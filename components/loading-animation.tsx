"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"

// Changed to a named export
export const LoadingAnimation = ({ isLoadingContent, videoUrl }: { isLoadingContent: boolean; videoUrl?: string }) => {
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [showComponent, setShowComponent] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null) // Ref for the video element

  useEffect(() => {
    // This effect runs when isLoadingContent changes.
    // When content is loaded (isLoadingContent becomes false), start the fade-out.
    if (!isLoadingContent && showComponent) {
      // Ensure the element is visible before starting the fade
      if (containerRef.current) {
        containerRef.current.style.opacity = "1" // Explicitly set to 1
        void containerRef.current.offsetHeight // Force reflow
      }

      // Start fading out immediately when content is loaded
      setIsFadingOut(true)

      // After the fade-out transition completes, hide the component
      const hideComponentTimer = setTimeout(() => {
        setShowComponent(false)
      }, 3600) // 2.6s fade + 1s extra background

      return () => {
        clearTimeout(hideComponentTimer)
      }
    }
  }, [isLoadingContent, showComponent])

  // Reset states when content starts loading again
  useEffect(() => {
    if (isLoadingContent) {
      setShowComponent(true)
      setIsFadingOut(false)
      if (containerRef.current) {
        containerRef.current.style.opacity = "1"
      }
    }
  }, [isLoadingContent])

  // Handle video looping based on loading state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.loop = isLoadingContent // Loop only while content is loading
    }
  }, [isLoadingContent])

  if (!showComponent) {
    return null
  }

  return (
    <div
      ref={containerRef}
      style={{
        opacity: isFadingOut ? 0 : 1,
        transition: "opacity 2.6s ease-out",
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white ${
        isFadingOut ? "pointer-events-none" : ""
      }`}
      aria-live="polite"
      aria-busy={isLoadingContent}
    >
      {videoUrl ? (
        <video
          ref={videoRef} // Attach ref to the video element
          src={videoUrl}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
          aria-label="Loading animation"
          // loop is now controlled by useEffect based on isLoadingContent
        >
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/placeholder.svg?height=100&width=100&text=Loading..."
            alt="Loading spinner"
            width={100}
            height={100}
            className="animate-spin"
            crossOrigin="anonymous"
          />
          <p className="text-lg font-semibold text-primary-blue">Loading your Eurotrip...</p>
        </div>
      )}
    </div>
  )
}
