"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Plane,
  Hotel,
  Car,
  MapPin,
  Users,
  CalendarDays,
  Building2,
  Tag,
  Info,
  Train,
  Bus,
  ShipIcon as Ferry,
  FootprintsIcon as Walk,
  CarTaxiFrontIcon as Taxi,
  Clock,
} from "lucide-react"
import { format, differenceInDays, min, max } from "date-fns" // Import date-fns functions
import { cn } from "@/lib/utils"
import Image from "next/image"
import type { ItineraryEvent, RoomDetail, ParticipantProfile } from "@/types/itinerary"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState } from "react" // Import useState and useEffect

interface ParticipantBadgeProps {
  name: string // This is the key used to look up the profile (e.g., "LJ")
  event?: ItineraryEvent
  roomType?: string
  allParticipantProfiles: Map<string, ParticipantProfile>
  allEvents?: ItineraryEvent[] // New prop for all events
  size?: "small" | "large" // New size prop
}

// Function to generate a consistent color based on the name
const getColorFromName = (name: string) => {
  const colors = [
    "bg-red-100 text-red-600",
    "bg-blue-100 text-blue-600",
    "bg-green-100 text-green-600",
    "bg-yellow-100 text-yellow-600",
    "bg-purple-100 text-purple-600",
    "bg-pink-100 text-pink-600",
    "bg-indigo-100 text-indigo-600",
    "bg-teal-100 text-teal-600",
    "bg-orange-100 text-orange-600",
    "bg-lime-100 text-lime-600",
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash % colors.length)
  return colors[index]
}

export function ParticipantBadge({
  name,
  event,
  roomType,
  allParticipantProfiles,
  allEvents,
  size = "small", // Default to small for event cards
}: ParticipantBadgeProps) {
  const participantProfile = allParticipantProfiles.get(name)
  const displayInitials = participantProfile?.initials || name.toUpperCase().substring(0, 2)
  const photoUrl = participantProfile?.photoUrl

  const colorClass = getColorFromName(name)

  const [tripDuration, setTripDuration] = useState<string | null>(null)
  const [isCalculatingTrip, setIsCalculatingTrip] = useState(false)

  // Define size classes
  const badgeSizeClasses = {
    small: "h-12 w-12 text-base", // Changed to h-12 w-12 for event cards
    large: "h-24 w-24 text-2xl", // Larger for participant grid
  }

  // Corrected: Check if it's a transfer event and has transport tickets
  const isTicketedTransfer =
    event?.event_type === "transfer" && event.transport_tickets && event.transport_tickets.length > 0

  // Robust comparison for finding the ticket
  const ticket = isTicketedTransfer
    ? event?.transport_tickets?.find((t) => t.passenger_name?.toLowerCase().trim() === name.toLowerCase().trim())
    : undefined

  const ticketNumber = ticket?.ticket_number
  const ticketBookingReference = ticket?.booking_reference // Get booking reference

  // If roomType is not explicitly passed, try to derive it from the event
  let effectiveRoomType = roomType
  if (!effectiveRoomType && event?.event_type === "accommodation" && event.rooms) {
    const foundRoom = event.rooms.find((room) => room.participants.includes(name))
    effectiveRoomType = foundRoom?.room_type || undefined
  }

  // Find car details if applicable for car hire
  let carDetailToDisplay: { type: "driver" | "passenger"; car: ItineraryEvent["cars"][0] } | null = null
  if (event?.event_type === "car_hire" && event.cars) {
    for (const car of event.cars) {
      if (car.driver === name) {
        carDetailToDisplay = { type: "driver", car }
        break // Prioritize driver info
      } else if (car.passengers.includes(name)) {
        carDetailToDisplay = { type: "passenger", car }
        // Don't break yet, a later car might have them as a driver
      }
    }
  }

  // Function to calculate trip duration
  const calculateTripDuration = () => {
    if (!allEvents || allEvents.length === 0) {
      setTripDuration("N/A (No events)")
      return
    }

    setIsCalculatingTrip(true)
    const participantEvents = allEvents.filter((e) => e.participants.includes(name))

    if (participantEvents.length === 0) {
      setTripDuration("N/A (No events found for this participant)")
      setIsCalculatingTrip(false)
      return
    }

    const allRelevantDates: Date[] = []
    participantEvents.forEach((e) => {
      if (e.start_date) allRelevantDates.push(e.start_date)
      if (e.end_date) allRelevantDates.push(e.end_date)
      if (e.leave_time_local) allRelevantDates.push(e.leave_time_local)
      if (e.arrive_time_local) allRelevantDates.push(e.arrive_time_local)
    })

    if (allRelevantDates.length === 0) {
      setTripDuration("N/A (No valid dates in events)")
      setIsCalculatingTrip(false)
      return
    }

    const earliestDate = min(allRelevantDates)
    const latestDate = max(allRelevantDates)

    if (earliestDate && latestDate) {
      const days = differenceInDays(latestDate, earliestDate)
      setTripDuration(`${days + 1} day${days === 0 ? "" : "s"}`) // +1 to include start day
    } else {
      setTripDuration("N/A (Date calculation error)")
    }
    setIsCalculatingTrip(false)
  }

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) {
          calculateTripDuration()
        } else {
          setTripDuration(null) // Clear duration when popover closes
        }
      }}
    >
      <PopoverTrigger asChild>
        <Avatar
          className={cn(
            "border-2 border-current font-bold cursor-pointer hover:scale-105 transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue",
            badgeSizeClasses[size], // Apply size classes here
            colorClass,
          )}
        >
          {photoUrl ? (
            <AvatarImage
              src={photoUrl || "/placeholder.svg"}
              alt={participantProfile?.name || name}
              layout="fill"
              objectFit="cover"
            />
          ) : (
            <AvatarFallback>{displayInitials}</AvatarFallback>
          )}
        </Avatar>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-4 rounded-lg shadow-lg bg-white">
        {" "}
        {/* Popover container width remains w-56 */}
        <div className="flex flex-col items-center text-center">
          {photoUrl && (
            <div className="relative w-48 h-48 rounded-full overflow-hidden mb-2">
              {" "}
              {/* Adjusted popover image size to w-48 h-48 */}
              <Image
                src={photoUrl || "/placeholder.svg"}
                alt={participantProfile?.name || name}
                layout="fill"
                objectFit="cover"
                crossOrigin="anonymous"
              />
            </div>
          )}
          <p className="text-lg font-bold text-accent-pink mb-1">{participantProfile?.name || name}</p>{" "}
          {/* Changed text color to accent-pink */}
          {isCalculatingTrip ? (
            <p className="text-sm text-muted-foreground mt-2">Calculating trip...</p>
          ) : (
            tripDuration && (
              <div className="flex items-center gap-2 text-sm text-gray-700 mt-2">
                <Clock className="h-4 w-4 text-dark-teal" />
                <span>Trip Duration: {tripDuration}</span>
              </div>
            )
          )}
          {/* Use isTicketedTransfer here */}
          {isTicketedTransfer && (ticketNumber || ticketBookingReference) && (
            <div className="flex flex-col items-center gap-1 text-sm text-gray-700 mt-2">
              {ticketNumber && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-dark-teal" />
                  <span>Ticket: {ticketNumber}</span>
                </div>
              )}
              {ticketBookingReference && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-dark-teal" />
                  <span>Booking: {ticketBookingReference}</span>
                </div>
              )}
            </div>
          )}
          {effectiveRoomType && (
            <div className="flex items-center gap-2 text-sm text-gray-700 mt-2">
              <Hotel className="h-4 w-4 text-dark-teal" />
              <span>Room: {effectiveRoomType}</span>
            </div>
          )}
          {carDetailToDisplay && (
            <div className="flex flex-col items-center gap-1 text-sm text-gray-700 mt-2">
              <div className="flex items-center gap-2">
                {carDetailToDisplay.type === "driver" ? (
                  <Car className="h-4 w-4 text-dark-teal" />
                ) : (
                  <Users className="h-4 w-4 text-dark-teal" />
                )}
                <span>
                  {carDetailToDisplay.type === "driver"
                    ? `Driver of: ${carDetailToDisplay.car.car_name || "Car"}`
                    : `Passenger in: ${carDetailToDisplay.car.car_name || "Car"}`}
                </span>
              </div>
              {carDetailToDisplay.car.booking_reference && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-dark-teal" />
                  <span>Booking: {carDetailToDisplay.car.booking_reference}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface EventCardProps {
  event: ItineraryEvent
  allParticipantProfiles: Map<string, ParticipantProfile>
}

export function getEventImageQuery(event: ItineraryEvent): string {
  console.log(`getEventImageQuery called for event type: ${event.event_type}, description: ${event.description}`)
  if (event.event_type === "activity" && event.activity_photo_url) {
    console.log(`getEventImageQuery for activity returning: ${event.activity_photo_url}`)
    return event.activity_photo_url
  }
  if (event.event_type === "flight" && event.transfer_photo_url) return event.transfer_photo_url
  if (event.event_type === "accommodation" && event.hotel_photo_url) return event.hotel_photo_url
  if (event.event_type === "transfer" && event.transfer_photo_url) return event.transfer_photo_url
  if (event.event_type === "car_hire" && event.cars && event.cars.length > 0 && event.cars[0].car_photo_url)
    return event.cars[0].car_photo_url
  if (event.event_type === "activity" && event.activity_photo_url) return event.activity_photo_url

  switch (event.event_type) {
    case "flight":
      return "airplane taking off at sunset"
    case "accommodation":
      return "luxury hotel room with city view"
    case "transfer":
      return "taxi driving through a European city"
    case "car_hire":
      return "rental car on a scenic road"
    case "activity":
      return event.description || "tourist attraction in Europe"
    default:
      return "travel scene"
  }
}

export function FlightCard({ event, allParticipantProfiles }: EventCardProps) {
  return (
    <Card className="w-full rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 animate-fade-in">
      <div className="relative w-full h-auto aspect-w-16 aspect-h-9">
        <Image
          src={getEventImageQuery(event) || "/placeholder.svg"}
          alt={event.description || "Flight"}
          layout="fill"
          objectFit="cover"
          className="rounded-t-xl"
          crossOrigin="anonymous"
        />
      </div>
      <CardHeader className="bg-dark-teal text-white p-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Plane className="h-6 w-6" />
          <h3 className="text-xl font-bold">{event.description || "Flight"}</h3>
        </div>
        {/* Removed duplicate flight name */}
      </CardHeader>
      <CardContent className="p-4 grid gap-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-lg">
            {" "}
            <MapPin className="h-5 w-5 text-accent-pink" />
            <span className="font-semibold">From:</span> {event.leave_location || "N/A"}
          </div>
          <div className="flex items-center gap-2 text-lg">
            {" "}
            <MapPin className="h-5 w-5 text-accent-pink" />
            <span className="font-semibold">To:</span> {event.arrive_location || "N/A"}
          </div>
        </div>
        {/* Removed time display from here */}
      </CardContent>
      {event.passengers && event.passengers.length > 0 && (
        <CardFooter className="bg-gray-50 py-8 px-4 flex flex-wrap items-center gap-2 border-t">
          <Users className="h-4 w-4 text-dark-teal" /> {/* Kept h-4 w-4 for icon */}
          <span className="font-semibold text-sm">Passengers:</span>
          <div className="flex flex-wrap gap-1">
            {event.passengers.map((p) => (
              <ParticipantBadge
                key={p}
                name={p}
                event={event}
                allParticipantProfiles={allParticipantProfiles}
                size="small" // Set size to small for event cards
              />
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

export function AccommodationCard({ event, allParticipantProfiles }: EventCardProps) {
  const hasMultipleRooms = event.rooms && event.rooms.length > 1
  const hasSingleRoom = event.rooms && event.rooms.length === 1
  const defaultTabValue = hasMultipleRooms ? `room-${event.rooms![0].id}` : "single-room"

  const singleRoom = hasSingleRoom ? event.rooms![0] : null

  return (
    <Card className="w-full rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 animate-fade-in">
      <div className="relative w-full h-auto aspect-w-16 aspect-h-9">
        <Image
          src={getEventImageQuery(event) || "/placeholder.svg"}
          alt={event.description || "Accommodation"}
          layout="fill"
          objectFit="cover"
          className="rounded-t-xl"
          crossOrigin="anonymous"
        />
      </div>
      <CardHeader className="bg-primary-blue text-white p-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Hotel className="h-6 w-6" />
          <h3 className="text-xl font-bold">{event.description || "Accommodation"}</h3>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Info className="h-5 w-5" />
              <span className="sr-only">More Info</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-lg bg-white p-6 shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-primary-blue">Booking Details</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Information for your accommodation booking.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-dark-teal" />
                <span className="font-semibold">Booking Reference:</span> {event.booking_reference || "N/A"}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-dark-teal" />
                <span className="font-semibold">Location:</span> {event.location || "N/A"}
              </div>
              {event.notes && (
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-dark-teal flex-shrink-0 mt-0.5" />
                  <span className="font-semibold">Notes:</span> <p className="text-sm">{event.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-4 grid gap-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-dark-teal" />
          <span className="font-semibold">Location:</span> {event.location || "N/A"}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4 text-accent-pink" />
          <span className="font-semibold text-accent-pink">Dates:</span>{" "}
          {event.start_date && event.end_date
            ? `${format(event.start_date, "MMM dd")} - ${format(event.end_date, "MMM dd, yyyy")}`
            : "N/A"}
        </div>
        {/* Removed time display from here */}
        {hasMultipleRooms ? (
          <Tabs defaultValue={defaultTabValue} className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 h-auto p-1 bg-light-blue rounded-xl gap-1">
              {event.rooms!.map((room) => (
                <TabsTrigger
                  key={room.id}
                  value={`room-${room.id}`}
                  className="rounded-full data-[state=active]:bg-primary-blue data-[state=active]:text-white text-dark-teal font-semibold text-sm py-1 transition-all duration-300 hover:bg-medium-blue hover:text-white"
                >
                  {room.room_type || `Room ${room.id}`}
                </TabsTrigger>
              ))}
            </TabsList>
            {event.rooms!.map((room) => (
              <TabsContent key={room.id} value={`room-${room.id}`} className="mt-4">
                <RoomDetailDisplay room={room} allParticipantProfiles={allParticipantProfiles} />
              </TabsContent>
            ))}
          </Tabs>
        ) : singleRoom ? (
          <div className="mt-2">
            <Button
              variant="outline"
              className="rounded-full px-4 py-2 text-base bg-dark-teal text-white hover:bg-dark-teal/90"
            >
              {singleRoom.room_type || "Room Details"}
            </Button>
            <RoomDetailDisplay room={singleRoom} allParticipantProfiles={allParticipantProfiles} />
          </div>
        ) : (
          <div className="mt-2 text-muted-foreground text-sm">
            <p>No specific room details available.</p>
            {event.notes && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground border-t pt-3 mt-3">
                <Info className="h-4 w-4 text-dark-teal flex-shrink-0 mt-0.5" />
                <p>{event.notes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      {/* Removed the CardFooter for "All Participants" */}
    </Card>
  )
}

interface RoomDetailDisplayProps {
  room: RoomDetail
  allParticipantProfiles: Map<string, ParticipantProfile>
}

function RoomDetailDisplay({ room, allParticipantProfiles }: RoomDetailDisplayProps) {
  return (
    <div className="grid gap-2">
      {room.booking_reference && (
        <div className="flex items-center gap-2 text-sm mt-2">
          <Tag className="h-4 w-4 text-dark-teal" />
          <span className="font-semibold">Booking Reference:</span> {room.booking_reference}
        </div>
      )}
      {room.notes && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2">
          <Info className="h-4 w-4 text-dark-teal flex-shrink-0 mt-0.5" />
          <p>{room.notes}</p>
        </div>
      )}
      {room.participants && room.participants.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Users className="h-4 w-4 text-dark-teal" /> {/* Kept h-4 w-4 for icon */}
          <span className="font-semibold text-sm">Room Participants:</span>
          <div className="flex flex-wrap gap-1">
            {room.participants.map((p) => (
              <ParticipantBadge
                key={p}
                name={p}
                roomType={room.room_type || undefined}
                allParticipantProfiles={allParticipantProfiles}
                size="small" // Set size to small for event cards
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const getTransferIcon = (transportMethod: string | null) => {
  const lowerMethod = transportMethod?.toLowerCase()
  switch (lowerMethod) {
    case "taxi":
    case "shuttle":
    case "private car":
      return Taxi
    case "train":
      return Train
    case "bus":
      return Bus
    case "ferry":
      return Ferry
    case "walk":
      return Walk
    default:
      return Car
  }
}

export function TransferActivityCard({ event, allParticipantProfiles }: EventCardProps) {
  let CardIcon: React.ElementType
  let headerBg: string
  let headerText: string
  let iconColor: string

  if (event.event_type === "transfer") {
    CardIcon = getTransferIcon(event.company)
    headerBg = "bg-soft-yellow"
    headerText = "text-dark-teal"
    iconColor = "text-dark-teal"
  } else {
    CardIcon = Building2
    headerBg = "bg-medium-blue"
    headerText = "text-accent-pink"
    iconColor = "text-accent-pink"
  }

  // Determine icon size based on description length
  const iconSizeClass = (event.description?.length || 0) > 20 ? "h-8 w-8" : "h-6 w-6"

  return (
    <Card className="w-full rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 animate-fade-in">
      <div className="relative w-full h-auto aspect-w-16 aspect-h-9">
        <Image
          src={getEventImageQuery(event) || "/placeholder.svg"}
          alt={event.description || (event.event_type === "transfer" ? "Transfer" : "Activity")}
          layout="fill"
          objectFit="cover"
          className="rounded-t-xl"
          crossOrigin="anonymous"
        />
      </div>
      <CardHeader className={cn("p-4 flex flex-row items-center justify-between", headerBg, headerText)}>
        <div className="flex items-center gap-3">
          <CardIcon className={cn(iconSizeClass)} /> {/* Apply dynamic size here */}
          <h3 className="text-xl font-bold">
            {event.description || (event.event_type === "transfer" ? "Transfer" : "Activity")}
          </h3>
        </div>
        {/* Removed event.company display from here */}
      </CardHeader>
      <CardContent className="p-4 grid gap-3">
        {/* Display "From" location */}
        {event.leave_location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className={cn("h-4 w-4", iconColor)} />
            <span className="font-semibold">From:</span> {event.leave_location}
          </div>
        )}
        {/* Display "To" location */}
        {event.arrive_location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className={cn("h-4 w-4", iconColor)} />
            <span className="font-semibold">To:</span> {event.arrive_location}
          </div>
        )}
        {/* Display additional transfer info if available */}
        {event.additional_transfer_info && event.event_type === "transfer" && (
          <div className="flex items-center gap-2 text-sm">
            <Info className={cn("h-4 w-4", iconColor)} />
            <span className="font-semibold">Operator:</span> {event.additional_transfer_info}
          </div>
        )}
        {/* Fallback if neither From nor To are available, but a general location exists */}
        {!event.leave_location && !event.arrive_location && event.location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className={cn("h-4 w-4", iconColor)} />
            <span className="font-semibold">Location:</span> {event.location}
          </div>
        )}
        {/* Fallback if no location information is available */}
        {!event.leave_location && !event.arrive_location && !event.location && !event.additional_transfer_info && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className={cn("h-4 w-4", iconColor)} />
            <span className="font-semibold">Location:</span> N/A
          </div>
        )}
        {event.notes && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground border-t pt-3 mt-3">
            <Tag className={cn("h-4 w-4 flex-shrink-0 mt-0.5", iconColor)} />
            <p>{event.notes}</p>
          </div>
        )}
      </CardContent>
      {event.participants && event.participants.length > 0 && (
        <CardFooter className="bg-gray-50 py-8 px-4 flex flex-wrap items-center gap-2 border-t">
          <Users className={cn("h-4 w-4", iconColor)} /> {/* Kept h-4 w-4 for icon */}
          <span className="font-semibold text-sm">Participants:</span>
          <div className="flex flex-wrap gap-1">
            {event.participants.map((p) => (
              <ParticipantBadge
                key={p}
                name={p}
                event={event}
                allParticipantProfiles={allParticipantProfiles}
                size="small" // Set size to small for event cards
              />
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

export type { ItineraryEvent, ParticipantProfile }
