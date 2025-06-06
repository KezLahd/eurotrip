"use client"

import type { ItineraryEvent, ParticipantProfile } from "@/types/itinerary"
import { ParticipantBadge } from "./event-cards" // Import ParticipantBadge
import { cn } from "@/lib/utils" // Import cn for utility classes

interface ParticipantGridProps {
  allParticipantProfiles: Map<string, ParticipantProfile>
  allEvents: ItineraryEvent[] // All events to calculate trip duration
}

export function ParticipantGrid({ allParticipantProfiles, allEvents }: ParticipantGridProps) {
  const participantsArray = Array.from(allParticipantProfiles.values())

  if (participantsArray.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No participants found.</p>
  }

  return (
    <div className="flex flex-wrap justify-center gap-6 p-4">
      {participantsArray.map((profile) => (
        <div key={profile.name} className="flex flex-col items-center text-center">
          <ParticipantBadge
            name={profile.name} // Pass the full name for lookup
            allParticipantProfiles={allParticipantProfiles}
            allEvents={allEvents} // Pass all events for trip duration calculation
            size="large" // Set size to large for the participant grid
            showTripDuration={true} // Set showTripDuration to true so that the trip duration is displayed in the popover
          />
          <p
            className={cn(
              "mt-2 text-sm font-semibold text-accent-pink", // Pink text
              "bg-white rounded-md px-2 py-1 shadow-sm", // White container
            )}
          >
            {profile.name}
          </p>
        </div>
      ))}
    </div>
  )
}
