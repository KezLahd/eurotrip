"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PlusCircle, Upload } from "lucide-react"
import { format, parse } from "date-fns"
import { toast } from "sonner"
import type { ParticipantProfile } from "@/types/itinerary"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AddActivityFormProps {
  allParticipantProfiles: Map<string, ParticipantProfile>
  onActivityAdded: () => void
}

export function AddActivityForm({ allParticipantProfiles, onActivityAdded }: AddActivityFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createBrowserClient()

  const [formData, setFormData] = useState({
    activity_name: "",
    location: "",
    city: "",
    start_time_local: "",
    end_time_local: "",
    participants: [] as string[],
    additional_details: "",
    booking_reference: "",
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }

      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 1. Upload image if selected
      let activity_photo_url = null
      if (selectedImage) {
        try {
          const fileExt = selectedImage.name.split(".").pop()?.toLowerCase()
          if (!fileExt || !['jpg', 'jpeg', 'png', 'webp'].includes(fileExt)) {
            throw new Error('Invalid file type. Please use JPG, PNG, or WebP images.')
          }

          const fileName = `activities/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
          
          // Log upload attempt
          console.log('Attempting to upload image:', {
            fileName,
            fileType: selectedImage.type,
            fileSize: selectedImage.size
          })

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("travel-images")
            .upload(fileName, selectedImage, {
              cacheControl: "3600",
              upsert: false,
              contentType: selectedImage.type
            })

          if (uploadError) {
            console.error("Detailed upload error:", {
              error: uploadError,
              message: uploadError.message,
              name: uploadError.name
            })
            throw new Error(`Failed to upload image: ${uploadError.message}`)
          }

          if (!uploadData) {
            throw new Error('No upload data returned')
          }

          console.log('Upload successful:', uploadData)

          const { data: { publicUrl } } = supabase.storage
            .from("travel-images")
            .getPublicUrl(fileName)

          if (!publicUrl) {
            throw new Error('Failed to get public URL for uploaded image')
          }

          activity_photo_url = publicUrl
          console.log('Public URL generated:', publicUrl)
        } catch (uploadErr: any) {
          console.error('Image upload failed:', uploadErr)
          throw new Error(`Image upload failed: ${uploadErr.message || 'Unknown error'}`)
        }
      }

      // 2. Convert local times to UTC
      const startTimeLocal = parse(formData.start_time_local, "yyyy-MM-dd'T'HH:mm", new Date())
      const endTimeLocal = parse(formData.end_time_local, "yyyy-MM-dd'T'HH:mm", new Date())
      
      // Format dates for database
      const startTimeUTC = startTimeLocal.toISOString()
      const endTimeUTC = endTimeLocal.toISOString()
      const startTimeLocalStr = format(startTimeLocal, "yyyy-MM-dd'T'HH:mm:ss")
      const endTimeLocalStr = format(endTimeLocal, "yyyy-MM-dd'T'HH:mm:ss")

      // 3. Insert activity into database
      const { data: newActivity, error: insertError } = await supabase
        .from("activities")
        .insert({
          activity_name: formData.activity_name.trim(),
          activity_photo_url,
          location: formData.location.trim(),
          city: formData.city.trim(),
          start_time_local: startTimeLocalStr,
          start_time_utc: startTimeUTC,
          end_time_local: endTimeLocalStr,
          end_time_utc: endTimeUTC,
          participants: formData.participants.join(","),
          participant_count: formData.participants.length.toString(),
          additional_details: formData.additional_details.trim(),
          booking_reference: formData.booking_reference.trim(),
        })
        .select()
        .single()

      if (insertError) {
        console.error("Error inserting activity:", insertError)
        throw new Error("Failed to create activity")
      }

      if (!newActivity) {
        throw new Error("No activity data returned after creation")
      }

      // Reset form
      setFormData({
        activity_name: "",
        location: "",
        city: "",
        start_time_local: "",
        end_time_local: "",
        participants: [],
        additional_details: "",
        booking_reference: "",
      })
      setSelectedImage(null)
      setImagePreview(null)

      toast.success("Activity added successfully!")
      setIsOpen(false)
      onActivityAdded()
      router.refresh()
    } catch (error: any) {
      console.error("Error adding activity:", error)
      toast.error(error.message || "Failed to add activity. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button id="add-activity-dialog-trigger" style={{ display: "none" }} tabIndex={-1} aria-hidden="true" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-2xl font-bold text-primary-blue">Add New Activity</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-8rem)] px-6">
          <form id="activity-form" onSubmit={handleSubmit} className="space-y-4 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="activity_name">Activity Name</Label>
                <Input
                  id="activity_name"
                  value={formData.activity_name}
                  onChange={(e) => setFormData({ ...formData, activity_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time_local">Start Time (Local)</Label>
                <Input
                  id="start_time_local"
                  type="datetime-local"
                  value={formData.start_time_local}
                  onChange={(e) => setFormData({ ...formData, start_time_local: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time_local">End Time (Local)</Label>
                <Input
                  id="end_time_local"
                  type="datetime-local"
                  value={formData.end_time_local}
                  onChange={(e) => setFormData({ ...formData, end_time_local: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Participants</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Array.from(allParticipantProfiles.values()).map((profile) => (
                  <label key={profile.name} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.participants.includes(profile.name)}
                      onChange={(e) => {
                        const newParticipants = e.target.checked
                          ? [...formData.participants, profile.name]
                          : formData.participants.filter((p) => p !== profile.name)
                        setFormData({ ...formData, participants: newParticipants })
                      }}
                      className="rounded border-gray-300 text-primary-blue focus:ring-primary-blue"
                    />
                    <span>{profile.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional_details">Additional Details</Label>
              <Textarea
                id="additional_details"
                value={formData.additional_details}
                onChange={(e) => setFormData({ ...formData, additional_details: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking_reference">Booking Reference</Label>
              <Input
                id="booking_reference"
                value={formData.booking_reference}
                onChange={(e) => setFormData({ ...formData, booking_reference: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity_photo">Activity Photo</Label>
              <div className="flex items-center space-x-4">
                <Input
                  id="activity_photo"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("activity_photo")?.click()}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {selectedImage ? "Change Photo" : "Upload Photo"}
                </Button>
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </form>
        </ScrollArea>
        <div className="px-6 py-4 border-t bg-white">
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" form="activity-form" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Activity"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 