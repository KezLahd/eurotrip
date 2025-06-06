"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase-client";

export interface CurrentParticipant {
  id: number;
  participants_initials: string;
  participant_name: string;
  participant_photo_url?: string;
  email: string;
}

const CurrentParticipantContext = createContext<CurrentParticipant | null>(null);

export function useCurrentParticipant() {
  return useContext(CurrentParticipantContext);
}

export function CurrentParticipantProvider({ children }: { children: React.ReactNode }) {
  const [participant, setParticipant] = useState<CurrentParticipant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParticipant = async () => {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email;
      if (email) {
        const { data } = await supabase
          .from("participants")
          .select("*")
          .eq("email", email)
          .single();
        setParticipant(data || null);
      }
      setLoading(false);
    };
    fetchParticipant();
  }, []);

  if (loading) return null;
  return (
    <CurrentParticipantContext.Provider value={participant}>
      {children}
    </CurrentParticipantContext.Provider>
  );
} 