"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNowStrict, isPast, isFuture } from "date-fns"
import { Clock } from "lucide-react"

interface CountdownProps {
  nextEventTime: Date | null
}

export function Countdown({ nextEventTime }: CountdownProps) {
  const [countdown, setCountdown] = useState<string | null>(null)

  useEffect(() => {
    if (!nextEventTime) {
      setCountdown(null)
      return
    }

    const updateCountdown = () => {
      if (isPast(nextEventTime)) {
        setCountdown("Event has started!")
      } else if (isFuture(nextEventTime)) {
        setCountdown(formatDistanceToNowStrict(nextEventTime, { addSuffix: true }))
      } else {
        setCountdown(null)
      }
    }

    updateCountdown() // Initial update
    const interval = setInterval(updateCountdown, 1000) // Update every second

    return () => clearInterval(interval) // Cleanup on unmount
  }, [nextEventTime])

  if (!countdown) {
    return null
  }

  return (
    <div className="flex items-center justify-center gap-2 p-2 bg-light-blue text-primary-blue font-semibold rounded-full shadow-md mb-4 animate-fade-in">
      <Clock className="h-5 w-5" />
      <span>Next event: {countdown}</span>
    </div>
  )
}
