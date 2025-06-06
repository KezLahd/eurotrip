"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import Image from "next/image"
import { ItineraryTabs } from "@/components/itinerary-tabs"
import { createBrowserClient } from "@/lib/supabase-client"
import type { ItineraryEvent, ParticipantProfile } from "@/types/itinerary"
import { format, isWithinInterval, startOfDay, endOfDay, subYears, addYears } from "date-fns"
import { CollapsibleHeader } from "@/components/collapsible-header"
import { fetchItineraryData } from "@/actions/itinerary" // Import the Server Action
import { SupabaseClient } from "@supabase/supabase-js"
import { LoginBackgroundVideo } from "@/components/login-background-video"
import { WelcomePopup } from "@/components/welcome-popup"
import { cn } from "@/lib/utils"
import { useCurrentParticipant } from "@/components/current-participant-context"

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
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(true)
  const [fadeToStaticBackground, setFadeToStaticBackground] = useState(false)
  const [showWelcomePopup, setShowWelcomePopup] = useState(true)
  const [landscapeVideoUrl, setLandscapeVideoUrl] = useState<string | null>(null)
  const [portraitVideoUrl, setPortraitVideoUrl] = useState<string | null>(null)

  const [flightsTransfersLoading, setFlightsTransfersLoading] = useState(true)
  const [accommodationLoading, setAccommodationLoading] = useState(true)
  const [activitiesLoading, setActivitiesLoading] = useState(true)

  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subYears(new Date(), 1),
    to: addYears(new Date(), 1),
  })
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true)
  const [currentBackgroundImageUrl, setCurrentBackgroundImageUrl] = useState<string | null>(null)

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [eventFilter, setEventFilter] = useState<'all' | 'mine'>('all')
  const participant = useCurrentParticipant()

  useEffect(() => {
    setSupabase(createBrowserClient())
  }, [])

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

  // Add effect to fetch initial_load video URLs
  useEffect(() => {
    const supabaseClient = supabase
    if (!supabaseClient) return

    async function fetchInitialLoadVideos() {
      try {
        // Fetch landscape video
        const { data: landscapeVideo, error: landscapeError } = await (supabaseClient as SupabaseClient)
          .from("animations")
          .select("url")
          .eq("name", "initial_load")
          .eq("screen_aspect_ratio", "16:9")
          .single()

        if (landscapeError) {
          console.error("Error fetching landscape initial_load video:", landscapeError.message)
        } else {
          setLandscapeVideoUrl(landscapeVideo?.url || null)
        }

        // Fetch portrait video
        const { data: portraitVideo, error: portraitError } = await (supabaseClient as SupabaseClient)
          .from("animations")
          .select("url")
          .eq("name", "initial_load")
          .eq("screen_aspect_ratio", "9:16")
          .single()

        if (portraitError) {
          console.error("Error fetching portrait initial_load video:", portraitError.message)
        } else {
          setPortraitVideoUrl(portraitVideo?.url || null)
        }
      } catch (error) {
        console.error("Error in fetchInitialLoadVideos:", error)
      }
    }

    fetchInitialLoadVideos()
  }, [supabase])

  // Start the animation sequence
  useEffect(() => {
    if (showWelcomeAnimation) {
      const videoPlayDuration = 3000
      const fadeTransitionDuration = 800

      const fadeTimer = setTimeout(() => {
        setFadeToStaticBackground(true)
      }, videoPlayDuration)

      const hideWelcomeTimer = setTimeout(() => {
        setShowWelcomePopup(false)
        setShowWelcomeAnimation(false)
      }, videoPlayDuration + fadeTransitionDuration)

      return () => {
        clearTimeout(fadeTimer)
        clearTimeout(hideWelcomeTimer)
      }
    }
  }, [showWelcomeAnimation])

  // Effect to fetch Flights & Transfers data first
  useEffect(() => {
    if (!supabase) return;
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
  }, [supabase]) // Runs once on mount

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
    return allEvents.filter((event: ItineraryEvent) => {
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

  // Filter events for 'my itinerary'
  const filterForMine = (events: ItineraryEvent[]) => {
    if (eventFilter === 'all' || !participant) return events;
    return events.filter(event =>
      (event.participants && event.participants.includes(participant.participant_name)) ||
      (event.passengers && event.passengers.includes(participant.participant_name))
    );
  };

  const scrollAreaHeightClass = isHeaderExpanded
    ? "h-[calc(100vh-180px)] md:h-[calc(100vh-160px)]"
    : "h-[calc(100vh-80px)] md:h-[calc(100vh-80px)]"

  // Determine overall loading state for the initial "Loading itinerary events..." message
  const overallLoading = flightsTransfersLoading || accommodationLoading || activitiesLoading

  return (
    <div className="relative h-screen flex flex-col items-center px-1 py-4 md:p-8 font-sans overflow-hidden">
      {/* Welcome Animation */}
      {showWelcomeAnimation && (
        <>
          <LoginBackgroundVideo
            landscapeVideoUrl={landscapeVideoUrl}
            portraitVideoUrl={portraitVideoUrl}
            landscapeBackgroundUrl={landscapeBackgroundUrl}
            portraitBackgroundUrl={portraitBackgroundUrl}
            fadeToStaticBackground={fadeToStaticBackground}
          />
          <WelcomePopup show={showWelcomePopup} />
        </>
      )}

      {/* Background Image */}
      <div className={cn("absolute inset-0 z-0", showWelcomeAnimation && "opacity-0")}>
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
        eventFilter={eventFilter}
        onEventFilterChange={setEventFilter}
        onHeaderToggle={handleHeaderToggle}
      />

      {/* Scrollable Content Area */}
      <div className={cn("relative z-10 w-full max-w-7xl flex flex-col gap-6 pt-4 flex-grow", showWelcomeAnimation && "opacity-0")}>
        {overallLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-accent-pink">
            <p className="text-lg font-semibold">Loading itinerary events...</p>
            {/* You can add a spinner here if desired */}
          </div>
        ) : (
          <ItineraryTabs
            flightsTransfersEvents={filterForMine(flightsTransfersEvents)}
            accommodationEvents={filterForMine(accommodationEvents)}
            activityEvents={filterForMine(activityEvents)}
            flightsTransfersLoading={flightsTransfersLoading}
            accommodationLoading={accommodationLoading}
            activitiesLoading={activitiesLoading}
            selectedDate={dateRange.from || new Date()}
            allParticipantProfiles={allParticipantProfiles}
            scrollAreaHeightClass={scrollAreaHeightClass}
            filteredEvents={filterForMine(allEvents)}
          />
        )}
      </div>
    </div>
  )
}
