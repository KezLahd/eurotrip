"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, ThumbsUp, ThumbsDown, DollarSign, Pencil, Trash2, Calendar, MapPin, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase-client";
import { useCurrentParticipant } from "@/components/current-participant-context";
import { cn } from "@/lib/utils";
import { ParticipantBadge } from "@/components/event-cards";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

// Types for activities and participants
type SuggestedActivity = {
  id: string;
  activity_name: string;
  location: string;
  suggested_date?: string;
  duration?: string;
  cost?: string;
  image_url?: string;
  created_at?: string;
};

type Participant = {
  name: string;
  initials: string;
  photoUrl?: string | null;
};

type Vote = {
  suggested_activity_id: string;
  participant_initials: string;
  vote_type: 'up' | 'down';
};

type VoteWithName = Vote & { name: string };

export default function SuggestedActivitiesPage() {
  const [activities, setActivities] = useState<SuggestedActivity[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showVoteDialog, setShowVoteDialog] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<SuggestedActivity | null>(null);
  const [voteType, setVoteType] = useState<'up' | 'down' | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [votes, setVotes] = useState<VoteWithName[]>([]);
  const [showVotesDialog, setShowVotesDialog] = useState(false);
  const [votesDialogActivity, setVotesDialogActivity] = useState<SuggestedActivity | null>(null);
  const [userRole, setUserRole] = useState("viewer");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<SuggestedActivity | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<SuggestedActivity | null>(null);
  const [showAdminError, setShowAdminError] = useState(false);
  const [session, setSession] = useState<any>(null);
  const supabase = createBrowserClient();
  const participant = useCurrentParticipant();
  const [expandedDetails, setExpandedDetails] = useState<{ [key: string]: boolean }>({});

  // Fetch session on mount
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    fetchSession();
  }, [supabase]);

  // Fetch activities, participants, and votes
  useEffect(() => {
    async function fetchData() {
      const { data: activitiesData } = await supabase.from("suggested_activities").select("*");
      setActivities((activitiesData as SuggestedActivity[]) || []);
      // Fetch full participant profiles using correct field names
      const { data: participantsData } = await supabase.from("participants").select("participant_name, participants_initials, participant_photo_url");
      // Normalize participant data
      const normalizedParticipants: { name: string; initials: string; photoUrl: string | null }[] = (participantsData as any[] || []).map(p => ({
        name: p.participant_name,
        initials: p.participants_initials,
        photoUrl: p.participant_photo_url ?? null,
      }));
      setParticipants(normalizedParticipants);
      if (participant) {
        // Fetch all votes for all activities, join with participant names
        const { data: votesData } = await supabase
          .from("suggested_activity_votes")
          .select("suggested_activity_id, participant_initials, vote_type, participants(name)");
        // Map to include name
        setVotes(
          (votesData as any[] || []).map(v => ({
            suggested_activity_id: v.suggested_activity_id,
            participant_initials: v.participant_initials,
            vote_type: v.vote_type,
            name: v.participants?.name || v.participant_initials,
          }))
        );
      }
    }
    fetchData();
  }, [participant, supabase]);

  // Use Supabase session for role check
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!session?.user?.email) return;
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("email", session.user.email.toLowerCase().trim())
        .single();
      if (error) {
        console.error("Error fetching user role:", error);
        setUserRole("viewer");
        return;
      }
      setUserRole(roleData?.role || "viewer");
    };
    fetchUserRole();
  }, [session, supabase]);

  // Handler for voting
  const handleVote = async (activity: SuggestedActivity, type: 'up' | 'down') => {
    if (!participant) return;
    const existingVote = votes.find(
      (v) => v.suggested_activity_id === activity.id && v.participant_initials === participant.participants_initials
    );
    // If already voted the same way, remove the vote (toggle off)
    if (existingVote && existingVote.vote_type === type) {
      await supabase
        .from("suggested_activity_votes")
        .delete()
        .eq("suggested_activity_id", activity.id)
        .eq("participant_initials", participant.participants_initials);
      setVotes((prev) => prev.filter((v) => v.suggested_activity_id !== activity.id));
      return;
    }
    // Otherwise, upsert the new vote
    const participantName = participants.find(p => p.initials === participant.participants_initials)?.name || participant.participants_initials;
    await supabase.from("suggested_activity_votes").upsert([
      {
        suggested_activity_id: activity.id,
        participant_initials: participant.participants_initials,
        vote_type: type,
      },
    ], { onConflict: "suggested_activity_id,participant_initials" });
    setVotes((prev) => [
      ...prev.filter((v) => v.suggested_activity_id !== activity.id),
      { suggested_activity_id: activity.id, participant_initials: participant.participants_initials, vote_type: type, name: participantName },
    ]);
  };

  // Add handlers for edit and delete
  const handleEdit = async (activity: SuggestedActivity) => {
    setActivityToEdit(activity);
    setShowEditDialog(true);
  };

  const handleDelete = async (activity: SuggestedActivity) => {
    setActivityToDelete(activity);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!activityToDelete) return;
    try {
      const { error } = await supabase
        .from("suggested_activities")
        .delete()
        .eq("id", activityToDelete.id);
      
      if (error) throw error;
      
      setActivities(prev => prev.filter(a => a.id !== activityToDelete.id));
      toast.success("Activity deleted successfully");
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error("Failed to delete activity");
    } finally {
      setShowDeleteConfirm(false);
      setActivityToDelete(null);
    }
  };

  // Build the allParticipantProfiles map from normalized participants
  const allParticipantProfiles = new Map<string, { name: string; initials: string; photoUrl: string | null }>();
  (participants as { name: string; initials: string; photoUrl: string | null }[]).forEach((p) => {
    allParticipantProfiles.set(p.name, p);
  });

  return (
    <div className="space-y-2 px-1">
      {/* List of suggested activities */}
      {activities.map((activity) => {
        const userVote = participant
          ? votes.find(
              (v) => v.suggested_activity_id === activity.id && v.participant_initials === participant.participants_initials
            )
          : null;
        const upVotes = votes.filter(v => v.suggested_activity_id === activity.id && v.vote_type === 'up');
        const downVotes = votes.filter(v => v.suggested_activity_id === activity.id && v.vote_type === 'down');
        return (
          <div key={activity.id} className="border rounded-2xl shadow-lg p-0 flex flex-col bg-white overflow-hidden">
            {/* Pink ribbon header with admin controls */}
            <div className="w-full bg-accent-pink py-3 px-4 flex items-center justify-between">
              <span className="text-white text-xl font-bold flex-1">{activity.activity_name}</span>
              {userRole === "admin" ? (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-accent-pink/80"
                    onClick={() => handleEdit(activity)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-accent-pink/80"
                    onClick={() => handleDelete(activity)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white opacity-50 cursor-not-allowed"
                    onClick={() => setShowAdminError(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white opacity-50 cursor-not-allowed"
                    onClick={() => setShowAdminError(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            {/* Image */}
            {activity.image_url && (
              <div className="w-full aspect-[16/9] sm:aspect-[4/3] bg-white overflow-hidden flex items-center justify-center">
                <img
                  src={activity.image_url}
                  alt={activity.activity_name}
                  className="w-full h-full object-contain sm:object-cover"
                  style={{ aspectRatio: '16/9' }}
                />
              </div>
            )}
            {/* Details */}
            <div className="p-3">
              {/* Collapsible Details Section */}
              <div className="mb-4">
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-between p-1 hover:bg-gray-50 rounded-lg bg-accent-pink/5 min-h-0"
                  onClick={() => setExpandedDetails(prev => ({ ...prev, [activity.id]: !prev[activity.id] }))}
                >
                  <span className="font-semibold text-accent-pink text-lg">Additional Details</span>
                  {expandedDetails[activity.id] ? (
                    <ChevronUp className="h-5 w-5 text-accent-pink" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-accent-pink" />
                  )}
                </Button>
                {expandedDetails[activity.id] && (
                  <div className="mt-1 space-y-1 pl-1 max-w-md mx-auto bg-gray-50/50 rounded-lg p-2">
                    {activity.location && (
                      <div className="flex items-center gap-2 text-base">
                        <MapPin className="h-5 w-5 text-accent-pink flex-shrink-0" />
                        <span className="font-semibold text-accent-pink min-w-[80px]">Location:</span>
                        <span className="text-gray-600">{activity.location}</span>
                      </div>
                    )}
                    {activity.cost && (
                      <div className="flex items-center gap-2 text-base">
                        <DollarSign className="h-5 w-5 text-accent-pink flex-shrink-0" />
                        <span className="font-semibold text-accent-pink min-w-[80px]">Cost:</span>
                        <span className="text-gray-600">{activity.cost}</span>
                      </div>
                    )}
                    {activity.duration && (
                      <div className="flex items-center gap-2 text-base">
                        <Clock className="h-5 w-5 text-accent-pink flex-shrink-0" />
                        <span className="font-semibold text-accent-pink min-w-[80px]">Duration:</span>
                        <span className="text-gray-600">{activity.duration}</span>
                      </div>
                    )}
                    {activity.suggested_date && (
                      <div className="flex items-center gap-2 text-base">
                        <Calendar className="h-5 w-5 text-accent-pink flex-shrink-0" />
                        <span className="font-semibold text-accent-pink min-w-[80px]">Date:</span>
                        <span className="text-gray-600">{activity.suggested_date}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Voting */}
              <div className="flex flex-col items-center justify-center mt-2 mb-1">
                <div className="flex items-end gap-24 justify-center">
                  <div className="flex flex-col items-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleVote(activity, 'up')}
                      disabled={!participant}
                      className="flex flex-col items-center p-0 bg-transparent hover:bg-transparent focus:bg-transparent shadow-none border-none"
                      style={{ boxShadow: 'none', background: 'none', border: 'none' }}
                    >
                      <ThumbsUp 
                        className={cn('text-accent-pink', userVote?.vote_type === 'up' ? 'scale-110' : 'opacity-60')}
                        width={60} height={60}
                        style={{ width: 60, height: 60, minWidth: 60, minHeight: 60 }}
                      />
                    </Button>
                    <span className="mt-2 text-3xl font-bold text-accent-pink">{upVotes.length}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleVote(activity, 'down')}
                      disabled={!participant}
                      className="flex flex-col items-center p-0 bg-transparent hover:bg-transparent focus:bg-transparent shadow-none border-none"
                      style={{ boxShadow: 'none', background: 'none', border: 'none' }}
                    >
                      <ThumbsDown 
                        className={cn('text-accent-pink', userVote?.vote_type === 'down' ? 'scale-110' : 'opacity-60')}
                        width={60} height={60}
                        style={{ width: 60, height: 60, minWidth: 60, minHeight: 60 }}
                      />
                    </Button>
                    <span className="mt-2 text-3xl font-bold text-accent-pink">{downVotes.length}</span>
                  </div>
                </div>
                {/* View Votes button, only if user has voted */}
                {userVote && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="mt-8 text-accent-pink border-accent-pink mx-auto"
                    onClick={() => { setVotesDialogActivity(activity); setShowVotesDialog(true); }}
                  >
                    View Votes
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Invisible Card with More Activities Coming Soon */}
      <div className="border rounded-2xl shadow-lg p-0 flex flex-col bg-white overflow-hidden opacity-0">
        <div className="w-full bg-accent-pink py-2 px-4">
          <span className="text-white text-xl font-bold">More Activities Coming Soon</span>
        </div>
      </div>

      {/* Vote Dialog */}
      <Dialog open={showVoteDialog} onOpenChange={setShowVoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vote</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {participant ? (
              <Button className="w-full mt-2" onClick={() => setShowVoteDialog(true)}>
                Vote
              </Button>
            ) : (
              <div className="text-red-500">You must be logged in as a participant to vote.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Votes Dialog */}
      <Dialog open={showVotesDialog} onOpenChange={setShowVotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Votes for {votesDialogActivity?.activity_name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <span className="font-bold text-green-700">Upvotes ({votes.filter(v => v.suggested_activity_id === votesDialogActivity?.id && v.vote_type === 'up').length}):</span>
              <div className="flex flex-wrap gap-4 mt-4">
                {votes.filter(v => v.suggested_activity_id === votesDialogActivity?.id && v.vote_type === 'up').map(v => {
                  const participantProfile = participants.find(
                    p => p.initials?.trim().toLowerCase() === v.participant_initials?.trim().toLowerCase()
                  );
                  return (
                    <ParticipantBadge
                      key={v.participant_initials}
                      name={participantProfile ? participantProfile.name : v.participant_initials}
                      allParticipantProfiles={allParticipantProfiles}
                      size="large"
                    />
                  );
                })}
              </div>
            </div>
            <div>
              <span className="font-bold text-red-700">Downvotes ({votes.filter(v => v.suggested_activity_id === votesDialogActivity?.id && v.vote_type === 'down').length}):</span>
              <div className="flex flex-wrap gap-4 mt-4">
                {votes.filter(v => v.suggested_activity_id === votesDialogActivity?.id && v.vote_type === 'down').map(v => {
                  const participantProfile = participants.find(
                    p => p.initials?.trim().toLowerCase() === v.participant_initials?.trim().toLowerCase()
                  );
                  return (
                    <ParticipantBadge
                      key={v.participant_initials}
                      name={participantProfile ? participantProfile.name : v.participant_initials}
                      allParticipantProfiles={allParticipantProfiles}
                      size="large"
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Activity</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete "{activityToDelete?.activity_name}"? This action cannot be undone.</p>
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

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
          </DialogHeader>
          {activityToEdit && (
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              try {
                const { error } = await supabase
                  .from("suggested_activities")
                  .update({
                    activity_name: formData.get("activity_name"),
                    location: formData.get("location"),
                    suggested_date: formData.get("suggested_date"),
                    duration: formData.get("duration"),
                    cost: formData.get("cost"),
                  })
                  .eq("id", activityToEdit.id);
                
                if (error) throw error;
                
                setActivities(prev => prev.map(a => 
                  a.id === activityToEdit.id 
                    ? { ...a, ...Object.fromEntries(formData) }
                    : a
                ));
                toast.success("Activity updated successfully");
                setShowEditDialog(false);
              } catch (error) {
                console.error("Error updating activity:", error);
                toast.error("Failed to update activity");
              }
            }}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="activity_name">Activity Name</Label>
                  <Input
                    id="activity_name"
                    name="activity_name"
                    defaultValue={activityToEdit.activity_name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    defaultValue={activityToEdit.location}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="suggested_date">Suggested Date</Label>
                  <Input
                    id="suggested_date"
                    name="suggested_date"
                    type="date"
                    defaultValue={activityToEdit.suggested_date}
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    name="duration"
                    defaultValue={activityToEdit.duration}
                  />
                </div>
                <div>
                  <Label htmlFor="cost">Cost</Label>
                  <Input
                    id="cost"
                    name="cost"
                    defaultValue={activityToEdit.cost}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Save Changes
                  </Button>
                </div>
              </div>
            </form>
          )}
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
    </div>
  );
} 