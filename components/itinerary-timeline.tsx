import { type ItineraryEvent, FlightCard, AccommodationCard, TransferActivityCard } from "@/components/event-cards"
import { format } from "date-fns"

interface ItineraryTimelineProps {
  events: ItineraryEvent[]
}

// Helper component for displaying time and date with dynamic labels
function EventTimeDisplay({ event }: { event: ItineraryEvent }) {
  let primaryTime: Date | null = null
  let secondaryTime: Date | null = null
  let primaryLabel = "Time"
  let secondaryLabel = ""

  switch (event.event_type) {
    case "flight":
    case "transfer":
    case "car_hire":
      primaryTime = event.leave_time_local
      secondaryTime = event.arrive_time_local
      primaryLabel = event.event_type === "car_hire" ? "Pickup" : "Departure"
      secondaryLabel = event.event_type === "car_hire" ? "Dropoff" : "Arrival"
      break
    case "accommodation":
    case "activity":
      primaryTime = event.start_date
      secondaryTime = event.end_date
      primaryLabel = event.event_type === "accommodation" ? "Check-in" : "Start"
      secondaryLabel = event.event_type === "accommodation" ? "Check-out" : "End"
      break
    default:
      primaryTime = event.leave_time_local || event.start_date
      primaryLabel = "Time"
      break
  }

  return (
    <>
      {primaryTime && (
        <>
          <p className="font-bold text-dark-teal text-sm md:text-base">
            {primaryLabel}: {format(primaryTime, "HH:mm")}
          </p>
          <p className="text-xs text-muted-foreground hidden md:block">{format(primaryTime, "MMM dd, yyyy")}</p>
        </>
      )}
      {secondaryTime && (
        <>
          <p className="font-bold text-dark-teal text-sm md:text-base mt-2">
            {secondaryLabel}: {format(secondaryTime, "HH:mm")}
          </p>
          <p className="text-xs text-muted-foreground hidden md:block">{format(secondaryTime, "MMM dd, yyyy")}</p>
        </>
      )}
      {!primaryTime && !secondaryTime && <p className="font-bold text-dark-teal text-sm md:text-base">N/A</p>}
    </>
  )
}

export function ItineraryTimeline({ events }: ItineraryTimelineProps) {
  // Sort events chronologically based on universal time, then local, then start date
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = (a.leave_time_universal || a.leave_time_local || a.start_date)?.getTime() || Number.POSITIVE_INFINITY
    const timeB = (b.leave_time_universal || b.leave_time_local || b.start_date)?.getTime() || Number.POSITIVE_INFINITY
    return timeA - timeB
  })

  if (sortedEvents.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No events for this date range.</p>
  }

  return (
    <div className="relative py-4">
      {/* Vertical line */}
      <div className="absolute left-4 md:left-6 top-0 bottom-0 w-1 bg-dark-teal rounded-full" />

      {sortedEvents.map((event, index) => {
        return (
          <div key={event.id} className="relative mb-8">
            {/* Timeline dot - positioned relative to the main timeline container's left edge */}
            <div className="absolute left-[14.5px] md:left-[21.5px] top-2 md:top-4 h-4 w-4 md:h-6 md:w-6 bg-accent-pink rounded-full border-2 border-white z-10" />

            <div className="flex items-start pl-8 md:pl-12">
              {/* Time display - positioned to the left of the content area */}
              <div className="flex-shrink-0 w-16 md:w-24 text-right pr-4 md:pr-8 pt-1 md:pt-2 -ml-4 md:-ml-6">
                <EventTimeDisplay event={event} />
              </div>

              {/* Event Card */}
              <div className="flex-grow">
                {event.event_type === "flight" && <FlightCard event={event} />}
                {event.event_type === "accommodation" && <AccommodationCard event={event} />}
                {(event.event_type === "transfer" ||
                  event.event_type === "car_hire" ||
                  event.event_type === "activity") && <TransferActivityCard event={event} />}
                {event.event_type === "unknown" && (
                  <div className="bg-gray-100 p-4 rounded-lg shadow-sm text-sm text-gray-600">
                    <p className="font-semibold">Unknown Event Type:</p>
                    <p>{event.description || "No description"}</p>
                    <p className="text-xs mt-1">
                      Please check the `event_type` or `description` in Supabase for this entry.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
