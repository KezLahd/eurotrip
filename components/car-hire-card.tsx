"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Car, MapPin, Users, Tag, Info, UserRound } from "lucide-react"
import Image from "next/image"
import type { ItineraryEvent, CarDetail, ParticipantProfile } from "@/types/itinerary"
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
import { ParticipantBadge, getEventImageQuery } from "./event-cards"

interface CarHireCardProps {
  event: ItineraryEvent
  allParticipantProfiles: Map<string, ParticipantProfile>
}

export function CarHireCard({ event, allParticipantProfiles }: CarHireCardProps) {
  const hasMultipleCars = event.cars && event.cars.length > 1
  const defaultTabValue = hasMultipleCars ? `car-${event.cars![0].id}` : "single-car"
  const singleCar = hasMultipleCars ? null : event.cars && event.cars.length === 1 ? event.cars[0] : null

  return (
    <Card className="w-full rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 animate-fade-in">
      <div className="relative w-full h-auto aspect-w-16 aspect-h-9">
        <Image
          src={getEventImageQuery(event) || "/placeholder.svg"}
          alt={event.description || "Car Hire"}
          layout="fill"
          objectFit="cover"
          className="rounded-t-xl"
          crossOrigin="anonymous"
        />
      </div>
      <CardHeader className="bg-soft-yellow text-dark-teal p-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Car className="h-6 w-6" />
          <h3 className="text-xl font-bold">{event.description || "Car Hire"}</h3>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-dark-teal hover:bg-dark-teal/10">
              <Info className="h-5 w-5" />
              <span className="sr-only">More Info</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-lg bg-white p-6 shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-primary-blue">Car Hire Details</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Information for your car hire booking.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {event.booking_reference && (
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-dark-teal" />
                  <span className="font-semibold">Booking Reference:</span> {event.booking_reference}
                </div>
              )}
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
        {/* Removed time display from here */}

        {hasMultipleCars ? (
          <Tabs defaultValue={defaultTabValue} className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 h-auto p-1 bg-light-blue rounded-xl gap-1">
              {event.cars!.map((car) => (
                <TabsTrigger
                  key={car.id}
                  value={`car-${car.id}`}
                  className="rounded-full data-[state=active]:bg-primary-blue data-[state=active]:text-white text-dark-teal font-semibold text-sm py-1 transition-all duration-300 hover:bg-medium-blue hover:text-white"
                >
                  {car.car_name || `Car ${car.id}`}
                </TabsTrigger>
              ))}
            </TabsList>
            {event.cars!.map((car) => (
              <TabsContent key={car.id} value={`car-${car.id}`} className="mt-4">
                <CarDetailDisplay car={car} allParticipantProfiles={allParticipantProfiles} event={event} />
              </TabsContent>
            ))}
          </Tabs>
        ) : singleCar ? (
          <div className="mt-2">
            <Button
              variant="outline"
              className="rounded-full px-4 py-2 text-base bg-dark-teal text-white hover:bg-dark-teal/90"
            >
              {singleCar.car_name || "Car Details"}
            </Button>
            <CarDetailDisplay car={singleCar} allParticipantProfiles={allParticipantProfiles} event={event} />
          </div>
        ) : (
          <div className="mt-2 text-muted-foreground text-sm">
            <p>No specific car details available.</p>
          </div>
        )}
      </CardContent>
      {/* Removed the CardFooter for "All Passengers" */}
    </Card>
  )
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
          <UserRound className="h-4 w-4 text-dark-teal" />
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
