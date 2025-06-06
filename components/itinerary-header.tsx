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

interface ItineraryHeaderProps {
  dateRange: { from: Date | undefined; to: Date | undefined }
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void
  isExpanded: boolean
  onToggle: () => void
}

export function ItineraryHeader({ dateRange, onDateRangeChange, isExpanded, onToggle }: ItineraryHeaderProps) {
  const [openCalendar, setOpenCalendar] = useState(false)

  return (
    <header className="flex flex-col md:flex-row items-center justify-between px-2 py-4 md:px-8 bg-white/80 backdrop-blur-sm shadow-sm rounded-b-xl z-10 relative animate-fade-in">
      <Link href="#" className="flex items-center gap-2 text-2xl font-bold text-accent-pink mb-4 md:mb-0">
        <Plane className="h-8 w-8 text-vibrant-purple" />
        Eurotrip
      </Link>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[280px] justify-start text-left font-normal rounded-full px-4 py-2 text-lg",
                !dateRange.from && "text-muted-foreground",
              )}
            >
              <CalendarDays className="mr-2 h-5 w-5 text-dark-teal" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange}
              onSelect={(range) => {
                onDateRangeChange(range || { from: undefined, to: undefined })
                if (range?.from && range?.to) {
                  setOpenCalendar(false)
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        {/* Add the UserAuthButton here */}
        <UserAuthButton />
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
