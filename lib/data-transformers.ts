import { parse, isValid } from "date-fns"
import type {
  RawFlight,
  RawAccommodation,
  RawRoomConfiguration,
  RawTransfer,
  RawCarHire,
  RawActivity,
  RawTransportTicket,
  ItineraryEvent,
  RoomDetail,
  CarDetail,
  TransportTicketDetail,
  ParticipantProfile, // New import
} from "@/types/itinerary"

/**
 * Parses various custom date string formats into a Date object.
 * Tries formats in order of specificity/likelihood.
 */
export function parseCustomDateString(dateString: string | null): Date | undefined {
  if (!dateString) return undefined

  let parsedDate: Date

  // 1. Try yyyy-MM-dd HH:mm (e.g., "2025-07-10 10:00") - common for local times
  parsedDate = parse(dateString, "yyyy-MM-dd HH:mm", new Date())
  if (isValid(parsedDate)) {
    return parsedDate
  }

  // 2. Try dd/MM/yyyy @ HH:mm (e.g., "19/06/2025 @ 13:20") - older format
  parsedDate = parse(dateString, "dd/MM/yyyy @ hh:mm", new Date())
  if (isValid(parsedDate)) {
    return parsedDate
  }

  // 3. Try dd/MM/yyyy @ hh:mm a (e.g., "16/06/2025 @ 4:00 AM") - older format with AM/PM
  parsedDate = parse(dateString, "dd/MM/yyyy @ hh:mm a", new Date())
  if (isValid(parsedDate)) {
    return parsedDate
  }

  // 4. Fallback to native Date constructor for ISO 8601 strings (e.g., UTC times)
  try {
    parsedDate = new Date(dateString)
    if (isValid(parsedDate)) {
      return parsedDate
    }
  } catch (error) {
    // Ignore parsing errors for native Date constructor, will log warning below
  }

  console.warn(`Could not parse date string: "${dateString}"`)
  return undefined
}

/**
 * Parses comma-separated participant strings, resolving initials to full names
 * using the provided participant profiles map.
 */
export function parseParticipants(
  participantsString: string | null,
  allParticipantProfiles: Map<string, ParticipantProfile>,
): string[] {
  if (!participantsString) return []

  const rawNames = participantsString.split(",").map((p) => p.trim())
  const resolvedNames: string[] = []

  rawNames.forEach((rawName) => {
    // 1. Try to find by full name (case-sensitive for map keys)
    if (allParticipantProfiles.has(rawName)) {
      resolvedNames.push(rawName)
      return
    }

    // 2. Try to find by initials (iterate through map values)
    let foundFullName: string | null = null
    for (const profile of allParticipantProfiles.values()) {
      if (profile.initials?.toLowerCase() === rawName.toLowerCase()) {
        foundFullName = profile.name
        break
      }
    }

    if (foundFullName) {
      resolvedNames.push(foundFullName)
    } else {
      // If no match, keep the original raw name (could be an unknown participant or a full name not in the map)
      resolvedNames.push(rawName)
    }
  })

  return resolvedNames
}

export function transformFlight(
  raw: RawFlight,
  allParticipantProfiles: Map<string, ParticipantProfile>,
): ItineraryEvent {
  return {
    id: raw.id,
    event_type: "flight",
    description: raw.flight_number || "Flight",
    booking_reference: raw.booking_reference || undefined,
    participants: parseParticipants(raw.passengers ?? null, allParticipantProfiles),
    location: raw.arrival_city || undefined,
    notes: undefined,
    start_date: raw.departure_time_local ? parseCustomDateString(raw.departure_time_local) : undefined,
    end_date: raw.arrival_time_local ? parseCustomDateString(raw.arrival_time_local) : undefined,
    leave_time_local: raw.departure_time_local ? parseCustomDateString(raw.departure_time_local) : undefined,
    arrive_time_local: raw.arrival_time_local ? parseCustomDateString(raw.arrival_time_local) : undefined,
    leave_time_universal: raw.departure_time_utc ? new Date(raw.departure_time_utc) : undefined,
    arrive_time_universal: raw.arrival_time_utc ? new Date(raw.arrival_time_utc) : undefined,
    airline: raw.flight_number || undefined,
    leave_location: raw.departure_city || undefined,
    arrive_location: raw.arrival_city || undefined,
    passengers: parseParticipants(raw.passengers ?? null, allParticipantProfiles),
    company: undefined,
    transfer_photo_url: raw.flight_photo_url || undefined,
    cars: [],
    activity_photo_url: undefined,
    transport_tickets: [],
    additional_transfer_info: undefined,
    // @ts-ignore: allow custom fields for timeline display
    departure_time_local: raw.departure_time_local || undefined,
    // @ts-ignore: allow custom fields for timeline display
    arrival_time_local: raw.arrival_time_local || undefined,
  }
}

// New: Transform Transport Ticket (updated to resolve passenger initials)
export function transformTransportTicket(
  raw: RawTransportTicket,
  allParticipantProfiles: Map<string, ParticipantProfile>,
): TransportTicketDetail {
  // Resolve the passenger's full name from their initials using the 'passenger' column
  const resolvedPassengerName =
    parseParticipants(raw.passenger ?? null, allParticipantProfiles)[0] || raw.passenger || "Unknown Passenger"

  return {
    ticket_type: "Train", // or set appropriately if you have this info
    ticket_number: raw.ticket_number || "",
    passenger: raw.passenger || "",
    passenger_name: resolvedPassengerName,
    booking_reference: raw.booking_reference || undefined,
  }
}

export function transformTransfer(
  raw: RawTransfer,
  allRawTransportTickets: RawTransportTicket[],
  allParticipantProfiles: Map<string, ParticipantProfile>,
): ItineraryEvent {
  const transformedTickets: TransportTicketDetail[] = []

  if (raw.booking_reference || raw.transfer_name) {
    const relevantTickets = allRawTransportTickets.filter(
      (ticket) =>
        (raw.booking_reference && ticket.booking_reference === raw.booking_reference) ||
        (raw.transfer_name && ticket.transfer_name === raw.transfer_name),
    )
    transformedTickets.push(...relevantTickets.map((t) => transformTransportTicket(t, allParticipantProfiles)))
  }

  let description = raw.transfer_name || raw.transport_method || "Transfer"
  const parenthesesRegex = /\s*$$[^)]*$$\s*$/
  description = description.replace(parenthesesRegex, "").trim()

  const additionalInfo = raw.operator || undefined

  return {
    id: raw.id,
    event_type: "transfer",
    description: description,
    booking_reference: raw.booking_reference || undefined,
    participants: parseParticipants(raw.participants ?? null, allParticipantProfiles),
    location: raw.arrival_location || raw.departure_location || undefined,
    notes: undefined,
    start_date: raw.departure_time_local ? parseCustomDateString(raw.departure_time_local) : undefined,
    end_date: raw.arrival_time_local ? parseCustomDateString(raw.arrival_time_local) : undefined,
    leave_time_local: raw.departure_time_local ? parseCustomDateString(raw.departure_time_local) : undefined,
    arrive_time_local: raw.arrival_time_local ? parseCustomDateString(raw.arrival_time_local) : undefined,
    leave_time_universal: raw.departure_time_utc ? new Date(raw.departure_time_utc) : undefined,
    arrive_time_universal: raw.arrival_time_utc ? new Date(raw.arrival_time_utc) : undefined,
    airline: undefined,
    leave_location: raw.departure_location || undefined,
    arrive_location: raw.arrival_location || undefined,
    passengers: [],
    company: raw.transport_method || undefined,
    transfer_photo_url: raw.transfer_photo_url || undefined,
    cars: [],
    activity_photo_url: undefined,
    transport_tickets: transformedTickets,
    additional_transfer_info: additionalInfo,
    // @ts-ignore: allow custom fields for timeline display
    departure_time_local: raw.departure_time_local || undefined,
    // @ts-ignore: allow custom fields for timeline display
    arrival_time_local: raw.arrival_time_local || undefined,
  }
}

export function transformActivity(
  raw: RawActivity,
  allParticipantProfiles: Map<string, ParticipantProfile>,
): ItineraryEvent {
  return {
    id: raw.id,
    event_type: "activity",
    description: raw.activity_name || "Activity",
    activity_name: raw.activity_name || undefined,
    booking_reference: raw.booking_reference || undefined,
    participants: parseParticipants(raw.participants ?? null, allParticipantProfiles),
    location: raw.location || raw.city || undefined,
    notes: raw.additional_details || undefined,
    start_date: raw.start_time_local ? parseCustomDateString(raw.start_time_local) : undefined,
    end_date: raw.end_time_local ? parseCustomDateString(raw.end_time_local) : undefined,
    leave_time_local: raw.start_time_local ? parseCustomDateString(raw.start_time_local) : undefined,
    arrive_time_local: raw.end_time_local ? parseCustomDateString(raw.end_time_local) : undefined,
    leave_time_universal: raw.start_time_utc ? new Date(raw.start_time_utc) : undefined,
    arrive_time_universal: raw.end_time_utc ? new Date(raw.end_time_utc) : undefined,
    airline: undefined,
    leave_location: undefined,
    arrive_location: undefined,
    passengers: [],
    cars: [],
    activity_photo_url: raw.activity_photo_url || undefined,
    transport_tickets: [],
    additional_transfer_info: undefined,
    start_time_local: raw.start_time_local || undefined,
    end_time_local: raw.end_time_local || undefined,
  }
}

// Add new type for shopping data
type ShoppingData = {
  id: number;
  accommodation_id: number;
  shopping_name: string;
  shopping_location: string;
  shopping_distance: string;
  shopping_rating: string;
  shopping_photo_url: string;
  shopping_times: string;
  shopping_cost: string;
}

// Add new types for food data
type SavouryFoodData = {
  id: number;
  accommodation_id: number;
  food_name: string;
  vendor_name: string | null;
  vendor_location: string | null;
  vendor_distance: string | null;
  food_photo_url: string | null;
  menu_url: string | null;
}

type SweetFoodData = {
  id: number;
  accommodation_id: number;
  food_name: string;
  vendor_name: string | null;
  vendor_location: string | null;
  vendor_distance: string | null;
  food_photo_url: string | null;
  menu_url: string | null;
}

/**
 * Processes raw accommodation events and their room configurations.
 * Each RawAccommodation becomes a distinct ItineraryEvent card.
 * Room configurations are attached as 'rooms' within their parent accommodation.
 */
export function processAccommodationData(
  rawAccommodations: RawAccommodation[],
  rawRoomConfigs: RawRoomConfiguration[],
  allParticipantProfiles: Map<string, ParticipantProfile>,
): ItineraryEvent[] {
  const transformedAccommodations: ItineraryEvent[] = []

  rawAccommodations.forEach((acc) => {
    const baseEvent: ItineraryEvent = {
      id: acc.id,
      event_type: "accommodation",
      description: acc.accommodation_name || acc.hotel_name || "Accommodation",
      booking_reference: acc.booking_reference || undefined,
      participants: parseParticipants(acc.participants ?? null, allParticipantProfiles),
      location: acc.hotel_city || undefined,
      notes: acc.hotel_address || undefined,
      start_date: acc.date_check_in_local ? parseCustomDateString(acc.date_check_in_local) : undefined,
      end_date: acc.date_check_out ? parseCustomDateString(acc.date_check_out) : undefined,
      leave_time_local: undefined,
      arrive_time_local: undefined,
      leave_time_universal: acc.date_check_in_utc ? new Date(acc.date_check_in_utc) : undefined,
      arrive_time_universal: acc.date_check_out_utc ? new Date(acc.date_check_out_utc) : undefined,
      rooms: [],
      airline: undefined,
      leave_location: undefined,
      arrive_location: undefined,
      passengers: [],
      company: undefined,
      transfer_photo_url: undefined,
      cars: [],
      activity_photo_url: undefined,
      transport_tickets: [],
      additional_transfer_info: undefined,
      hotel_photo_url: acc.hotel_photo_url || undefined,
      accommodation_id: acc.id,
      additional_features_gym: acc.additional_features_gym || undefined,
      additional_features_cafe: acc.additional_features_cafe || undefined,
      additional_features_restaurant: acc.additional_features_restaurant || undefined,
      additional_features_shopping: acc.additional_features_shopping || undefined,
      additional_features_food_savoury: acc.additional_features_food_savoury || undefined,
      additional_features_food_sweet: acc.additional_features_food_sweet || undefined,
      // @ts-ignore: allow custom fields for timeline display
      date_check_in_local: acc.date_check_in_local || undefined,
      // @ts-ignore: allow custom fields for timeline display
      date_check_out: acc.date_check_out || undefined,
    }

    // Find all room configurations that belong to this specific accommodation entry
    // Linking ONLY using accommodation_name (trimmed and lowercased)
    const matchingRoomConfigs = rawRoomConfigs.filter((rc) => {
      const rcAccName = rc.accommodation_name?.toLowerCase().trim() || undefined;
      const accAccName = acc.accommodation_name?.toLowerCase().trim() || undefined;
      const isNameMatch = rcAccName && accAccName && rcAccName === accAccName;
      return isNameMatch;
    });

    // Add room details to the base event
    matchingRoomConfigs.forEach((roomConfig) => {
      const roomDetail: RoomDetail = {
        id: roomConfig.id,
        room_type: roomConfig.room_type,
        participants: parseParticipants(roomConfig.participants, allParticipantProfiles),
        notes: null,
        booking_reference: roomConfig.booking_reference,
      }
      baseEvent.rooms!.push(roomDetail)
    })

    // Handle numbering of duplicate room_type within this accommodation's rooms
    if (baseEvent.rooms && baseEvent.rooms.length > 1) {
      const roomTypeCounts: { [type: string]: number } = {}
      baseEvent.rooms.forEach((room) => {
        const type = room.room_type || "Unnamed Room"
        roomTypeCounts[type] = (roomTypeCounts[type] || 0) + 1
      })

      const currentRoomTypeIndices: { [type: string]: number } = {}
      baseEvent.rooms.forEach((room) => {
        const type = room.room_type || "Unnamed Room"
        if (roomTypeCounts[type] > 1) {
          currentRoomTypeIndices[type] = (currentRoomTypeIndices[type] || 0) + 1
          room.room_type = `${type} ${currentRoomTypeIndices[type]}`
        }
      })
    }

    transformedAccommodations.push(baseEvent)
  })

  return transformedAccommodations
}

/**
 * Processes raw car hire events and groups them by pickup/dropoff locations and times.
 * Each group becomes a distinct ItineraryEvent card with a 'cars' array.
 */
export function processCarHireData(
  rawCarHires: RawCarHire[],
  allParticipantProfiles: Map<string, ParticipantProfile>,
): ItineraryEvent[] {
  const groupedCarHires = new Map<string, ItineraryEvent>()

  rawCarHires.forEach((raw) => {
    // Create a unique grouping key based on location and time
    const groupingKey =
      `${raw.pickup_location || ""}-${raw.dropoff_location || ""}-${raw.pickup_time_local || ""}-${raw.dropoff_time_local || ""}`.toLowerCase()

    let event = groupedCarHires.get(groupingKey)

    if (!event) {
      // Create a new ItineraryEvent for this group
      event = {
        id: raw.id,
        event_type: "car_hire",
        description: `Car Hire in ${raw.city_name || "Multiple Cities"}`,
        booking_reference: raw.booking_reference || undefined,
        participants: [],
        location: raw.city_name || undefined,
        notes: undefined,
        start_date: raw.pickup_time_local ? parseCustomDateString(raw.pickup_time_local) : undefined,
        end_date: raw.dropoff_time_local ? parseCustomDateString(raw.dropoff_time_local) : undefined,
        leave_time_local: raw.pickup_time_local ? parseCustomDateString(raw.pickup_time_local) : undefined,
        arrive_time_local: raw.dropoff_time_local ? parseCustomDateString(raw.dropoff_time_local) : undefined,
        leave_time_universal: raw.pickup_time_utc ? new Date(raw.pickup_time_utc) : undefined,
        arrive_time_universal: raw.dropoff_time_utc ? new Date(raw.dropoff_time_utc) : undefined,
        cars: [],
        airline: undefined,
        leave_location: undefined,
        arrive_location: undefined,
        passengers: [],
        company: undefined,
        transfer_photo_url: undefined,
        activity_photo_url: undefined,
        transport_tickets: [],
        additional_transfer_info: undefined,
      }
      groupedCarHires.set(groupingKey, event)
    }

    // --- NEW: Always add a CarDetail for each car_hire row ---
    // Resolve driver and passengers to full names
    const driverFullName = raw.driver ? parseParticipants(raw.driver, allParticipantProfiles)[0] : null;
    const allPassengerFullNames = parseParticipants(raw.passengers, allParticipantProfiles);
    const passengers = driverFullName ? allPassengerFullNames.filter(p => p !== driverFullName) : allPassengerFullNames;
    const carDetail: CarDetail = {
      id: raw.id,
      car_name: `Car ${event.cars!.length + 1}`,
      driver: driverFullName,
      passengers: passengers,
      booking_reference: raw.booking_reference || null,
      pickup_location: raw.pickup_location || null,
      dropoff_location: raw.dropoff_location || null,
      city_name: raw.city_name || null,
      pickup_time_local: raw.pickup_time_local ? parseCustomDateString(raw.pickup_time_local) || null : null,
      dropoff_time_local: raw.dropoff_time_local ? parseCustomDateString(raw.dropoff_time_local) || null : null,
      car_photo_url: raw.car_photo_url || null,
    };
    event.cars!.push(carDetail);

    // Aggregate participants for the main event (drivers + non-driver passengers)
    const currentParticipants = new Set(event.participants)
    if (driverFullName) currentParticipants.add(driverFullName)
    passengers.forEach((p) => currentParticipants.add(p))
    event.participants = Array.from(currentParticipants)

    // Update main event's start/end times if this car hire has earlier start or later end
    const pickupDate = raw.pickup_time_local ? parseCustomDateString(raw.pickup_time_local) : undefined;
    const dropoffDate = raw.dropoff_time_local ? parseCustomDateString(raw.dropoff_time_local) : undefined;
    if (pickupDate && (!event.start_date || pickupDate < event.start_date)) {
      event.start_date = pickupDate;
      event.leave_time_local = pickupDate;
    }
    if (dropoffDate && (!event.end_date || dropoffDate > event.end_date)) {
      event.end_date = dropoffDate;
      event.arrive_time_local = dropoffDate;
    }
  })

  return Array.from(groupedCarHires.values())
}
