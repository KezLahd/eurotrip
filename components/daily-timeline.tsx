"use client"

import type { ItineraryEvent, ParticipantProfile } from "@/types/itinerary"
import { format } from "date-fns"
import { TimelineEventWrapper } from "./timeline-event-wrapper"

interface DailyTimelineProps {
  events: ItineraryEvent[]
  allParticipantProfiles: Map<string, ParticipantProfile>
}

export function DailyTimeline({ events, allParticipantProfiles }: DailyTimelineProps) {
  const groupedEvents: { [key: string]: ItineraryEvent[] } = {}

  const sortedEvents = [...events].sort((a, b) => {
    const timeA = (a.leave_time_universal || a.start_date)?.getTime() || Number.POSITIVE_INFINITY
    const timeB = (b.leave_time_universal || b.start_date)?.getTime() || Number.POSITIVE_INFINITY
    return timeB - timeA
  })

  sortedEvents.forEach((event) => {
    const eventDate = event.start_date || event.leave_time_local
    if (eventDate) {
      const dateKey = format(eventDate, "yyyy-MM-dd")
      if (!groupedEvents[dateKey]) {
        groupedEvents[dateKey] = []
      }
      groupedEvents[dateKey].push(event)
    }
  })

  const sortedDates = Object.keys(groupedEvents).sort()

  if (sortedDates.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No activities found for any day.</p>
  }

  return (
    <div className="space-y-8">
      {sortedDates.map((dateKey) => (
        <div key={dateKey}>
          <h2 className="text-2xl font-bold text-primary-blue mb-4 sticky top-0 bg-white/80 backdrop-blur-sm z-20 py-2 rounded-lg shadow-sm px-4">
            {format(new Date(dateKey), "EEEE, MMM dd, yyyy")}
          </h2>
          <div className="relative py-4">
            {/* Main vertical bright blue line for the day */}
            <div className="absolute left-4 top-0 bottom-0 w-1 bg-primary-blue rounded-full" />
            {groupedEvents[dateKey].map((event) => (
              <TimelineEventWrapper key={event.id} event={event} allParticipantProfiles={allParticipantProfiles} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
