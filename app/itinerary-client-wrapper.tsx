"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import Image from "next/image"
import { ItineraryTabs } from "@/components/itinerary-tabs"
import { createBrowserClient } from "@/lib/supabase-client"
import type { ItineraryEvent, ParticipantProfile } from "@/types/itinerary"
import { format, isWithinInterval, startOfDay, endOfDay, subYears, addYears } from "date-fns"
import { CollapsibleHeader } from "@/components/collapsible-header"
import { fetchItineraryData } from "@/actions/itinerary" // Import the Server Action

interface ItineraryClientWrapperProps {
  landscapeBackgroundUrl: string | null
  portraitBackgroundUrl: string | null
}

export default function ItineraryClientWrapper({
  landscapeBackgroundUrl,
  portraitBackgroundUrl,
}: ItineraryClientWrapperProps) {
  const [flightsTransfersEvents, setFlightsTransfersEvents] = useState<ItineraryEvent[]>([])
  const [accommodationEvents, setAccommodationEvents] = useState<ItineraryEvent[]>([])
  const [activityEvents, setActivityEvents] = useState<ItineraryEvent[]>([])
  const [allParticipantProfiles, setAllParticipantProfiles] = useState<Map<string, ParticipantProfile>>(new Map())

  const [flightsTransfersLoading, setFlightsTransfersLoading] = useState(true)
  const [accommodationLoading, setAccommodationLoading] = useState(true)
  const [activitiesLoading, setActivitiesLoading] = useState(true)

  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subYears(new Date(), 1),
    to: addYears(new Date(), 1),
  })
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true)
  const [currentBackgroundImageUrl, setCurrentBackgroundImageUrl] = useState<string | null>(null)

  const supabase = useMemo(() => createBrowserClient(), [])

  const handleHeaderToggle = useCallback((expanded: boolean) => {
    setIsHeaderExpanded(expanded)
  }, [])

  const onDateRangeChange = (newDateRange: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(newDateRange)
  }

  useEffect(() => {
    const determineAndSetBackground = () => {
      if (typeof window !== "undefined") {
        if (window.innerHeight > window.innerWidth) {
          setCurrentBackgroundImageUrl(portraitBackgroundUrl)
        } else {
          setCurrentBackgroundImageUrl(landscapeBackgroundUrl)
        }
      } else {
        setCurrentBackgroundImageUrl(landscapeBackgroundUrl || portraitBackgroundUrl)
      }
    }

    determineAndSetBackground()
    window.addEventListener("resize", determineAndSetBackground)
    return () => window.removeEventListener("resize", determineAndSetBackground)
  }, [landscapeBackgroundUrl, portraitBackgroundUrl])

  // Effect to fetch Flights & Transfers data first
  useEffect(() => {
    async function loadFlightsTransfers() {
      setFlightsTransfersLoading(true)
      try {
        const { events: fetchedEvents, allParticipantProfiles: fetchedProfiles } =
          await fetchItineraryData("flights-transfers")
        setFlightsTransfersEvents(fetchedEvents)
        setAllParticipantProfiles(fetchedProfiles) // Participants are fetched here
      } catch (error) {
        console.error("Failed to fetch flights & transfers data:", error)
      } finally {
        setFlightsTransfersLoading(false)
      }
    }
    loadFlightsTransfers()
  }, []) // Runs once on mount

  // Effect to fetch Accommodation data after Flights & Transfers are loaded
  useEffect(() => {
    if (!flightsTransfersLoading) {
      async function loadAccommodation() {
        setAccommodationLoading(true)
        try {
          const { events: fetchedEvents } = await fetchItineraryData("accommodation")
          setAccommodationEvents(fetchedEvents)
        } catch (error) {
          console.error("Failed to fetch accommodation data:", error)
        } finally {
          setAccommodationLoading(false)
        }
      }
      loadAccommodation()
    }
  }, [flightsTransfersLoading]) // Runs when flightsTransfersLoading becomes false

  // Effect to fetch Activities data after Flights & Transfers are loaded
  useEffect(() => {
    if (!flightsTransfersLoading) {
      async function loadActivities() {
        setActivitiesLoading(true)
        try {
          const { events: fetchedEvents } = await fetchItineraryData("activities")
          setActivityEvents(fetchedEvents)
        } catch (error) {
          console.error("Failed to fetch activities data:", error)
        } finally {
          setActivitiesLoading(false)
        }
      }
      loadActivities()
    }
  }, [flightsTransfersLoading]) // Runs when flightsTransfersLoading becomes false

  // Combine all events for filtering based on date range
  const allEvents = useMemo(
    () => [...flightsTransfersEvents, ...accommodationEvents, ...activityEvents],
    [flightsTransfersEvents, accommodationEvents, activityEvents],
  )

  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      const eventDate = event.leave_time_local || event.start_date
      const matchesDate =
        !dateRange.from ||
        !eventDate ||
        (dateRange.from &&
          dateRange.to &&
          isWithinInterval(eventDate, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) })) ||
        (dateRange.from && !dateRange.to && format(eventDate, "yyyy-MM-dd") === format(dateRange.from, "yyyy-MM-dd"))

      return matchesDate
    })
  }, [allEvents, dateRange])

  const scrollAreaHeightClass = isHeaderExpanded
    ? "h-[calc(100vh-180px)] md:h-[calc(100vh-160px)]"
    : "h-[calc(100vh-80px)] md:h-[calc(100vh-80px)]"

  // Determine overall loading state for the initial "Loading itinerary events..." message
  const overallLoading = flightsTransfersLoading || accommodationLoading || activitiesLoading

  return (
    <div className="relative h-screen flex flex-col items-center px-1 py-4 md:p-8 font-sans overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={currentBackgroundImageUrl || "/placeholder.svg?height=1080&width=1920&query=default travel scene"}
          alt="European Summer Scene"
          layout="fill"
          objectFit="cover"
          quality={100}
          crossOrigin="anonymous"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-light-blue/50" />
      </div>

      {/* Collapsible Header Component */}
      <CollapsibleHeader
        dateRange={dateRange}
        onDateRangeChange={onDateRangeChange}
        onHeaderToggle={handleHeaderToggle}
      />

      {/* Scrollable Content Area */}
      <div className="relative z-10 w-full max-w-7xl flex flex-col gap-6 pt-4 flex-grow">
        {overallLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-accent-pink">
            <p className="text-lg font-semibold">Loading itinerary events...</p>
            {/* You can add a spinner here if desired */}
          </div>
        ) : (
          <ItineraryTabs
            flightsTransfersEvents={flightsTransfersEvents}
            accommodationEvents={accommodationEvents}
            activityEvents={activityEvents}
            flightsTransfersLoading={flightsTransfersLoading}
            accommodationLoading={accommodationLoading}
            activitiesLoading={activitiesLoading}
            selectedDate={dateRange.from || new Date()}
            allParticipantProfiles={allParticipantProfiles}
            scrollAreaHeightClass={scrollAreaHeightClass}
            filteredEvents={filteredEvents}
          />
        )}
      </div>
    </div>
  )
}
