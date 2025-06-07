"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ItineraryEvent, ParticipantProfile } from "@/types/itinerary"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ContinuousTimeline } from "./continuous-timeline"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useState, useEffect, useRef } from "react"
import { ParticipantGrid } from "./participant-grid" // Import ParticipantGrid
import { AddActivityForm } from "@/components/add-activity-form"
import { createBrowserClient } from "@/lib/supabase-client"
import { PlusCircle, ChevronDown } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import SuggestedActivitiesPage from "@/app/suggested-activities/page"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

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
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState("viewer")
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const supabase = createBrowserClient()
  const dropdownMenuRef = useRef<HTMLButtonElement | null>(null);
  const [showAddSuggestedDialog, setShowAddSuggestedDialog] = useState(false);
  const [suggestedForm, setSuggestedForm] = useState({
    activity_name: "",
    location: "",
    suggested_date: "",
    duration: "",
    cost: "",
    image_url: ""
  });
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showAdminError, setShowAdminError] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const isAuthed = !!session
        setIsAuthenticated(isAuthed)
        if (isAuthed) {
          const { data, error } = await supabase.from("user_roles").select("role").eq("email", session?.user?.email).single()
          if (error) { console.error("Error fetching user role:", error); setUserRole("viewer"); } else { setUserRole(data?.role || "viewer"); }
        } else { setUserRole("viewer"); }
      } catch (error) {
         console.error("Error checking authentication:", error)
         setIsAuthenticated(false)
         setUserRole("viewer")
      } finally { setIsLoading(false) }
    }
    checkAuth()
  }, [supabase.auth])

  const handleActivityAdded = () => {
    // Refresh the activities data
    window.location.reload()
  }

  const handleAddSuggested = async () => {
    await supabase.from("suggested_activities").insert([suggestedForm]);
    setShowAddSuggestedDialog(false);
    setSuggestedForm({ activity_name: "", location: "", suggested_date: "", duration: "", cost: "", image_url: "" });
    // Optionally trigger a refresh of the suggested activities list
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setImageUploading(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !['jpg', 'jpeg', 'png', 'webp'].includes(fileExt)) {
        throw new Error('Invalid file type. Please use JPG, PNG, or WebP images.');
      }

      const fileName = `suggested-activities/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("travel-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        console.error("Detailed upload error:", uploadError);
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      if (!uploadData) {
        throw new Error('No upload data returned');
      }

      const { data: { publicUrl } } = supabase.storage
        .from("travel-images")
        .getPublicUrl(fileName);

      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      setSuggestedForm(f => ({ ...f, image_url: publicUrl }));
    } catch (err: any) {
      alert(`Image upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setImageUploading(false);
    }
  };

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
    return (
      <div className="space-y-4">
        {events.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{noEventsMessage}</p>
        ) : (
          <ContinuousTimeline events={events} allParticipantProfiles={allParticipantProfiles} />
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "w-full max-w-7xl mx-auto px-1 py-4 animate-fade-in",
        "bg-transparent shadow-none rounded-none"
      )}
    >
      <Tabs defaultValue="flights-transfers" value={activeTab} className="w-full">
        {isDesktop ? (
          <div className="relative w-full flex items-center">
            <TabsList className="flex flex-wrap justify-center items-center text-center w-[95%] h-auto p-1 bg-light-blue rounded-full gap-1">
              <TabsTrigger
                value="flights-transfers"
                className="flex-grow flex justify-center items-center rounded-full data-[state=active]:bg-primary-blue data-[state=active]:text-white text-dark-teal font-semibold text-base py-2 transition-all duration-300 text-center justify-center"
                onClick={() => setActiveTab("flights-transfers")}
              >
                Flights & Transfers
              </TabsTrigger>
              <TabsTrigger
                value="accommodation"
                className="flex-grow flex justify-center items-center rounded-full data-[state=active]:bg-primary-blue data-[state=active]:text-white text-dark-teal font-semibold text-base py-2 transition-all duration-300 text-center justify-center"
                onClick={() => setActiveTab("accommodation")}
              >
                Accommodation
              </TabsTrigger>
              <TabsTrigger
                value="activities"
                className="flex-grow flex items-center justify-center rounded-full data-[state=active]:bg-primary-blue data-[state=active]:text-white text-dark-teal font-semibold text-base py-2 transition-all duration-300 gap-1 text-center justify-center"
                onClick={() => setActiveTab("activities")}
              >
                Activities
              </TabsTrigger>
              <TabsTrigger
                value="participants"
                className="flex-grow flex justify-center items-center rounded-full data-[state=active]:bg-primary-blue data-[state=active]:text-white text-dark-teal font-semibold text-base py-2 transition-all duration-300 text-center justify-center"
                onClick={() => setActiveTab("participants")}
              >
                Participants
              </TabsTrigger>
              <TabsTrigger
                value="suggested-activities"
                className="flex-grow flex items-center justify-center rounded-full data-[state=active]:bg-primary-blue data-[state=active]:text-white text-dark-teal font-semibold text-base py-2 transition-all duration-300 gap-1 text-center justify-center"
                onClick={() => setActiveTab("suggested-activities")}
              >
                Suggested Activities
              </TabsTrigger>
            </TabsList>
            {/* Pink add button for desktop, positioned at the right of the tab bar */}
            <button
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 flex-shrink-0 rounded-full bg-transparent transition-colors",
                userRole !== "admin" && "opacity-50 cursor-not-allowed"
              )}
              style={{ width: '40px', height: '40px' }}
              onClick={() => {
                if (userRole !== "admin") {
                  setShowAdminError(true);
                  return;
                }
                if (activeTab === "suggested-activities") setShowAddSuggestedDialog(true);
                else if (activeTab === "activities") document.getElementById('add-activity-dialog-trigger')?.click();
              }}
              aria-label="Add Activity"
            >
              <PlusCircle className="h-8 w-8 text-accent-pink font-bold" />
            </button>
          </div>
        ) : (
          <div className="flex items-center w-full gap-2 mb-2">
            <div className="flex-grow flex justify-center items-center" style={{ flexBasis: '90%' }}>
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full rounded-full bg-light-blue text-dark-teal font-semibold text-base py-2 px-4 shadow-sm text-center justify-center">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-white shadow-lg">
                  <SelectItem value="flights-transfers">Flights & Transfers</SelectItem>
                  <SelectItem value="accommodation">Accommodation</SelectItem>
                  <SelectItem value="activities">Activities</SelectItem>
                  <SelectItem value="participants">Participants</SelectItem>
                  <SelectItem value="suggested-activities">Suggested Activities</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button
              className={cn("flex-shrink-0 rounded-full bg-transparent transition-colors", userRole !== "admin" && "opacity-50 cursor-not-allowed")}
              style={{ width: '56px', height: '56px' }}
              onClick={() => {
                if (userRole !== "admin") {
                  setShowAdminError(true);
                  return;
                }
                if (activeTab === "suggested-activities") setShowAddSuggestedDialog(true);
                else document.getElementById('add-activity-dialog-trigger')?.click();
              }}
              aria-label="Add Activity"
            >
              <PlusCircle className="h-10 w-10 text-accent-pink font-bold" />
            </button>
          </div>
        )}
        <ScrollArea className={cn("mt-4 p-2", scrollAreaHeightClass)}>
          <TabsContent value="flights-transfers">
            {renderContent(flightsTransfersEvents, flightsTransfersLoading, "No flights or transfers found.")}
          </TabsContent>
          <TabsContent value="accommodation" className="grid gap-4">
            {renderContent(accommodationEvents, accommodationLoading, "No accommodations found.")}
          </TabsContent>
          <TabsContent value="activities" className="grid gap-4">
            <AddActivityForm
              allParticipantProfiles={allParticipantProfiles}
              onActivityAdded={handleActivityAdded}
            />
            {renderContent(activityEvents, activitiesLoading, "No activities found.")}
          </TabsContent>
          <TabsContent value="participants">
            <ParticipantGrid
              allParticipantProfiles={allParticipantProfiles}
              allEvents={filteredEvents}
            />
          </TabsContent>
          <TabsContent value="suggested-activities">
            <SuggestedActivitiesPage />
            <Dialog open={showAddSuggestedDialog} onOpenChange={setShowAddSuggestedDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Suggested Activity</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleAddSuggested(); }}>
                  <input className="w-full border rounded p-2" placeholder="Activity Name" required value={suggestedForm.activity_name} onChange={e => setSuggestedForm(f => ({ ...f, activity_name: e.target.value }))} />
                  <input className="w-full border rounded p-2" placeholder="Location" required value={suggestedForm.location} onChange={e => setSuggestedForm(f => ({ ...f, location: e.target.value }))} />
                  <input className="w-full border rounded p-2" placeholder="Suggested Date" type="date" value={suggestedForm.suggested_date} onChange={e => setSuggestedForm(f => ({ ...f, suggested_date: e.target.value }))} />
                  <input className="w-full border rounded p-2" placeholder="Duration" value={suggestedForm.duration} onChange={e => setSuggestedForm(f => ({ ...f, duration: e.target.value }))} />
                  <input className="w-full border rounded p-2" placeholder="Cost" value={suggestedForm.cost} onChange={e => setSuggestedForm(f => ({ ...f, cost: e.target.value }))} />
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleImageChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mb-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={imageUploading}
                    >
                      {imageUploading ? "Uploading..." : (suggestedForm.image_url ? "Change Photo" : "Upload Photo")}
                    </Button>
                    {suggestedForm.image_url && (
                      <div className="w-full aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden mb-2 flex items-center justify-center">
                        <img
                          src={suggestedForm.image_url}
                          alt="Preview"
                          className="object-cover w-full h-full"
                          style={{ aspectRatio: "16/9" }}
                        />
                      </div>
                    )}
                  </div>
                  <Button type="submit" className="w-full">Add</Button>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>
          {/* Footer for all tabs */}
          <div className="w-full py-4 flex justify-center items-center mt-8">
            <footer className="w-full text-center text-lg font-bold" style={{ color: '#a020f0', opacity: 0.2 }}>
              Powered by mjsons solutions &copy; 2025
            </footer>
          </div>
        </ScrollArea>
      </Tabs>
      <Dialog open={showAdminError} onOpenChange={setShowAdminError}>
        <DialogContent className="flex flex-col items-center justify-center">
          <DialogHeader>
            <DialogTitle className="w-full text-center font-bold text-lg">You aint the admin bruh</DialogTitle>
          </DialogHeader>
          <Button className="mx-auto mt-4 font-bold" onClick={() => setShowAdminError(false)}>OK</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
