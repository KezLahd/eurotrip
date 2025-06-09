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
  accommodation_name: string | null // e.g., "Hotel stay in Paris" or "Junior Suite"
  hotel_city: string | null
  hotel_name: string | null // This seems redundant with accommodation_name, but keeping for mapping
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
  additional_features_gym: boolean | null
  additional_features_cafe: boolean | null
  additional_features_restaurant: boolean | null
  additional_features_shopping: boolean | null
  additional_features_food_savoury: boolean | null
  additional_features_food_sweet: boolean | null
}

export interface RawRoomConfiguration {
  id: number
  accommodation_name: string | null // To link to RawAccommodation
  room_type: string | null // e.g., "Room 101", "Junior Suite"
  participants: string | null // e.g., "KJ,PE"
  participant_count: string | null
  booking_reference: string | null // To link to booking_reference in accommodation table
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
  activity_name: string | undefined
  activity_photo_url: string | undefined
  additional_details: string | undefined
  booking_reference: string | undefined
  city: string | undefined
  start_time_local: string | undefined
  start_time_utc: string | undefined
  end_time_local: string | undefined
  end_time_utc: string | undefined
  participants: string | undefined
  participant_count: string | undefined
  location: string | undefined // General location for the activity
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
  ticket_type: string
  ticket_number: string
  passenger: string
  passenger_name?: string
  booking_reference?: string
}

// New: Participant Profile (transformed from RawParticipant)
export interface ParticipantProfile {
  name: string
  initials: string | null
  photoUrl: string | null
}

// Add new types for food data
export interface RawSavouryFood {
  id: number
  accommodation_id: number
  food_name: string
  vendor_name: string | null
  vendor_location: string | null
  vendor_distance: string | null
  food_photo_url: string | null
  menu_url: string | null
}

export interface RawSweetFood {
  id: number
  accommodation_id: number
  food_name: string
  vendor_name: string | null
  vendor_location: string | null
  vendor_distance: string | null
  food_photo_url: string | null
  menu_url: string | null
}

// This interface represents the transformed, clean data structure used by the UI components
// It's a superset of all possible event properties
export interface ItineraryEvent {
  id: number
  event_type: "flight" | "transfer" | "accommodation" | "activity" | "car_hire" | "unknown"
  description?: string
  company?: string
  leave_time_universal?: Date
  leave_time_local?: Date
  arrive_time_universal?: Date
  arrive_time_local?: Date
  start_date?: Date
  end_date?: Date
  location?: string
  participants?: string[]
  participant_count?: string
  room_details?: RoomDetail[]
  transport_type?: "train" | "bus" | "ferry" | "walk" | "taxi" | "car"
  // Activity specific fields
  activity_name?: string
  activity_photo_url?: string
  additional_details?: string
  booking_reference?: string
  city?: string
  start_time_local?: string
  start_time_utc?: string
  end_time_local?: string
  end_time_utc?: string
  // Transfer specific fields
  transport_tickets?: TransportTicketDetail[]
  transfer_photo_url?: string
  additional_transfer_info?: string // Added for transfer operator info
  // Accommodation specific fields
  rooms?: RoomDetail[]
  hotel_photo_url?: string
  accommodation_id?: number // Added for gym feature
  additional_features_gym?: boolean // Added for gym feature
  additional_features_cafe?: boolean // Added for cafe/restaurant feature
  additional_features_restaurant?: boolean // Keeping for backward compatibility
  additional_features_shopping?: boolean // Added for shopping feature
  additional_features_food_savoury?: boolean // Updated for savoury food feature
  additional_features_food_sweet?: boolean // Updated for sweet food feature
  // Car hire specific fields
  cars?: CarDetail[]
  // Flight specific fields
  leave_location?: string
  arrive_location?: string
  airline?: string
  passengers?: string[] // Added for flight passengers
  // Common fields
  notes?: string
}

export type FlightCard = {}
export type AccommodationCard = {}
export type TransferActivityCard = {}
