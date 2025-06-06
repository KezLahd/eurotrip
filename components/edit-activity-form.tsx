"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Pencil, Upload, Trash2 } from "lucide-react"
import { format, parse } from "date-fns"
import { toast } from "sonner"
import type { ParticipantProfile, ItineraryEvent } from "@/types/itinerary"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"

interface EditActivityFormProps {
  activity: ItineraryEvent
  allParticipantProfiles: Map<string, ParticipantProfile>
  onActivityUpdated: () => void
}

export function EditActivityForm({ activity, allParticipantProfiles, onActivityUpdated }: EditActivityFormProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showAdminError, setShowAdminError] = useState(false)
  const [formData, setFormData] = useState({
    activity_name: activity.activity_name || "",
    location: activity.location || "",
    city: activity.city || "",
    start_time_local: activity.start_time_local ? format(new Date(activity.start_time_local), "yyyy-MM-dd'T'HH:mm") : "",
    end_time_local: activity.end_time_local ? format(new Date(activity.end_time_local), "yyyy-MM-dd'T'HH:mm") : "",
    participants: activity.participants || [],
    additional_details: activity.additional_details || "",
    booking_reference: activity.booking_reference || "",
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(activity.activity_photo_url || null)
  const [session, setSession] = useState<any>(null)
  const [userRole, setUserRole] = useState("viewer")
  const supabase = createBrowserClient()
  const router = useRouter()

  // Fetch session and user role
  useEffect(() => {
    const fetchSessionAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user?.email) {
        const { data: roleData, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("email", session.user.email.toLowerCase().trim())
          .single();
        if (error) {
          setUserRole("viewer");
        } else {
          setUserRole(roleData?.role || "viewer");
        }
      } else {
        setUserRole("viewer");
      }
    };
    fetchSessionAndRole();
  }, [supabase]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
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
      let photoUrl = activity.activity_photo_url

      // Handle image upload if a new image was selected
      if (selectedImage) {
        const timestamp = new Date().getTime()
        const randomString = Math.random().toString(36).substring(2, 15)
        const fileExt = selectedImage.name.split('.').pop()
        const fileName = `${timestamp}-${randomString}.${fileExt}`
        const filePath = `activities/${fileName}`

        console.log('Attempting to upload image:', {
          fileName,
          filePath,
          fileType: selectedImage.type,
          fileSize: selectedImage.size
        })

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('travel-images')
          .upload(filePath, selectedImage, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) {
          console.error('Upload error details:', {
            error: uploadError,
            message: uploadError.message
          })
          throw new Error(`Failed to upload image: ${uploadError.message}`)
        }

        // Get the public URL for the uploaded image
        const { data: { publicUrl } } = supabase.storage
          .from('travel-images')
          .getPublicUrl(filePath)

        photoUrl = publicUrl

        // Delete old image if it exists and is different from the new one
        if (activity.activity_photo_url && activity.activity_photo_url !== photoUrl) {
          const oldFilePath = activity.activity_photo_url.split('/').pop()
          if (oldFilePath) {
            await supabase.storage
              .from('travel-images')
              .remove([`activities/${oldFilePath}`])
          }
        }
      }

      // Convert local times to UTC
      const startTimeLocal = parse(formData.start_time_local, "yyyy-MM-dd'T'HH:mm", new Date())
      const endTimeLocal = parse(formData.end_time_local, "yyyy-MM-dd'T'HH:mm", new Date())
      
      const startTimeUTC = format(startTimeLocal, "yyyy-MM-dd'T'HH:mm:ss'Z'")
      const endTimeUTC = format(endTimeLocal, "yyyy-MM-dd'T'HH:mm:ss'Z'")

      // Update the activity in the database
      const { data, error } = await supabase
        .from('activities')
        .update({
          activity_name: formData.activity_name.trim(),
          location: formData.location.trim(),
          city: formData.city.trim(),
          start_time_local: format(startTimeLocal, "yyyy-MM-dd'T'HH:mm:ss"),
          start_time_utc: startTimeUTC,
          end_time_local: format(endTimeLocal, "yyyy-MM-dd'T'HH:mm:ss"),
          end_time_utc: endTimeUTC,
          participants: formData.participants.join(','),
          participant_count: formData.participants.length.toString(),
          additional_details: formData.additional_details.trim(),
          booking_reference: formData.booking_reference.trim(),
          activity_photo_url: photoUrl,
        })
        .eq('id', activity.id)
        .select()

      if (error) {
        throw new Error(`Failed to update activity: ${error.message}`)
      }

      if (!data || data.length === 0) {
        throw new Error('Activity was not updated')
      }

      toast.success('Activity updated successfully')
      setOpen(false)
      onActivityUpdated()
      router.refresh()
    } catch (error) {
      console.error('Error updating activity:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update activity')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (userRole !== "admin") {
      setShowAdminError(true)
      return
    }
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    try {
      // Delete the activity photo if it exists
      if (activity.activity_photo_url) {
        const oldFilePath = activity.activity_photo_url.split('/').pop()
        if (oldFilePath) {
          await supabase.storage
            .from('travel-images')
            .remove([`activities/${oldFilePath}`])
        }
      }

      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activity.id)

      if (error) throw error

      toast.success('Activity deleted successfully')
      setShowDeleteConfirm(false)
      onActivityUpdated()
      router.refresh()
    } catch (error) {
      console.error('Error deleting activity:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete activity')
    }
  }

  return (
    <>
      <div className="flex gap-2">
        {userRole === "admin" ? (
          <>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Activity</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="activity_name">Activity Name</Label>
                    <Input
                      id="activity_name"
                      value={formData.activity_name}
                      onChange={(e) => setFormData({ ...formData, activity_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="start_time_local">Start Time (Local)</Label>
                    <Input
                      id="start_time_local"
                      type="datetime-local"
                      value={formData.start_time_local}
                      onChange={(e) => setFormData({ ...formData, start_time_local: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time_local">End Time (Local)</Label>
                    <Input
                      id="end_time_local"
                      type="datetime-local"
                      value={formData.end_time_local}
                      onChange={(e) => setFormData({ ...formData, end_time_local: e.target.value })}
                      required
                    />
                  </div>
                  <div>
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
                  <div>
                    <Label htmlFor="additional_details">Additional Details</Label>
                    <Textarea
                      id="additional_details"
                      value={formData.additional_details}
                      onChange={(e) => setFormData({ ...formData, additional_details: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="booking_reference">Booking Reference</Label>
                    <Input
                      id="booking_reference"
                      value={formData.booking_reference}
                      onChange={(e) => setFormData({ ...formData, booking_reference: e.target.value })}
                    />
                  </div>
                  <div>
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
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg"
                          width={400}
                          height={192}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 opacity-50 cursor-not-allowed"
              onClick={() => setShowAdminError(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 opacity-50 cursor-not-allowed"
              onClick={() => setShowAdminError(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Activity</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete "{activity.activity_name}"? This action cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Error Dialog */}
      <Dialog open={showAdminError} onOpenChange={setShowAdminError}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Access Required</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>You ain't the admin bruh 😅</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowAdminError(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 