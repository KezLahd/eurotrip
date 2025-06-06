import { format } from "date-fns"
import type { ItineraryEvent } from "@/types/itinerary"

interface EventTimeDisplayProps {
  event: ItineraryEvent
  type: "primary" | "secondary"
}

export function EventTimeDisplay({ event, type }: EventTimeDisplayProps) {
  let time: Date | null = null
  let labelPrefix = ""

  if (type === "primary") {
    time =
      event.event_type === "flight" || event.event_type === "transfer" || event.event_type === "car_hire"
        ? event.leave_time_local
        : event.start_date

    switch (event.event_type) {
      case "flight":
        labelPrefix = "Departure: "
        break
      case "transfer":
        labelPrefix = "Departure: "
        break
      case "car_hire":
        labelPrefix = "Pickup: "
        break
      case "accommodation":
        labelPrefix = "Check-in: "
        break
      case "activity":
        labelPrefix = "Start: "
        break
      default:
        labelPrefix = "Time: "
    }
  } else {
    // type === "secondary"
    time =
      event.event_type === "flight" || event.event_type === "transfer" || event.event_type === "car_hire"
        ? event.arrive_time_local
        : event.end_date

    switch (event.event_type) {
      case "flight":
        labelPrefix = "Arrival: "
        break
      case "transfer":
        labelPrefix = "Arrival: "
        break
      case "car_hire":
        labelPrefix = "Dropoff: "
        break
      case "accommodation":
        labelPrefix = "Check-out: "
        break
      case "activity":
        labelPrefix = "End: "
        break
      default:
        labelPrefix = "End Time: "
    }
  }

  if (!time) return null

  // Format as "MMM dd, yyyy HH:mm"
  const formattedDateTime = format(time, "MMM dd, yyyy hh:mm a")

  return (
    <div className="text-base text-gray-700 whitespace-nowrap bg-light-blue p-1 rounded-md shadow-sm">
      <span className="font-bold text-accent-pink">{labelPrefix}</span>
      <span className="font-semibold text-accent-pink">{formattedDateTime}</span>
    </div>
  )
}
