"use client"

import type { ItineraryEvent, ParticipantProfile } from "@/types/itinerary"
import { TimelineEventWrapper } from "./timeline-event-wrapper"
import { cn } from "@/lib/utils" // Import cn for responsive classes
import { useMediaQuery } from "@/hooks/use-media-query" // Import useMediaQuery

interface ItineraryTimelineProps {
  events: ItineraryEvent[]
  allParticipantProfiles: Map<string, ParticipantProfile>
}

export function ContinuousTimeline({ events, allParticipantProfiles }: ItineraryTimelineProps) {
  // Sort events chronologically based on universal time, then local, then start date
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = (a.leave_time_universal || a.leave_time_local || a.start_date)?.getTime() || Number.POSITIVE_INFINITY
    const timeB = (b.leave_time_universal || b.leave_time_local || b.start_date)?.getTime() || Number.POSITIVE_INFINITY
    return timeA - timeB
  })

  const isDesktop = useMediaQuery("(min-width: 768px)") // Tailwind's md breakpoint

  if (sortedEvents.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No events for this date range.</p>
  }

  // The main container provides the relative context for the absolute timeline line.
  return (
    <div className="relative py-4">
      {/* Main vertical bright pink line for the entire timeline */}
      <div
        className={cn(
          "absolute left-4 top-0 bottom-0 rounded-full",
          isDesktop ? "w-1" : "w-2", // Thicker on mobile
          "bg-accent-pink", // Changed to accent-pink
        )}
      />

      {sortedEvents.map((event) => (
        <TimelineEventWrapper key={event.id} event={event} allParticipantProfiles={allParticipantProfiles} />
      ))}
    </div>
  )
}
