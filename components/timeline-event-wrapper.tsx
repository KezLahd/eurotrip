"use client"

import { useRef, useLayoutEffect, useState } from "react"
import {
  FlightCard,
  AccommodationCard,
  TransferActivityCard,
  type ItineraryEvent,
  type ParticipantProfile,
} from "@/components/event-cards"
import { CarHireCard } from "@/components/car-hire-card"
import { EventTimeDisplay } from "./event-time-display"
import { useMediaQuery } from "@/hooks/use-media-query" // Import useMediaQuery
import { cn } from "@/lib/utils" // Import cn for responsive classes

interface TimelineEventWrapperProps {
  event: ItineraryEvent
  allParticipantProfiles: Map<string, ParticipantProfile>
}

export function TimelineEventWrapper({ event, allParticipantProfiles }: TimelineEventWrapperProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [cardHeight, setCardHeight] = useState(0)
  const isDesktop = useMediaQuery("(min-width: 768px)") // Tailwind's md breakpoint
  const verticalTimeLabelOffset = 20 // Define the offset here

  useLayoutEffect(() => {
    if (!cardRef.current) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === cardRef.current) {
          const newHeight = entry.contentRect.height
          if (newHeight !== cardHeight) {
            setCardHeight(newHeight)
          }
        }
      }
    })

    observer.observe(cardRef.current)
    setCardHeight(Math.max(cardRef.current.offsetHeight, 80)) // Min height 80px for card

    return () => {
      observer.disconnect()
    }
  }, [event])

  // Constants for positioning relative to the parent's timeline line (left-4 on parent means 16px)
  const timelineLineAbsoluteX = 16 // The main vertical line is at left-4 (16px) from ContinuousTimeline's edge
  const dotSize = isDesktop ? 24 : 16 // h-6 w-6 for desktop, h-4 w-4 for mobile
  const dotCenterOffset = dotSize / 2 // Center the dot on the line

  // Calculate positions
  const dotLeftPosition = timelineLineAbsoluteX - dotCenterOffset // Position of the dot's left edge relative to wrapper
  const cardMarginLeft = isDesktop ? 40 : 24 // Desired start of the card from ContinuousTimeline's left edge
  const timeLabelLeftPosition = isDesktop ? 0 : 0 // Desired start of the time label from ContinuousTimeline's left edge

  return (
    <div className="relative mb-16 w-full">
      {" "}
      {/* Removed paddingLeft, added w-full */}
      {/* Pink dot - positioned relative to the wrapper's left edge */}
      <div
        className={cn(
          "absolute top-0 bg-accent-pink rounded-full border-2 border-white z-10",
          isDesktop ? "h-6 w-6" : "h-4 w-4", // Responsive dot size
        )}
        style={{ left: `${dotLeftPosition}px` }}
      />
      {/* Primary Time (Departure/Check-in/Start) - positioned above the card */}
      <div
        className="absolute z-20"
        style={{
          top: `-${verticalTimeLabelOffset}px`,
          left: `${timeLabelLeftPosition}px`,
        }}
      >
        <EventTimeDisplay event={event} type="primary" />
      </div>
      {/* Event Card */}
      <div ref={cardRef} className="flex-grow" style={{ marginLeft: `${cardMarginLeft}px` }}>
        {" "}
        {/* Added marginLeft */}
        {event.event_type === "flight" && <FlightCard event={event} allParticipantProfiles={allParticipantProfiles} />}
        {event.event_type === "accommodation" && (
          <AccommodationCard event={event} allParticipantProfiles={allParticipantProfiles} />
        )}
        {event.event_type === "car_hire" && (
          <CarHireCard event={event} allParticipantProfiles={allParticipantProfiles} />
        )}
        {(event.event_type === "transfer" || event.event_type === "activity") && (
          <TransferActivityCard event={event} allParticipantProfiles={allParticipantProfiles} />
        )}
        {event.event_type === "unknown" && (
          <div className="bg-gray-100 p-4 rounded-lg shadow-sm text-sm text-gray-600">
            <p className="font-semibold">Unknown Event Type:</p>
            <p>{event.description || "No description"}</p>
            <p className="text-xs mt-1">Please check the `event_type` or `description` in Supabase for this entry.</p>
          </div>
        )}
      </div>
      {/* Secondary Time (Arrival/Check-out/End) - positioned below the card */}
      <div
        className="absolute z-20"
        style={{
          bottom: `-${verticalTimeLabelOffset}px`,
          left: `${timeLabelLeftPosition}px`,
        }}
      >
        <EventTimeDisplay event={event} type="secondary" />
      </div>
    </div>
  )
}
