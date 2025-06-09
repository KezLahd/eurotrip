"use client"

import Link from "next/link"
import { CalendarDays, Plane, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"
import { UserAuthButton } from "./user-auth-button" // Import the new component
import { useCurrentParticipant } from "@/components/current-participant-context"
import { ParticipantBadge } from "@/components/event-cards"
import type { DateRange } from "react-day-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ItineraryHeaderProps {
  eventFilter: 'all' | 'mine';
  onEventFilterChange: (filter: 'all' | 'mine') => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export function ItineraryHeader({ eventFilter, onEventFilterChange, isExpanded, onToggle }: ItineraryHeaderProps) {
  const [openCalendar, setOpenCalendar] = useState(false)

  const participant = useCurrentParticipant()
  const firstName = participant ? participant.participant_name.split(" ")[0] : null

  return (
    <header className="flex flex-col md:flex-row items-center justify-between px-2 py-2 md:px-4 backdrop-blur-sm shadow-sm rounded-b-xl z-10 relative animate-fade-in">
      <div className="flex items-center gap-2 text-2xl font-bold text-accent-pink mb-4 md:mb-0 flex-1 min-w-0">
        <Plane className="h-8 w-8 text-accent-pink" />
        {firstName && <span>{firstName}'s Eurotrip</span>}
        {!firstName && <span>Eurotrip</span>}
        {participant && (
          <ParticipantBadge
            name={participant.participant_name}
            allParticipantProfiles={new Map([[participant.participant_name, {
              name: participant.participant_name,
              initials: participant.participants_initials,
              photoUrl: participant.participant_photo_url || null
            }]])}
            size="small"
            className="ml-3"
          />
        )}
      </div>

      <div className="flex flex-row items-center gap-2 min-w-0">
        {/* Dropdown filter for all events vs my events */}
        <Select value={eventFilter} onValueChange={onEventFilterChange}>
          <SelectTrigger className="w-28 rounded-full bg-light-blue text-dark-teal font-semibold text-base py-1 px-3 shadow-sm min-w-0">
            <SelectValue placeholder="All Events" />
          </SelectTrigger>
          <SelectContent className="rounded-xl bg-white shadow-lg">
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="mine">My Events</SelectItem>
          </SelectContent>
        </Select>
        <UserAuthButton className="ml-1" />
      </div>

      {/* New toggle area at the bottom of the header */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20 cursor-pointer"
        onClick={onToggle}
        aria-label={isExpanded ? "Collapse header" : "Expand header"}
      >
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 rounded-md shadow-lg bg-primary-blue text-white hover:bg-primary-blue/90 transition-transform duration-300"
        >
          <ChevronDown className={cn("h-5 w-5 transition-transform duration-300", isExpanded && "rotate-180")} />
        </Button>
      </div>
    </header>
  )
}
