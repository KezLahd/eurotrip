"use client"

import { useState, useEffect, useRef } from "react"
import { ItineraryHeader } from "@/components/itinerary-header"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CollapsibleHeaderProps {
  dateRange: { from: Date | undefined; to: Date | undefined }
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void
  onHeaderToggle: (isExpanded: boolean) => void // Callback to inform parent
}

export function CollapsibleHeader({ dateRange, onDateRangeChange, onHeaderToggle }: CollapsibleHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)
  const [currentContentHeight, setCurrentContentHeight] = useState(0)

  useEffect(() => {
    onHeaderToggle?.(isExpanded)
  }, [isExpanded, onHeaderToggle])

  useEffect(() => {
    if (!contentRef.current) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === contentRef.current) {
          setCurrentContentHeight(entry.contentRect.height)
        }
      }
    })

    observer.observe(contentRef.current)
    setCurrentContentHeight(contentRef.current.scrollHeight)

    return () => observer.disconnect()
  }, [dateRange])

  const toggleHeader = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    // The main container for the collapsible header
    <div className="relative z-20 w-full max-w-7xl bg-white/80 backdrop-blur-sm shadow-sm rounded-b-xl animate-fade-in">
      {/* This div controls the collapsing animation and has overflow: hidden */}
      <div
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{ maxHeight: isExpanded ? `${currentContentHeight}px` : "0px" }}
      >
        {/* This div holds the actual header content whose height is measured */}
        <div ref={contentRef}>
          <ItineraryHeader
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
            isExpanded={isExpanded} // Pass isExpanded state
            onToggle={toggleHeader} // Pass toggle function
          />
        </div>
      </div>

      {/* Toggle button container - MOVED OUTSIDE the overflow-hidden div */}
      {/* Positioned relative to the main CollapsibleHeader div */}
      <div className="absolute left-1/2 -translate-x-1/2 z-50" style={{ top: "calc(100% - 16px)" }}>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 rounded-md shadow-lg bg-primary-blue text-white hover:bg-primary-blue/90 transition-transform duration-300"
          onClick={toggleHeader}
          aria-label={isExpanded ? "Collapse header" : "Expand header"}
        >
          <ChevronDown className={cn("h-5 w-5 transition-transform duration-300", isExpanded && "rotate-180")} />
        </Button>
      </div>
    </div>
  )
}
