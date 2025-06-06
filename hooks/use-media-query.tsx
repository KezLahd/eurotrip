"use client"

import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") {
      // Server-side rendering, return false or a default value
      return
    }

    const mediaQueryList = window.matchMedia(query)

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Set initial state
    setMatches(mediaQueryList.matches)

    // Add listener for changes
    mediaQueryList.addEventListener("change", listener)

    // Clean up listener on unmount
    return () => {
      mediaQueryList.removeEventListener("change", listener)
    }
  }, [query])

  return matches
}
