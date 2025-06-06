"use server"

import { createServerClient } from "@/lib/supabase-client"
import { cookies } from "next/headers" // Import cookies
import {
  transformFlight,
  transformTransfer,
  transformActivity,
  processAccommodationData,
  processCarHireData,
  parseParticipants,
  parseCustomDateString,
} from "@/lib/data-transformers"
import type {
  ItineraryEvent,
  RawFlight,
  RawAccommodation,
  RawRoomConfiguration,
  RawTransfer,
  RawCarHire,
  RawActivity,
  RawTransportTicket,
  RawParticipant,
  ParticipantProfile,
} from "@/types/itinerary"

// Define a type for the category to fetch
type FetchCategory = "flights-transfers" | "accommodation" | "activities" | "participants"

export async function fetchItineraryData(
  category?: FetchCategory, // Make category optional
): Promise<{
  events: ItineraryEvent[]
  allParticipantProfiles: Map<string, ParticipantProfile>
}> {
  const supabase = createServerClient(cookies())
  const allTransformedEvents: ItineraryEvent[] = []
  const allParticipantProfiles = new Map<string, ParticipantProfile>()

  try {
    // Always fetch participants first, as they are needed for all transformations
    const { data: rawParticipants, error: participantsError } = await supabase.from("participants").select("*")
    if (participantsError) {
      console.error("Error fetching participants:", participantsError.message)
    } else {
      ;(rawParticipants as RawParticipant[]).forEach((p) => {
        if (p.participant_name) {
          allParticipantProfiles.set(p.participant_name, {
            name: p.participant_name,
            initials: p.participants_initials,
            photoUrl: p.participant_photo_url,
          })
        }
      })
    }

    // Fetch data based on the provided category
    if (!category || category === "flights-transfers") {
      // Fetch flights
      const { data: rawFlights, error: flightsError } = await supabase.from("flights").select("*")
      if (flightsError) {
        console.error("Error fetching flights:", flightsError.message)
      } else {
        allTransformedEvents.push(...(rawFlights as RawFlight[]).map((f) => transformFlight(f, allParticipantProfiles)))
      }

      // Fetch transport tickets (needed for transfers)
      const { data: rawTransportTickets, error: transportTicketsError } = await supabase
        .from("transport_tickets")
        .select("*")
      if (transportTicketsError) console.error("Error fetching transport tickets:", transportTicketsError.message)

      // Fetch transfers
      const { data: rawTransfers, error: transfersError } = await supabase.from("transfers").select("*")
      if (transfersError) {
        console.error("Error fetching transfers:", transfersError.message)
      } else {
        allTransformedEvents.push(
          ...(rawTransfers as RawTransfer[]).map((t) =>
            transformTransfer(t, rawTransportTickets as RawTransportTicket[], allParticipantProfiles),
          ),
        )
      }

      // Fetch car hires
      const { data: rawCarHires, error: carHiresError } = await supabase.from("car_hires").select("*")
      if (carHiresError) {
        console.error("Error fetching car hires:", carHiresError.message)
      } else {
        const processedCarHires = processCarHireData(rawCarHires as RawCarHire[], allParticipantProfiles)
        allTransformedEvents.push(...processedCarHires)
      }
    }

    if (!category || category === "accommodation") {
      // Fetch accommodations and room configurations
      const { data: rawAccommodations, error: accError } = await supabase.from("accomodation").select("*")
      const { data: rawRoomConfigs, error: roomConfigError } = await supabase.from("room_configuration").select("*")

      if (accError) console.error("Error fetching accommodations:", accError.message)
      if (roomConfigError) console.error("Error fetching room configurations:", roomConfigError.message)

      if (rawAccommodations && rawRoomConfigs) {
        const processedAccs = processAccommodationData(
          rawAccommodations as RawAccommodation[],
          rawRoomConfigs as RawRoomConfiguration[],
          allParticipantProfiles,
        )
        allTransformedEvents.push(...processedAccs)
      } else if (rawAccommodations) {
        // Fallback if room configs fail but accommodations succeed
        allTransformedEvents.push(
          ...(rawAccommodations as RawAccommodation[]).map((acc) => ({
            id: acc.id,
            event_type: "accommodation",
            description: acc.accomodation_name || acc.hotel_name || "Accommodation",
            booking_reference: acc.booking_reference,
            participants: parseParticipants(acc.participants, allParticipantProfiles),
            location: acc.hotel_city,
            notes: acc.hotel_address,
            start_date: parseCustomDateString(acc.date_check_in_local),
            end_date: parseCustomDateString(acc.date_check_out),
            leave_time_local: null,
            arrive_time_local: null,
            leave_time_universal: acc.date_check_in_utc ? new Date(acc.date_check_in_utc) : null,
            arrive_time_universal: acc.date_check_out_utc ? new Date(acc.date_check_out_utc) : null,
            hotel_name: acc.accomodation_name || acc.hotel_name,
            hotel_address: acc.hotel_address,
            breakfast_provided: acc.breakfast_included === "Y",
            hotel_photo_url: acc.hotel_photo_url,
            rooms: [],
            airline: null,
            leave_location: null,
            arrive_location: null,
            passengers: [],
            company: null,
            transfer_photo_url: null,
            driver: null,
            car_photo_url: null,
            cars: [],
            activity_photo_url: null,
            transport_tickets: [],
            additional_transfer_info: null,
          })),
        )
      }
    }

    if (!category || category === "activities") {
      // Fetch activities
      const { data: rawActivities, error: activitiesError } = await supabase.from("activities").select("*")
      if (activitiesError) {
        console.error("Error fetching activities:", activitiesError.message)
      } else {
        allTransformedEvents.push(
          ...(rawActivities as RawActivity[]).map((a) => transformActivity(a, allParticipantProfiles)),
        )
      }
    }

    return { events: allTransformedEvents, allParticipantProfiles }
  } catch (e: any) {
    console.error("An unexpected error occurred during data fetching in Server Action:", e.message || String(e))
    return { events: [], allParticipantProfiles: new Map() } // Return empty on error
  }
}
