import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FloatingReactions } from "./FloatingReactions";
import { EmojiBar } from "./EmojiBar";
import { SlideContent } from "./SlideContent";
import { getParticipantId, resolveOptions } from "./utils";
import type { SessionRow, SlideRow, ResponseRow } from "./types";

export default function LiveSessionPage() {
  const { code } = useParams<{ code: string }>();
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textResponse, setTextResponse] = useState("");

  const { data: session } = useQuery({
    queryKey: ["live-session", code],
    queryFn: async () => {
      const { data, error } = await supabase.from("sessions").select("*").eq("join_code", code).eq("is_active", true).single();
      if (error) throw error;
      return data as SessionRow;
    },
    enabled: !!code,
  });

  const { data: activeSlide } = useQuery({
    queryKey: ["live-slide", session?.active_slide_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("slides").select("*").eq("id", session.active_slide_id).single();
      if (error) throw error;
      return data as SlideRow;
    },
    enabled: !!session?.active_slide_id,
  });

  const { data: responses = [] } = useQuery({
    queryKey: ["live-responses", session?.id, activeSlide?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("responses").select("*")
        .eq("session_id", session.id).eq("slide_id", activeSlide.id);
      if (error) throw error;
      return data as ResponseRow[];
    },
    enabled: !!session?.id && !!activeSlide?.id,
    refetchInterval: () => {
      const key = activeSlide ? `${activeSlide.id}-${getParticipantId()}` : "";
      return submitted[key] ? 3000 : false;
    },
  });

  // Realtime: session updates (slide changes, voting lock)
  useEffect(() => {
    if (!session?.id) return;
    const ch = supabase.channel(`session-${session.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${session.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["live-session", code] });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session?.id, code, queryClient]);

  // Realtime: new responses
  useEffect(() => {
    if (!session?.id) return;
    const ch = supabase.channel(`live-resp-${session.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "responses", filter: `session_id=eq.${session.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["live-responses", session.id, activeSlide?.id] });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session?.id, queryClient]);

  // Reset input state when slide changes
  useEffect(() => {
    if (activeSlide?.id) {
      const key = `${activeSlide.id}-${getParticipantId()}`;
      if (!submitted[key]) { setSelectedOption(null); setTextResponse(""); }
    }
  }, [activeSlide?.id]);

  const submitMutation = useMutation({
    mutationFn: async (value: string) => {
      const { error } = await supabase.from("responses").insert({
        session_id: session.id, slide_id: activeSlide.id, participant_id: getParticipantId(), value,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      const key = `${activeSlide.id}-${getParticipantId()}`;
      setSubmitted((prev) => ({ ...prev, [key]: true }));
      if (navigator.vibrate) navigator.vibrate(50);
      queryClient.invalidateQueries({ queryKey: ["live-responses", session.id, activeSlide.id] });
    },
  });

  const handleSelectOption = (opt: string) => {
    setSelectedOption(opt);
    submitMutation.mutate(opt);
  };

  const isSubmitted = activeSlide ? submitted[`${activeSlide.id}-${getParticipantId()}`] : false;

  // — Connecting state —
  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#080810] px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <motion.div className="h-16 w-16 rounded-full border-2 border-primary/30"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Wifi className="h-6 w-6 accent-text" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white">Connecting to session...</h2>
          <p className="mt-2 text-sm text-white/40">
            Looking for an active session with code{" "}
            <span className="font-mono font-bold accent-text">{code}</span>
          </p>
        </motion.div>
      </div>
    );
  }

  // — Waiting for presenter —
  if (!activeSlide || !session.active_slide_id) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#080810] px-4">
        <FloatingReactions sessionId={session.id} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center">
          <div className="relative mb-8">
            {[0, 1, 2].map((i) => (
              <motion.div key={i} className="absolute inset-0 rounded-full border border-primary/20"
                style={{ margin: `-${i * 12}px` }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }} />
            ))}
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full accent-surface accent-border border">
              <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-3xl">🎤</motion.span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Waiting for presenter</h2>
          <p className="mt-2 text-white/40 text-sm max-w-xs">The first question will appear automatically when the presenter starts.</p>
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}
            className="mt-6 flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {" "}You're connected
          </motion.div>
          <div className="mt-6"><EmojiBar sessionId={session.id} /></div>
        </motion.div>
      </div>
    );
  }

  // — Active slide —
  const options = resolveOptions(activeSlide.options);

  return (
    <div className="flex min-h-screen flex-col bg-[#080810] text-white">
      <FloatingReactions sessionId={session.id} />

      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <span className="text-sm font-bold text-white">
          Pulse<span className="accent-gradient-text">Live</span>
        </span>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {" "}Connected
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={activeSlide.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
            className="w-full max-w-lg">
            <SlideContent
              showHeader
              votingLocked={!!session.voting_locked}
              isSubmitted={isSubmitted}
              activeSlide={activeSlide}
              options={options}
              responses={responses}
              selectedOption={selectedOption}
              textResponse={textResponse}
              isPending={submitMutation.isPending}
              onSelectOption={handleSelectOption}
              onTextChange={setTextResponse}
              onSubmitText={(val) => submitMutation.mutate(val)}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="border-t border-white/5 bg-[#080810]">
        <EmojiBar sessionId={session.id} />
      </div>
    </div>
  );
}
