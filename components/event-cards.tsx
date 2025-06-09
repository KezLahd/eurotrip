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
  Dumbbell,
  Utensils,
  Coffee,
  ShoppingBag,
} from "lucide-react"
import { format, differenceInDays, min, max } from "date-fns" // Import date-fns functions
import { cn } from "@/lib/utils"
import Image from "next/image"
import type { ItineraryEvent, RoomDetail, ParticipantProfile, TransportTicketDetail, CarDetail } from "@/types/itinerary"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState, useEffect } from "react" // Import useState and useEffect
import { EditActivityForm } from "@/components/edit-activity-form"
import { createBrowserClient } from "@/lib/supabase-client"
import { FootprintsIcon } from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { useSwipeable, SwipeableHandlers } from "react-swipeable"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ParticipantBadgeProps {
  name: string // This is the key used to look up the profile (e.g., "LJ")
  event?: ItineraryEvent
  roomType?: string
  allParticipantProfiles: Map<string, ParticipantProfile>
  allEvents?: ItineraryEvent[] // New prop for all events
  size?: "small" | "large" // New size prop
  showTripDuration?: boolean // New prop to control trip duration display
  className?: string // Allow custom className for margin/padding
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
  showTripDuration = false, // Default to false
  className = "", // Default empty
}: ParticipantBadgeProps) {
  const participantProfile = allParticipantProfiles.get(name)
  const displayInitials = participantProfile?.initials || name.toUpperCase().substring(0, 2)
  const photoUrl = participantProfile?.photoUrl

  const colorClass = getColorFromName(name)

  const [tripDuration, setTripDuration] = useState<string | null>(null)
  const [isCalculatingTrip, setIsCalculatingTrip] = useState(false)

  // Define size classes
  const badgeSizeClasses = {
    small: "h-10 w-10 text-base p-0.5", // Reduced size and padding for header
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
  let carDetailToDisplay: { type: "driver" | "passenger"; car: { driver: string; passengers: string[]; car_name?: string; booking_reference?: string } } | null = null
  if (event?.event_type === "car_hire" && event.cars && event.cars.length > 0) {
    for (const car of event.cars) {
      if (car.driver && car.driver === name) {
        carDetailToDisplay = { 
          type: "driver", 
          car: {
            driver: car.driver,
            passengers: car.passengers || [],
            car_name: car.car_name || undefined,
            booking_reference: car.booking_reference || undefined
          }
        }
        break // Prioritize driver info
      } else if (car.passengers?.includes(name)) {
        carDetailToDisplay = { 
          type: "passenger", 
          car: {
            driver: car.driver || "",
            passengers: car.passengers || [],
            car_name: car.car_name || undefined,
            booking_reference: car.booking_reference || undefined
          }
        }
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
    const participantEvents = allEvents.filter((e) => e.participants?.includes(name) ?? false)

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
            className // Allow custom className
          )}
        >
          {photoUrl ? (
            <AvatarImage
              src={photoUrl || "/placeholder.svg"}
              alt={participantProfile?.name || name}
              className="object-cover object-center w-full h-full"
              width={size === "small" ? 48 : 96}
              height={size === "small" ? 48 : 96}
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
                className="object-cover object-center w-full h-full"
                width={192}
                height={192}
                crossOrigin="anonymous"
              />
            </div>
          )}
          <p className="text-lg font-bold text-accent-pink mb-1">{participantProfile?.name || name}</p>{" "}
          {/* Changed text color to accent-pink */}
          {showTripDuration && (
            <>
              {isCalculatingTrip ? (
                <p className="text-sm text-muted-foreground mt-2">Calculating trip...</p>
              ) : (
                tripDuration && (
                  <div className="flex items-center gap-2 text-sm text-gray-700 mt-2">
                    <span>Holiday Length: {tripDuration}</span>
                  </div>
                )
              )}
            </>
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
          {event?.event_type === "car_hire" && carDetailToDisplay && (
            <div className="flex flex-col items-center gap-1 text-sm text-gray-700 mt-2">
              <div className="flex items-center gap-2">
                {carDetailToDisplay.type === "driver" ? (
                  <Car className="h-4 w-4 text-dark-teal" />
                ) : (
                  <Users className="h-4 w-4 text-dark-teal" />
                )}
                <span>
                  {carDetailToDisplay.type === "driver"
                    ? `Driver: ${carDetailToDisplay.car.car_name || "Car 1"}`
                    : `Passenger: ${carDetailToDisplay.car.car_name || "Car 1"}`}
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
          {effectiveRoomType && (
            <div className="flex items-center gap-2 text-sm text-gray-700 mt-2">
              <Hotel className="h-4 w-4 text-dark-teal" />
              <span>Room: {effectiveRoomType}</span>
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
            {event.passengers.map((p, idx) => (
              <ParticipantBadge
                key={`${p}-${idx}`}
                name={p}
                event={event}
                allParticipantProfiles={allParticipantProfiles}
                size="small"
                showTripDuration={false}
              />
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

// Add new type for gym data
type GymData = {
  id: number;
  accommodation_id: number;
  gym_name: string;
  gym_location: string;
  gym_distance: string;
  gym_rating: string;
  gym_photo_url: string;
  gym_times: string;
  gym_cost: string;
}

// Add new type for restaurant data
type RestaurantData = {
  id: number;
  accommodation_id: number;
  restaurant_name: string;
  restaurant_location: string | null;
  restaurant_distance: string | null;
  restaurant_photo_url: string | null;
  restaurant_menu_url: string | null;
}

// Add new type for cafe data
type CafeData = {
  id: number;
  accommodation_id: number;
  cafe_name: string;
  cafe_location: string | null;
  cafe_distance: string | null;
  cafe_photo_url: string | null;
  cafe_menu_url: string | null;
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

export function AccommodationCard({ event, allParticipantProfiles }: EventCardProps) {
  console.log('AccommodationCard event:', event); // Debug log for cafe icon issue
  const hasMultipleRooms = event.rooms && event.rooms.length > 1
  const hasSingleRoom = event.rooms && event.rooms.length === 1
  const [selectedRoomId, setSelectedRoomId] = useState(
    hasMultipleRooms ? event.rooms![0].id.toString() : hasSingleRoom ? event.rooms![0].id.toString() : ""
  )

  // Use prop directly for gym and restaurant
  const hasGym = !!event.additional_features_gym
  const hasRestaurant = !!event.additional_features_restaurant
  const hasCafe = !!event.additional_features_cafe
  const hasShopping = !!event.additional_features_shopping
  const hasSavoury = !!event.additional_features_food_savoury
  const hasSweet = !!event.additional_features_food_sweet
  const [gymData, setGymData] = useState<GymData[]>([])
  const [restaurantData, setRestaurantData] = useState<RestaurantData[]>([])
  const [cafeData, setCafeData] = useState<CafeData[]>([])
  const [shoppingData, setShoppingData] = useState<ShoppingData[]>([])
  const [savouryData, setSavouryData] = useState<SavouryFoodData[]>([])
  const [sweetData, setSweetData] = useState<SweetFoodData[]>([])
  const [showGymDialog, setShowGymDialog] = useState(false)
  const [showRestaurantDialog, setShowRestaurantDialog] = useState(false)
  const [showCafeDialog, setShowCafeDialog] = useState(false)
  const [showShoppingDialog, setShowShoppingDialog] = useState(false)
  const supabase = createBrowserClient()
  const [currentGymSlideIndex, setCurrentGymSlideIndex] = useState(0)
  const [currentRestaurantSlideIndex, setCurrentRestaurantSlideIndex] = useState(0)
  const [currentCafeSlideIndex, setCurrentCafeSlideIndex] = useState(0)
  const [currentShoppingSlideIndex, setCurrentShoppingSlideIndex] = useState(0)
  const [currentSavourySlideIndex, setCurrentSavourySlideIndex] = useState(0)
  const [currentSweetSlideIndex, setCurrentSweetSlideIndex] = useState(0)
  const [selectedFoodType, setSelectedFoodType] = useState<'restaurant' | 'savoury' | 'sweet'>('restaurant')

  const gymSwipeHandlers = useSwipeable({
    onSwipedLeft: () => setCurrentGymSlideIndex((prev) => (prev + 1) % (gymData.length || 1)),
    onSwipedRight: () => setCurrentGymSlideIndex((prev) => (prev - 1 + (gymData.length || 1)) % (gymData.length || 1)),
    preventScrollOnSwipe: true,
    trackMouse: true,
  })

  const restaurantSwipeHandlers = useSwipeable({
    onSwipedLeft: () => setCurrentRestaurantSlideIndex((prev) => (prev + 1) % (restaurantData.length || 1)),
    onSwipedRight: () => setCurrentRestaurantSlideIndex((prev) => (prev - 1 + (restaurantData.length || 1)) % (restaurantData.length || 1)),
    preventScrollOnSwipe: true,
    trackMouse: true,
  })

  const cafeSwipeHandlers = useSwipeable({
    onSwipedLeft: () => setCurrentCafeSlideIndex((prev) => (prev + 1) % (cafeData.length || 1)),
    onSwipedRight: () => setCurrentCafeSlideIndex((prev) => (prev - 1 + (cafeData.length || 1)) % (cafeData.length || 1)),
    preventScrollOnSwipe: true,
    trackMouse: true,
  })

  const shoppingSwipeHandlers = useSwipeable({
    onSwipedLeft: () => setCurrentShoppingSlideIndex((prev) => (prev + 1) % (shoppingData.length || 1)),
    onSwipedRight: () => setCurrentShoppingSlideIndex((prev) => (prev - 1 + (shoppingData.length || 1)) % (shoppingData.length || 1)),
    preventScrollOnSwipe: true,
    trackMouse: true,
  })

  const savourySwipeHandlers = useSwipeable({
    onSwipedLeft: () => setCurrentSavourySlideIndex((prev) => (prev + 1) % (savouryData.length || 1)),
    onSwipedRight: () => setCurrentSavourySlideIndex((prev) => (prev - 1 + (savouryData.length || 1)) % (savouryData.length || 1)),
    preventScrollOnSwipe: true,
    trackMouse: true,
  })

  const sweetSwipeHandlers = useSwipeable({
    onSwipedLeft: () => setCurrentSweetSlideIndex((prev) => (prev + 1) % (sweetData.length || 1)),
    onSwipedRight: () => setCurrentSweetSlideIndex((prev) => (prev - 1 + (sweetData.length || 1)) % (sweetData.length || 1)),
    preventScrollOnSwipe: true,
    trackMouse: true,
  })

  // Fetch gym, restaurant, cafe, and shopping data
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (hasGym && event.accommodation_id) {
          const { data: gymData, error: gymError } = await supabase
            .from("accommodation_gym")
            .select("*")
            .eq("accommodation_id", event.accommodation_id)
          if (gymError) {
            console.error("Error fetching gym data:", gymError)
          } else {
            setGymData(gymData || [])
          }
        }
        if (hasRestaurant && event.accommodation_id) {
          const { data: restaurantData, error: restaurantError } = await supabase
            .from("accommodation_restaurants")
            .select("*")
            .eq("accommodation_id", event.accommodation_id)
          if (restaurantError) {
            console.error("Error fetching restaurant data:", restaurantError)
          } else {
            setRestaurantData(restaurantData || [])
          }
        }
        if (hasCafe && event.accommodation_id) {
          const { data: cafeData, error: cafeError } = await supabase
            .from("accommodation_cafe")
            .select("*")
            .eq("accommodation_id", event.accommodation_id)
          if (cafeError) {
            console.error("Error fetching cafe data:", cafeError)
          } else {
            setCafeData(cafeData || [])
          }
        }
        if (hasShopping && event.accommodation_id) {
          const { data: shoppingData, error: shoppingError } = await supabase
            .from("accommodation_shopping")
            .select("*")
            .eq("accommodation_id", event.accommodation_id)
          if (shoppingError) {
            console.error("Error fetching shopping data:", shoppingError)
          } else {
            setShoppingData(shoppingData || [])
          }
        }
        if (hasSavoury && event.accommodation_id) {
          const { data: savouryData, error: savouryError } = await supabase
            .from("accommodation_food_savoury")
            .select("*")
            .eq("accommodation_id", event.accommodation_id)
          if (savouryError) {
            console.error("Error fetching savoury food data:", savouryError)
          } else {
            setSavouryData(savouryData || [])
          }
        }
        if (hasSweet && event.accommodation_id) {
          const { data: sweetData, error: sweetError } = await supabase
            .from("accommodation_food_sweet")
            .select("*")
            .eq("accommodation_id", event.accommodation_id)
          if (sweetError) {
            console.error("Error fetching sweet food data:", sweetError)
          } else {
            setSweetData(sweetData || [])
          }
        }
      } catch (error) {
        console.error("Error in fetchData:", error)
      }
    }
    fetchData()
  }, [hasGym, hasRestaurant, hasCafe, hasShopping, hasSavoury, hasSweet, event.accommodation_id, supabase])

  // Show the fork and knife icon if any food feature is true
  const hasAnyFood = !!event.additional_features_restaurant || !!event.additional_features_food_savoury || !!event.additional_features_food_sweet

  return (
    <Card className="w-full rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 animate-fade-in">
      <div className="relative w-full h-auto aspect-w-16 aspect-h-9">
        <Image
          src={getEventImageQuery(event) || "/placeholder.svg"}
          alt={event.description || "Accommodation"}
          layout="fill"
          className="rounded-t-xl object-cover"
          crossOrigin="anonymous"
        />
        {/* Floating Info Button */}
        <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 10 }}>
          <Dialog>
            <DialogTrigger asChild>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white/30 hover:bg-white/50 transition-colors shadow-lg"
                aria-label="More Info"
              >
                <Info className="h-5 w-5" style={{ color: '#38a3f5' }} />
              </button>
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
        </div>
      </div>
      <CardHeader className="bg-primary-blue text-white p-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Hotel className="h-6 w-6" />
          <h3 className="text-xl font-bold">{event.description || "Accommodation"}</h3>
        </div>
        <div className="flex gap-1">
          {hasAnyFood && (
            <Dialog open={showRestaurantDialog} onOpenChange={(open) => {
              setShowRestaurantDialog(open);
              if (!open) {
                setCurrentRestaurantSlideIndex(0);
                setCurrentSavourySlideIndex(0);
                setCurrentSweetSlideIndex(0);
                // Default to first available food type
                if (event.additional_features_restaurant) setSelectedFoodType('restaurant');
                else if (event.additional_features_food_savoury) setSelectedFoodType('savoury');
                else if (event.additional_features_food_sweet) setSelectedFoodType('sweet');
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Utensils className="h-7 w-7" />
                  <span className="sr-only">Food Details</span>
                </Button>
              </DialogTrigger>
              <DialogContent hideDefaultClose className="max-w-[425px] w-full mx-auto p-0 rounded-lg bg-white shadow-lg overflow-hidden">
                <VisuallyHidden asChild>
                  <DialogTitle>Food Options</DialogTitle>
                </VisuallyHidden>
                <DialogClose asChild>
                  <button
                    className="absolute right-4 top-4 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                    aria-label="Close dialog"
                    type="button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-pink-500"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </DialogClose>
                <div className="relative">
                  <div className="absolute top-0 left-0 right-0 z-10 flex justify-center px-4 pt-4">
                    <div className="w-1/2 bg-white/40 backdrop-blur-sm rounded-lg">
                      <Select
                        value={selectedFoodType}
                        onValueChange={(value: 'restaurant' | 'savoury' | 'sweet') => {
                          setSelectedFoodType(value);
                          if (value === 'restaurant') setCurrentRestaurantSlideIndex(0);
                          if (value === 'savoury') setCurrentSavourySlideIndex(0);
                          if (value === 'sweet') setCurrentSweetSlideIndex(0);
                        }}
                      >
                        <SelectTrigger className="w-full border-none bg-transparent text-accent-pink font-semibold">
                          <SelectValue placeholder="Select food type" />
                        </SelectTrigger>
                        <SelectContent>
                          {event.additional_features_restaurant && <SelectItem value="restaurant" className="text-accent-pink">Restaurants</SelectItem>}
                          {event.additional_features_food_savoury && <SelectItem value="savoury" className="text-accent-pink">Hyped Foods (Savoury)</SelectItem>}
                          {event.additional_features_food_sweet && <SelectItem value="sweet" className="text-accent-pink">Hyped Foods (Sweet)</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {selectedFoodType === 'restaurant' && hasRestaurant && (
                    <div {...restaurantSwipeHandlers} className="w-full relative">
                      <div className="relative w-full h-[220px] bg-gray-100">
                        {restaurantData[currentRestaurantSlideIndex]?.restaurant_photo_url ? (
                          <Image
                            src={restaurantData[currentRestaurantSlideIndex].restaurant_photo_url}
                            alt={restaurantData[currentRestaurantSlideIndex].restaurant_name || "Restaurant photo"}
                            fill
                            className="object-cover rounded-t-lg"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <Image
                            src="/placeholder.svg"
                            alt="No restaurant image available"
                            fill
                            className="object-contain object-center opacity-60 rounded-t-lg"
                          />
                        )}
                        {restaurantData.length > 1 && (
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                            {restaurantData.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentRestaurantSlideIndex(index)}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                  index === currentRestaurantSlideIndex ? 'bg-white' : 'bg-white/50'
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="px-4 py-3 space-y-2">
                        <h3 className="text-xl font-bold text-primary-blue">{restaurantData[currentRestaurantSlideIndex]?.restaurant_name}</h3>
                        {restaurantData[currentRestaurantSlideIndex]?.restaurant_location && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-accent-pink" />
                            <span>{restaurantData[currentRestaurantSlideIndex].restaurant_location}</span>
                          </div>
                        )}
                        {restaurantData[currentRestaurantSlideIndex]?.restaurant_distance && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold">Distance:</span>
                            <span>{restaurantData[currentRestaurantSlideIndex].restaurant_distance}</span>
                          </div>
                        )}
                        {restaurantData[currentRestaurantSlideIndex]?.restaurant_menu_url && (
                          <div className="flex items-center gap-2 text-sm">
                            <a
                              href={restaurantData[currentRestaurantSlideIndex].restaurant_menu_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent-pink hover:underline"
                            >
                              View Menu
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedFoodType === 'savoury' && hasSavoury && (
                    <div {...savourySwipeHandlers} className="w-full relative">
                      <div className="relative w-full h-[220px] bg-gray-100">
                        {savouryData[currentSavourySlideIndex]?.food_photo_url ? (
                          <Image
                            src={savouryData[currentSavourySlideIndex].food_photo_url}
                            alt={savouryData[currentSavourySlideIndex].food_name || "Savoury food photo"}
                            fill
                            className="object-cover rounded-t-lg"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <Image
                            src="/placeholder.svg"
                            alt="No food image available"
                            fill
                            className="object-contain object-center opacity-60 rounded-t-lg"
                          />
                        )}
                        {savouryData.length > 1 && (
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                            {savouryData.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentSavourySlideIndex(index)}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                  index === currentSavourySlideIndex ? 'bg-white' : 'bg-white/50'
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="px-4 py-3 space-y-2">
                        <h3 className="text-xl font-bold text-primary-blue">{savouryData[currentSavourySlideIndex]?.food_name}</h3>
                        {savouryData[currentSavourySlideIndex]?.vendor_name && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold">Vendor:</span>
                            <span>{savouryData[currentSavourySlideIndex].vendor_name}</span>
                          </div>
                        )}
                        {savouryData[currentSavourySlideIndex]?.vendor_location && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-accent-pink" />
                            <span>{savouryData[currentSavourySlideIndex].vendor_location}</span>
                          </div>
                        )}
                        {savouryData[currentSavourySlideIndex]?.vendor_distance && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold">Distance:</span>
                            <span>{savouryData[currentSavourySlideIndex].vendor_distance}</span>
                          </div>
                        )}
                        {savouryData[currentSavourySlideIndex]?.menu_url && (
                          <div className="flex items-center gap-2 text-sm">
                            <a
                              href={savouryData[currentSavourySlideIndex].menu_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent-pink hover:underline"
                            >
                              View Menu
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedFoodType === 'sweet' && hasSweet && (
                    <div {...sweetSwipeHandlers} className="w-full relative">
                      <div className="relative w-full h-[220px] bg-gray-100">
                        {sweetData[currentSweetSlideIndex]?.food_photo_url ? (
                          <Image
                            src={sweetData[currentSweetSlideIndex].food_photo_url}
                            alt={sweetData[currentSweetSlideIndex].food_name || "Sweet food photo"}
                            fill
                            className="object-cover rounded-t-lg"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <Image
                            src="/placeholder.svg"
                            alt="No food image available"
                            fill
                            className="object-contain object-center opacity-60 rounded-t-lg"
                          />
                        )}
                        {sweetData.length > 1 && (
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                            {sweetData.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentSweetSlideIndex(index)}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                  index === currentSweetSlideIndex ? 'bg-white' : 'bg-white/50'
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="px-4 py-3 space-y-2">
                        <h3 className="text-xl font-bold text-primary-blue">{sweetData[currentSweetSlideIndex]?.food_name}</h3>
                        {sweetData[currentSweetSlideIndex]?.vendor_name && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold">Vendor:</span>
                            <span>{sweetData[currentSweetSlideIndex].vendor_name}</span>
                          </div>
                        )}
                        {sweetData[currentSweetSlideIndex]?.vendor_location && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-accent-pink" />
                            <span>{sweetData[currentSweetSlideIndex].vendor_location}</span>
                          </div>
                        )}
                        {sweetData[currentSweetSlideIndex]?.vendor_distance && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold">Distance:</span>
                            <span>{sweetData[currentSweetSlideIndex].vendor_distance}</span>
                          </div>
                        )}
                        {sweetData[currentSweetSlideIndex]?.menu_url && (
                          <div className="flex items-center gap-2 text-sm">
                            <a
                              href={sweetData[currentSweetSlideIndex].menu_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent-pink hover:underline"
                            >
                              View Menu
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
          {hasCafe && (
            <Dialog open={showCafeDialog} onOpenChange={(open) => {
              setShowCafeDialog(open);
              if (!open) setCurrentCafeSlideIndex(0);
            }}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Coffee className="h-7 w-7" />
                  <span className="sr-only">Cafe Details</span>
                </Button>
              </DialogTrigger>
              <DialogContent hideDefaultClose className="max-w-[425px] w-full mx-auto p-0 rounded-lg bg-white shadow-lg overflow-hidden">
                <VisuallyHidden asChild>
                  <DialogTitle>Cafe Facilities</DialogTitle>
                </VisuallyHidden>
                <DialogClose asChild>
                  <button
                    className="absolute right-4 top-4 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                    aria-label="Close dialog"
                    type="button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-pink-500"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </DialogClose>
                <div {...cafeSwipeHandlers} className="w-full relative">
                  <div className="relative w-full h-[220px] bg-gray-100">
                    {cafeData[currentCafeSlideIndex]?.cafe_photo_url ? (
                      <Image
                        src={cafeData[currentCafeSlideIndex].cafe_photo_url}
                        alt={cafeData[currentCafeSlideIndex].cafe_name || "Cafe photo"}
                        fill
                        className="object-cover rounded-t-lg"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <Image
                        src="/placeholder.svg"
                        alt="No cafe image available"
                        fill
                        className="object-contain object-center opacity-60 rounded-t-lg"
                      />
                    )}
                    {cafeData.length > 1 && (
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                        {cafeData.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentCafeSlideIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentCafeSlideIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <h3 className="text-xl font-bold text-primary-blue">{cafeData[currentCafeSlideIndex]?.cafe_name}</h3>
                    {cafeData[currentCafeSlideIndex]?.cafe_location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-accent-pink" />
                        <span>{cafeData[currentCafeSlideIndex].cafe_location}</span>
                      </div>
                    )}
                    {cafeData[currentCafeSlideIndex]?.cafe_distance && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">Distance:</span>
                        <span>{cafeData[currentCafeSlideIndex].cafe_distance}</span>
                      </div>
                    )}
                    {cafeData[currentCafeSlideIndex]?.cafe_menu_url && (
                      <div className="flex items-center gap-2 text-sm">
                        <a
                          href={cafeData[currentCafeSlideIndex].cafe_menu_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent-pink hover:underline"
                        >
                          View Menu
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {hasGym && (
            <Dialog open={showGymDialog} onOpenChange={(open) => {
              setShowGymDialog(open);
              if (!open) setCurrentGymSlideIndex(0);
            }}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Dumbbell className="h-7 w-7" />
                  <span className="sr-only">Gym Details</span>
                </Button>
              </DialogTrigger>
              <DialogContent hideDefaultClose className="max-w-[425px] w-full mx-auto p-0 rounded-lg bg-white shadow-lg overflow-hidden">
                <VisuallyHidden asChild>
                  <DialogTitle>Gym Facilities</DialogTitle>
                </VisuallyHidden>
                <DialogClose asChild>
                  <button
                    className="absolute right-4 top-4 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                    aria-label="Close dialog"
                    type="button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-pink-500"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </DialogClose>
                <div {...gymSwipeHandlers} className="w-full relative">
                  <div className="relative w-full h-[220px] bg-gray-100">
                    {gymData[currentGymSlideIndex]?.gym_photo_url ? (
                      <Image
                        src={gymData[currentGymSlideIndex].gym_photo_url}
                        alt={gymData[currentGymSlideIndex].gym_name || "Gym photo"}
                        fill
                        className="object-cover rounded-t-lg"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <Image
                        src="/placeholder.svg"
                        alt="No gym image available"
                        fill
                        className="object-contain object-center opacity-60 rounded-t-lg"
                      />
                    )}
                    {gymData.length > 1 && (
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                        {gymData.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentGymSlideIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentGymSlideIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <h3 className="text-xl font-bold text-primary-blue">{gymData[currentGymSlideIndex]?.gym_name}</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-accent-pink" />
                      <span>{gymData[currentGymSlideIndex]?.gym_location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">Distance:</span>
                      <span>{gymData[currentGymSlideIndex]?.gym_distance}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">Rating:</span>
                      <span>{gymData[currentGymSlideIndex]?.gym_rating}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-accent-pink" />
                      <span>{gymData[currentGymSlideIndex]?.gym_times}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">Cost:</span>
                      <span>{gymData[currentGymSlideIndex]?.gym_cost}</span>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {hasShopping && (
            <Dialog open={showShoppingDialog} onOpenChange={(open) => {
              setShowShoppingDialog(open);
              if (!open) setCurrentShoppingSlideIndex(0);
            }}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <ShoppingBag className="h-7 w-7" />
                  <span className="sr-only">Shopping Details</span>
                </Button>
              </DialogTrigger>
              <DialogContent hideDefaultClose className="max-w-[425px] w-full mx-auto p-0 rounded-lg bg-white shadow-lg overflow-hidden">
                <VisuallyHidden asChild>
                  <DialogTitle>Shopping Facilities</DialogTitle>
                </VisuallyHidden>
                <DialogClose asChild>
                  <button
                    className="absolute right-4 top-4 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                    aria-label="Close dialog"
                    type="button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-pink-500"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </DialogClose>
                <div {...shoppingSwipeHandlers} className="w-full relative">
                  <div className="relative w-full h-[220px] bg-gray-100">
                    {shoppingData[currentShoppingSlideIndex]?.shopping_photo_url ? (
                      <Image
                        src={shoppingData[currentShoppingSlideIndex].shopping_photo_url}
                        alt={shoppingData[currentShoppingSlideIndex].shopping_name || "Shopping photo"}
                        fill
                        className="object-cover rounded-t-lg"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <Image
                        src="/placeholder.svg"
                        alt="No shopping image available"
                        fill
                        className="object-contain object-center opacity-60 rounded-t-lg"
                      />
                    )}
                    {shoppingData.length > 1 && (
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                        {shoppingData.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentShoppingSlideIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentShoppingSlideIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <h3 className="text-xl font-bold text-primary-blue">{shoppingData[currentShoppingSlideIndex]?.shopping_name}</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-accent-pink" />
                      <span>{shoppingData[currentShoppingSlideIndex]?.shopping_location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">Distance:</span>
                      <span>{shoppingData[currentShoppingSlideIndex]?.shopping_distance}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-accent-pink" />
                      <span>{shoppingData[currentShoppingSlideIndex]?.shopping_times}</span>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
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
          <div className="w-full mt-2">
            <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
              <SelectTrigger className="w-full rounded-full bg-light-blue text-dark-teal font-semibold text-base py-2 px-4 shadow-sm">
                <SelectValue placeholder="Select Room" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-white shadow-lg">
                {event.rooms!.map((room) => (
                  <SelectItem key={room.id} value={room.id.toString()}>{room.room_type || `Room ${room.id}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {event.rooms!.map((room) => (
              selectedRoomId === room.id.toString() && (
                <div key={room.id} className="mt-4">
                  <RoomDetailDisplay room={room} allParticipantProfiles={allParticipantProfiles} />
                </div>
              )
            ))}
          </div>
        ) : hasSingleRoom ? (
          <div className="mt-2">
            <Button
              variant="outline"
              className="rounded-full px-4 py-2 text-base bg-dark-teal text-white hover:bg-dark-teal/90"
            >
              {event.rooms![0].room_type || "Room Details"}
            </Button>
            <RoomDetailDisplay room={event.rooms![0]} allParticipantProfiles={allParticipantProfiles} />
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
          <Users className="h-4 w-4 text-dark-teal" />
          <span className="font-semibold text-sm">Room Participants:</span>
          <div className="flex flex-wrap gap-1">
            {room.participants.map((p, idx) => (
              <ParticipantBadge
                key={`${p}-${idx}`}
                name={p}
                roomType={room.room_type || undefined}
                allParticipantProfiles={allParticipantProfiles}
                size="small"
                showTripDuration={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const getTransferIcon = (transportMethod: string | undefined | null) => {
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
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error("Session error:", sessionError)
          setIsAuthenticated(false)
          setIsLoading(false)
          return
        }

        setIsAuthenticated(!!session)
      } catch (error) {
        console.error("Error in checkAuth:", {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        })
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [supabase.auth])

  const handleActivityUpdated = () => {
    window.location.reload()
  }

  let CardIcon: React.ElementType
  let headerBg: string
  let headerText: string
  let iconColor: string

  if (event.event_type === "transfer") {
    CardIcon = getTransferIcon(event.company || null)
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
    <Card className="relative overflow-hidden">
      <div className="relative w-full h-auto aspect-w-16 aspect-h-9">
        <Image
          src={getEventImageQuery(event) || "/placeholder.svg"}
          alt={event.event_type === "activity" ? event.activity_name || "Activity" : event.description || "Transfer"}
          layout="fill"
          className="rounded-t-xl object-cover"
          crossOrigin="anonymous"
        />
      </div>
      <CardHeader className={cn(
        "p-4 pb-2",
        event.event_type === "activity"
          ? "bg-accent-pink text-white"
          : "bg-soft-yellow text-dark-teal rounded-t-xl"
      )}>
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            {event.event_type === "activity" ? (
              <FootprintsIcon className="h-5 w-5 text-white" />
            ) : event.transport_type === "train" ? (
              <Train className="h-5 w-5 text-accent-pink" />
            ) : event.transport_type === "bus" ? (
              <Bus className="h-5 w-5 text-accent-pink" />
            ) : event.transport_type === "ferry" ? (
              <Ferry className="h-5 w-5 text-accent-pink" />
            ) : event.transport_type === "walk" ? (
              <Walk className="h-5 w-5 text-accent-pink" />
            ) : event.transport_type === "taxi" ? (
              <Taxi className="h-5 w-5 text-accent-pink" />
            ) : (
              <Car className="h-5 w-5 text-accent-pink" />
            )}
            <h3 className="font-semibold text-lg">
              {event.event_type === "activity"
                ? event.activity_name || event.description || "Activity"
                : event.description}
            </h3>
          </div>
          {event.event_type === "activity" && isAuthenticated && !isLoading && (
            <EditActivityForm
              activity={event}
              allParticipantProfiles={allParticipantProfiles}
              onActivityUpdated={handleActivityUpdated}
            />
          )}
        </div>
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
            {event.participants.map((p, idx) => (
              <ParticipantBadge
                key={`${p}-${idx}`}
                name={p}
                event={event}
                allParticipantProfiles={allParticipantProfiles}
                size="small"
                showTripDuration={false}
              />
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

export function CarHireCard({ event, allParticipantProfiles }: EventCardProps) {
  const hasMultipleCars = event.cars && event.cars.length > 1;
  const hasSingleCar = event.cars && event.cars.length === 1;
  const [selectedCarId, setSelectedCarId] = useState(
    hasMultipleCars ? event.cars![0].id.toString() : hasSingleCar ? event.cars![0].id.toString() : ""
  );

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <Car className="h-5 w-5 text-accent-pink" />
            <h3 className="font-semibold text-lg">Car Hire</h3>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 grid gap-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-dark-teal" />
          <span className="font-semibold">Location:</span> {event.location || "N/A"}
        </div>
        {/* Removed time display from here */}
        {hasMultipleCars ? (
          <div className="w-full mt-2">
            <Select value={selectedCarId} onValueChange={setSelectedCarId}>
              <SelectTrigger className="w-full rounded-full bg-light-blue text-dark-teal font-semibold text-base py-2 px-4 shadow-sm">
                <SelectValue placeholder="Select Car" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-white shadow-lg">
                {event.cars!.map((car) => (
                  <SelectItem key={car.id} value={car.id.toString()}>{car.car_name || `Car ${car.id}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {event.cars!.map((car) => (
              selectedCarId === car.id.toString() && (
                <div key={car.id} className="mt-4">
                  <CarDetailDisplay car={car} allParticipantProfiles={allParticipantProfiles} event={event} />
                </div>
              )
            ))}
          </div>
        ) : hasSingleCar ? (
          <div className="mt-2">
            <Button
              variant="outline"
              className="rounded-full px-4 py-2 text-base bg-dark-teal text-white hover:bg-dark-teal/90"
            >
              {event.cars![0].car_name || "Car Details"}
            </Button>
            <CarDetailDisplay car={event.cars![0]} allParticipantProfiles={allParticipantProfiles} event={event} />
          </div>
        ) : (
          <div className="mt-2 text-muted-foreground text-sm">
            <p>No specific car details available.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CarDetailDisplayProps {
  car: CarDetail
  allParticipantProfiles: Map<string, ParticipantProfile>
  event: ItineraryEvent
}

function CarDetailDisplay({ car, allParticipantProfiles, event }: CarDetailDisplayProps) {
  return (
    <div className="grid gap-2">
      {car.driver && (
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-dark-teal" />
          <span className="font-semibold">Driver:</span> {car.driver}
          <ParticipantBadge 
            name={car.driver} 
            event={event} 
            allParticipantProfiles={allParticipantProfiles} 
          />
        </div>
      )}
      {car.booking_reference && (
        <div className="flex items-center gap-2 text-sm">
          <Tag className="h-4 w-4 text-dark-teal" />
          <span className="font-semibold">Booking Reference:</span> {car.booking_reference}
        </div>
      )}
      {car.pickup_location && (
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-dark-teal" />
          <span className="font-semibold">Pickup:</span> {car.pickup_location}
        </div>
      )}
      {car.dropoff_location && (
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-dark-teal" />
          <span className="font-semibold">Dropoff:</span> {car.dropoff_location}
        </div>
      )}
      {car.passengers && car.passengers.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Users className="h-4 w-4 text-dark-teal" />
          <span className="font-semibold text-sm">Passengers:</span>
          <div className="flex flex-wrap gap-1">
            {car.passengers.map((p) => (
              <ParticipantBadge 
                key={p} 
                name={p} 
                event={event} 
                allParticipantProfiles={allParticipantProfiles} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export type { ItineraryEvent, ParticipantProfile }

