"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ItineraryEvent, ParticipantProfile } from "@/types/itinerary"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ContinuousTimeline } from "./continuous-timeline"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useState } from "react"
import { ParticipantGrid } from "./participant-grid" // Import ParticipantGrid

interface ItineraryTabsProps {
  flightsTransfersEvents: ItineraryEvent[]
  accommodationEvents: ItineraryEvent[]
  activityEvents: ItineraryEvent[]
  flightsTransfersLoading: boolean
  accommodationLoading: boolean
  activitiesLoading: boolean
  selectedDate: Date
  allParticipantProfiles: Map<string, ParticipantProfile>
  scrollAreaHeightClass: string
  filteredEvents: ItineraryEvent[] // Add this prop
}

export function ItineraryTabs({
  flightsTransfersEvents,
  accommodationEvents,
  activityEvents,
  flightsTransfersLoading,
  accommodationLoading,
  activitiesLoading,
  selectedDate,
  allParticipantProfiles,
  scrollAreaHeightClass,
  filteredEvents, // Destructure the new prop
}: ItineraryTabsProps) {
  const [activeTab, setActiveTab] = useState("flights-transfers")
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const renderContent = (events: ItineraryEvent[], isLoading: boolean, noEventsMessage: string) => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-accent-pink">
          <p className="text-lg font-semibold">
            Loading {noEventsMessage.toLowerCase().replace("no ", "").replace(" found.", "")}...
          </p>
        </div>
      )
    }
    if (events.length === 0) {
      return <p className="text-center text-muted-foreground py-8">{noEventsMessage}</p>
    }
    return <ContinuousTimeline events={events} allParticipantProfiles={allParticipantProfiles} />
  }

  return (
    <div
      className={cn(
        "w-full max-w-7xl mx-auto px-1 py-4 animate-fade-in",
        "bg-transparent shadow-none rounded-none",
        "md:bg-white/80 md:backdrop-blur-sm md:rounded-xl md:shadow-lg",
      )}
    >
      <Tabs defaultValue="flights-transfers" value={activeTab} className="w-full">
        {isDesktop ? (
          <TabsList className="flex flex-wrap justify-center w-full h-auto p-1 bg-light-blue rounded-full gap-1 md:grid md:grid-cols-4">
            {" "}
            {/* Changed grid-cols-3 to grid-cols-4 */}
            <TabsTrigger
              value="flights-transfers"
              className="flex-grow rounded-full data-[state=active]:bg-primary-blue data-[state=active]:text-white text-dark-teal font-semibold text-base py-2 transition-all duration-300"
              onClick={() => setActiveTab("flights-transfers")}
            >
              Flights & Transfers
            </TabsTrigger>
            <TabsTrigger
              value="accommodation"
              className="flex-grow rounded-full data-[state=active]:bg-primary-blue data-[state=active]:text-white text-dark-teal font-semibold text-base py-2 transition-all duration-300"
              onClick={() => setActiveTab("accommodation")}
            >
              Accommodation
            </TabsTrigger>
            <TabsTrigger
              value="activities"
              className="flex-grow rounded-full data-[state=active]:bg-primary-blue data-[state=active]:text-white text-dark-teal font-semibold text-base py-2 transition-all duration-300"
              onClick={() => setActiveTab("activities")}
            >
              Activities
            </TabsTrigger>
            <TabsTrigger // New Participants Tab Trigger
              value="participants"
              className="flex-grow rounded-full data-[state=active]:bg-primary-blue data-[state=active]:text-white text-dark-teal font-semibold text-base py-2 transition-all duration-300"
              onClick={() => setActiveTab("participants")}
            >
              Participants
            </TabsTrigger>
          </TabsList>
        ) : (
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full rounded-full bg-light-blue text-dark-teal font-semibold text-base py-2 px-4 shadow-sm">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-white shadow-lg">
              <SelectItem value="flights-transfers">Flights & Transfers</SelectItem>
              <SelectItem value="accommodation">Accommodation</SelectItem>
              <SelectItem value="activities">Activities</SelectItem>
              <SelectItem value="participants">Participants</SelectItem> {/* New Participants Select Item */}
            </SelectContent>
          </Select>
        )}

        <ScrollArea className={cn("mt-4 p-2", scrollAreaHeightClass)}>
          <TabsContent value="flights-transfers">
            {renderContent(flightsTransfersEvents, flightsTransfersLoading, "No flights or transfers found.")}
          </TabsContent>
          <TabsContent value="accommodation" className="grid gap-4">
            {renderContent(accommodationEvents, accommodationLoading, "No accommodations found.")}
          </TabsContent>
          <TabsContent value="activities" className="grid gap-4">
            {renderContent(activityEvents, activitiesLoading, "No activities found.")}
          </TabsContent>
          <TabsContent value="participants">
            {" "}
            {/* New Participants Tab Content */}
            <ParticipantGrid
              allParticipantProfiles={allParticipantProfiles}
              allEvents={filteredEvents} // Pass filtered events for trip duration calculation
            />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}
