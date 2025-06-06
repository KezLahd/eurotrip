// Raw data interfaces directly from your new Supabase tables
export interface RawFlight {
  id: number
  departure_city: string | null
  flight_photo_url: string | null
  arrival_city: string | null
  departure_time_local: string | null
  departure_time_utc: string | null
  arrival_time_local: string | null
  arrival_time_utc: string | null
  flight_number: string | null
  passengers: string | null // e.g., "SJ,LJ,KJ,PE"
  passenger_count: string | null // Assuming this is a string, will parse to number
  booking_reference: string | null
}

export interface RawAccommodation {
  id: number
  accomodation_name: string | null // e.g., "Hotel stay in Paris" or "Junior Suite"
  hotel_city: string | null
  hotel_name: string | null // This seems redundant with accomodation_name, but keeping for mapping
  hotel_photo_url: string | null
  hotel_address: string | null
  date_check_in_local: string | null
  date_check_in_utc: string | null
  date_check_out: string | null
  date_check_out_utc: string | null
  participants: string | null // e.g., "SJ,LJ,KJ,PE"
  participant_count: string | null // Assuming this is a string, will parse to number
  booking_reference: string | null
  breakfast_included: string | null // "Y" or null
}

export interface RawRoomConfiguration {
  id: number
  accomodation_name: string | null // To link to RawAccommodation
  room_type: string | null // e.g., "Room 101", "Junior Suite"
  participants: string | null // e.g., "KJ,PE"
  participant_count: string | null
  booking_reference: string | null // To link to booking_reference in accomodation table
}

export interface RawTransfer {
  id: number
  transfer_name: string | null
  transfer_photo_url: string | null
  transport_method: string | null // e.g., "Taxi", "Train"
  departure_location: string | null
  arrival_location: string | null
  departure_time_local: string | null
  arrival_time_local: string | null
  departure_time_utc: string | null
  arrival_time_utc: string | null
  participants: string | null
  participant_count: string | null
  booking_reference: string | null
  operator: string | null
}

export interface RawCarHire {
  id: number
  car_photo_url: string | null
  pickup_location: string | null
  dropoff_location: string | null
  city_name: string | null
  pickup_time_local: string | null
  pickup_time_utc: string | null
  dropoff_time_local: string | null
  dropoff_time_utc: string | null
  driver: string | null
  passengers: string | null // e.g., "Alice, Bob"
  booking_reference: string | null
}

export interface RawActivity {
  id: number
  activity_name: string | null
  activity_photo_url: string | null
  additional_details: string | null
  booking_reference: string | null
  city: string | null
  start_time_local: string | null
  start_time_utc: string | null
  end_time_local: string | null
  end_time_utc: string | null
  participants: string | null
  participant_count: string | null
  location: string | null // General location for the activity
}

// New: Raw Transport Ticket (corrected to match DB column 'passenger_name')
export interface RawTransportTicket {
  id: number
  booking_reference: string | null
  passenger: string | null // Corrected: now matches DB column 'passenger'
  ticket_number: string | null
  transfer_name: string | null
}

// New: Raw Participant (from the provided schema)
export interface RawParticipant {
  id: number
  participants_initials: string | null
  participant_name: string | null
  participant_photo_url: string | null
}

// Interface for individual room details within a grouped accommodation
export interface RoomDetail {
  id: number
  room_type: string | null // e.g., "Room 101", "Junior Suite"
  participants: string[]
  notes: string | null // Can be derived from additional_details if needed
  booking_reference: string | null // Added: Unique booking reference for this specific room
}

// New interface for individual car details within a grouped car hire
export interface CarDetail {
  id: number
  car_name: string | null // New: Name of the car (e.g., driver's name)
  driver: string | null
  passengers: string[] // Passengers *excluding* the driver for this specific car
  booking_reference: string | null
  pickup_location: string | null
  dropoff_location: string | null
  city_name: string | null
  pickup_time_local: Date | null
  dropoff_time_local: Date | null
  car_photo_url: string | null
}

// New: Transport Ticket Detail (passenger_name will be the resolved full name)
export interface TransportTicketDetail {
  id: number
  passenger_name: string // This will be the resolved full name
  ticket_number: string | null
  booking_reference: string | null
}

// New: Participant Profile (transformed from RawParticipant)
export interface ParticipantProfile {
  name: string
  initials: string | null
  photoUrl: string | null
}

// This interface represents the transformed, clean data structure used by the UI components
// It's a superset of all possible event properties
export interface ItineraryEvent {
  id: number
  event_type: "flight" | "accommodation" | "transfer" | "activity" | "car_hire" | "unknown"
  description: string | null // Main title for the card (e.g., flight number, hotel name, activity name)
  booking_reference: string | null
  participants: string[] // Aggregated for grouped accommodations, or direct for others
  location: string | null // General location (e.g., city for hotel, activity city)
  notes: string | null // Additional details

  // Time properties (can be for departure/arrival or start/end)
  start_date: Date | null // For accommodations, activities
  end_date: Date | null // For accommodations, activities
  leave_time_local: Date | null // For flights, transfers, car hires (departure/pickup)
  arrive_time_local: Date | null // For flights, transfers, car hires (arrival/dropoff)
  leave_time_universal: Date | null
  arrive_time_universal: Date | null

  // Specific properties for different event types
  // Flight specific
  airline: string | null // Maps to flight_number
  leave_location: string | null // departure_city
  arrive_location: string | null // arrival_city
  passengers: string[] // flight passengers

  // Accommodation specific (main card properties)
  hotel_name: string | null // accomodation_name
  hotel_address: string | null
  breakfast_provided: boolean // breakfast_included
  hotel_photo_url: string | null // Added for direct mapping
  rooms?: RoomDetail[] // Optional: for grouped accommodation events

  // Transfer specific
  company: string | null // transport_method
  transfer_photo_url: string | null
  transport_tickets?: TransportTicketDetail[] // New: for transfers with specific tickets
  additional_transfer_info?: string | null // NEW: For extracted info from parentheses

  // Car Hire specific
  driver: string | null // This will be null for grouped car hire events, details are in `cars`
  car_photo_url: string | null // This will be null for grouped car hire events, details are in `cars`
  cars?: CarDetail[] // Optional: for grouped car hire events

  // Activity specific
  activity_photo_url: string | null
}

export type FlightCard = {}
export type AccommodationCard = {}
export type TransferActivityCard = {}
