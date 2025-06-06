import { format, parse } from "date-fns"
import type { ItineraryEvent } from "@/types/itinerary"

interface EventTimeDisplayProps {
  event: ItineraryEvent
  type: "primary" | "secondary"
}

// Helper function to format time string from 24h to 12h with AM/PM and also return the date
function formatDateAndTime(timeStr: string | null): string | null {
  if (!timeStr) return null;
  try {
    // Try parsing with seconds first
    let date = parse(timeStr, "yyyy-MM-dd HH:mm:ss", new Date());
    if (!isNaN(date.getTime())) {
      return `${format(date, "MMM d")}, ${format(date, "h:mm a")}`;
    }
    // Fallback: Try parsing without seconds
    date = parse(timeStr, "yyyy-MM-dd HH:mm", new Date());
    if (!isNaN(date.getTime())) {
      return `${format(date, "MMM d")}, ${format(date, "h:mm a")}`;
    }
    // Fallback: Try parsing as ISO string
    date = new Date(timeStr);
    if (!isNaN(date.getTime())) {
      return `${format(date, "MMM d")}, ${format(date, "h:mm a")}`;
    }
    // If parsing fails, return the original string
    return timeStr;
  } catch (e) {
    // If parsing fails, return the original string
    console.warn("Could not parse time string:", timeStr);
    return timeStr;
  }
}

export function EventTimeDisplay({ event, type }: EventTimeDisplayProps) {
  let time: string | null = null
  let labelPrefix = ""

  function ensureString(val: string | Date | null | undefined): string | null {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (val instanceof Date) return val.toISOString();
    return null;
  }

  if (type === "primary") {
    switch (event.event_type) {
      case "flight":
        time = ensureString((event as any).departure_time_local || event.start_time_local || event.leave_time_local || null);
        labelPrefix = "Departure: ";
        break;
      case "transfer":
        time = ensureString((event as any).departure_time_local || event.start_time_local || event.leave_time_local || null);
        labelPrefix = "Departure: ";
        break;
      case "car_hire":
        time = ensureString((event as any).pickup_time_local || event.start_time_local || event.leave_time_local || null);
        labelPrefix = "Pickup: ";
        break;
      case "accommodation":
        time = ensureString((event as any).date_check_in_local || event.start_time_local || event.leave_time_local || null);
        labelPrefix = "Check-in: ";
        break;
      case "activity":
        time = ensureString(event.start_time_local || null);
        labelPrefix = "Start: ";
        break;
      default:
        time = ensureString(event.start_time_local || event.leave_time_local || null);
        labelPrefix = "Time: ";
    }
  } else {
    // type === "secondary"
    switch (event.event_type) {
      case "flight":
        time = ensureString((event as any).arrival_time_local || event.end_time_local || event.arrive_time_local || null);
        labelPrefix = "Arrival: ";
        break;
      case "transfer":
        time = ensureString((event as any).arrival_time_local || event.end_time_local || event.arrive_time_local || null);
        labelPrefix = "Arrival: ";
        break;
      case "car_hire":
        time = ensureString((event as any).dropoff_time_local || event.end_time_local || event.arrive_time_local || null);
        labelPrefix = "Dropoff: ";
        break;
      case "accommodation":
        time = ensureString((event as any).date_check_out || event.end_time_local || event.arrive_time_local || null);
        labelPrefix = "Check-out: ";
        break;
      case "activity":
        time = ensureString(event.end_time_local || null);
        labelPrefix = "End: ";
        break;
      default:
        time = ensureString(event.end_time_local || event.arrive_time_local || null);
        labelPrefix = "End Time: ";
    }
  }

  if (!time) return null

  // Format the time to 'Jun 19, 3:00 PM' (no year)
  const formattedDateTime = formatDateAndTime(time)

  return (
    <div className="text-base text-gray-700 whitespace-nowrap bg-light-blue p-1 rounded-md shadow-sm">
      <span className="font-bold text-accent-pink">{labelPrefix}</span>
      <span className="font-semibold text-accent-pink">{formattedDateTime}</span>
    </div>
  )
}
