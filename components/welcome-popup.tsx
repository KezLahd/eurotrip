"use client"

import { cn } from "@/lib/utils"
import { useCurrentParticipant } from "@/components/current-participant-context"

interface WelcomePopupProps {
  show: boolean
}

export function WelcomePopup({ show }: WelcomePopupProps) {
  if (!show) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-40 flex items-center justify-center",
        // The opacity is always 100% when 'show' is true, as per user request "always there until redirecting"
        "opacity-100",
      )}
    >
      <div className="bg-white bg-opacity-80 p-8 rounded-lg shadow-2xl text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold text-accent-pink animate-fade-in">Welcome to Eurotrip</h1>
        {(() => {
          const participant = useCurrentParticipant()
          const firstName = participant ? participant.participant_name.split(" ")[0] : null
          return firstName ? (
            <div className="text-4xl md:text-6xl font-extrabold text-blue-400 mt-4 animate-fade-in drop-shadow">
              {firstName}
            </div>
          ) : null
        })()}
      </div>
    </div>
  )
}
