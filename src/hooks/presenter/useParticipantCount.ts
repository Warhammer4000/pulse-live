import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useParticipantCount(sessionId: string | undefined) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!sessionId) return;

    const fetchCount = async () => {
      const { data } = await supabase
        .from("responses")
        .select("participant_id")
        .eq("session_id", sessionId);
      if (data) setCount(new Set(data.map((r) => r.participant_id)).size);
    };

    fetchCount();

    const ch = supabase
      .channel(`participants-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "responses", filter: `session_id=eq.${sessionId}` },
        fetchCount,
      )
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [sessionId]);

  return count;
}
