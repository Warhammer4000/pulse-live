import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Wifi } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { BarChartViz } from "@/components/visualizations/BarChartViz";
import { WordCloudViz } from "@/components/visualizations/WordCloudViz";
import { ResponseFeed } from "@/components/visualizations/ResponseFeed";

type SessionRow = Tables<"sessions">;
type SlideRow = Tables<"slides">;
type ResponseRow = Tables<"responses">;

function getParticipantId(): string {
  let id = localStorage.getItem("pulse_participant_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("pulse_participant_id", id); }
  return id;
}

const REACTION_EMOJIS = ["👍", "❤️", "🔥", "😂", "🎉", "👏"];
interface FloatingEmoji { id: string; emoji: string; x: number; }

function FloatingReactions({ sessionId }: { sessionId: string }) {
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);
  useEffect(() => {
    const channel = supabase.channel(`reactions-${sessionId}`)
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        const e: FloatingEmoji = { id: crypto.randomUUID(), emoji: payload.emoji, x: 20 + Math.random() * 60 };
        setEmojis((prev) => [...prev.slice(-20), e]);
        setTimeout(() => setEmojis((prev) => prev.filter((x) => x.id !== e.id)), 2500);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {emojis.map((e) => (
          <motion.div key={e.id} initial={{ opacity: 1, y: "100vh", x: `${e.x}vw`, scale: 1 }}
            animate={{ opacity: 0, y: "-10vh", scale: 1.5 }} exit={{ opacity: 0 }}
            transition={{ duration: 2.5, ease: "easeOut" }} className="absolute text-3xl">
            {e.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function EmojiBar({ sessionId }: { sessionId: string }) {
  const [cooldown, setCooldown] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  useEffect(() => {
    channelRef.current = supabase.channel(`reactions-${sessionId}`);
    channelRef.current.subscribe();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [sessionId]);
  const sendReaction = (emoji: string) => {
    if (cooldown || !channelRef.current) return;
    channelRef.current.send({ type: "broadcast", event: "reaction", payload: { emoji } });
    if (navigator.vibrate) navigator.vibrate(30);
    setCooldown(true);
    setTimeout(() => setCooldown(false), 500);
  };
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {REACTION_EMOJIS.map((emoji) => (
        <motion.button key={emoji} whileTap={{ scale: 1.4 }} onClick={() => sendReaction(emoji)} disabled={cooldown}
          className={cn("flex h-11 w-11 items-center justify-center rounded-full bg-white/5 border border-white/8 text-xl transition-all hover:bg-white/10", cooldown && "opacity-50")}>
          {emoji}
        </motion.button>
      ))}
    </div>
  );
}

export default function LiveSession() {
  const { code } = useParams<{ code: string }>();
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textResponse, setTextResponse] = useState("");

  const { data: session } = useQuery({
    queryKey: ["live-session", code],
    queryFn: async () => {
      const { data, error } = await supabase.from("sessions").select("*").eq("join_code", code!).eq("is_active", true).single();
      if (error) throw error;
      return data as SessionRow;
    },
    enabled: !!code,
  });

  const { data: activeSlide } = useQuery({
    queryKey: ["live-slide", session?.active_slide_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("slides").select("*").eq("id", session!.active_slide_id!).single();
      if (error) throw error;
      return data as SlideRow;
    },
    enabled: !!session?.active_slide_id,
  });

  const { data: responses = [] } = useQuery({
    queryKey: ["live-responses", session?.id, activeSlide?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("responses").select("*").eq("session_id", session!.id).eq("slide_id", activeSlide!.id);
      if (error) throw error;
      return data as ResponseRow[];
    },
    enabled: !!session?.id && !!activeSlide?.id,
    refetchInterval: () => {
      const key = activeSlide ? `${activeSlide.id}-${getParticipantId()}` : "";
      return submitted[key] ? 3000 : false;
    },
  });

  useEffect(() => {
    if (!session?.id) return;
    const ch = supabase.channel(`session-${session.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${session.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["live-session", code] });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session?.id, code, queryClient]);

  useEffect(() => {
    if (!session?.id) return;
    const ch = supabase.channel(`live-resp-${session.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "responses", filter: `session_id=eq.${session.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["live-responses", session.id] });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session?.id, queryClient]);

  useEffect(() => {
    if (activeSlide?.id) {
      const key = `${activeSlide.id}-${getParticipantId()}`;
      if (!submitted[key]) { setSelectedOption(null); setTextResponse(""); }
    }
  }, [activeSlide?.id]);

  const submitMutation = useMutation({
    mutationFn: async (value: string) => {
      const { error } = await supabase.from("responses").insert({
        session_id: session!.id, slide_id: activeSlide!.id, participant_id: getParticipantId(), value,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      const key = `${activeSlide!.id}-${getParticipantId()}`;
      setSubmitted((prev) => ({ ...prev, [key]: true }));
      if (navigator.vibrate) navigator.vibrate(50);
      queryClient.invalidateQueries({ queryKey: ["live-responses", session!.id, activeSlide!.id] });
    },
  });

  const isSubmitted = activeSlide ? submitted[`${activeSlide.id}-${getParticipantId()}`] : false;

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#080810] px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <motion.div className="h-16 w-16 rounded-full border-2 border-violet-500/30"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Wifi className="h-6 w-6 text-violet-400" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white">Connecting to session...</h2>
          <p className="mt-2 text-sm text-white/40">
            Looking for an active session with code <span className="font-mono font-bold text-violet-400">{code}</span>
          </p>
        </motion.div>
      </div>
    );
  }

  if (!activeSlide || !session.active_slide_id) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#080810] px-4">
        <FloatingReactions sessionId={session.id} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center">
          <div className="relative mb-8">
            {[0, 1, 2].map((i) => (
              <motion.div key={i} className="absolute inset-0 rounded-full border border-violet-500/20"
                style={{ margin: `-${i * 12}px` }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }} />
            ))}
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/10 border border-violet-500/20">
              <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-3xl">🎤</motion.span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Waiting for presenter</h2>
          <p className="mt-2 text-white/40 text-sm max-w-xs">The first question will appear automatically when the presenter starts.</p>
          <motion.div className="mt-6 flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-400"
            animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            You're connected
          </motion.div>
          <div className="mt-6"><EmojiBar sessionId={session.id} /></div>
        </motion.div>
      </div>
    );
  }

  const options: string[] = activeSlide.options
    ? (Array.isArray(activeSlide.options) ? activeSlide.options as string[] : JSON.parse(String(activeSlide.options)))
    : [];

  return (
    <div className="flex min-h-screen flex-col bg-[#080810] text-white">
      <FloatingReactions sessionId={session.id} />
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <span className="text-sm font-bold text-white">
          Pulse<span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Live</span>
        </span>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Connected
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={activeSlide.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
            className="w-full max-w-lg">
            <h2 className="mb-6 text-center text-2xl font-semibold tracking-tight text-white" style={{ textWrap: "balance" as any }}>
              {activeSlide.question}
            </h2>

            {session.voting_locked ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10">
                  <span className="text-2xl">🔒</span>
                </div>
                <p className="text-lg font-medium text-white">Voting is locked</p>
                <p className="text-sm text-white/40">Wait for the presenter to open voting</p>
              </motion.div>
            ) : isSubmitted ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 py-3 text-emerald-400">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Response submitted!</span>
                </motion.div>
                <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
                  <p className="mb-4 text-center text-xs font-medium text-white/40 uppercase tracking-widest">Live Results</p>
                  {activeSlide.type === "multiple_choice" && <BarChartViz options={options} responses={responses} />}
                  {activeSlide.type === "word_cloud" && <WordCloudViz responses={responses} />}
                  {activeSlide.type === "open_text" && <ResponseFeed responses={responses} />}
                </div>
              </motion.div>
            ) : (
              <>
                {activeSlide.type === "multiple_choice" && (
                  <div className="space-y-3">
                    {options.map((opt, i) => (
                      <motion.button key={i} whileTap={{ scale: 0.98 }}
                        onClick={() => { setSelectedOption(opt); submitMutation.mutate(opt); }}
                        disabled={submitMutation.isPending}
                        className={cn("flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition-all",
                          selectedOption === opt ? "border-violet-500/50 bg-violet-500/10" : "border-white/8 bg-white/5 hover:border-white/15 hover:bg-white/8")}>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-sm font-mono font-bold text-white">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-lg font-medium text-white">{opt}</span>
                      </motion.button>
                    ))}
                  </div>
                )}
                {activeSlide.type === "word_cloud" && (
                  <form onSubmit={(e) => { e.preventDefault(); if (textResponse.trim()) submitMutation.mutate(textResponse.trim()); }} className="space-y-4">
                    <Input value={textResponse} onChange={(e) => setTextResponse(e.target.value)}
                      placeholder="Type a word or short phrase..." maxLength={50}
                      className="h-14 text-lg text-center bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-violet-500/30 focus-visible:border-violet-500/50" />
                    <Button type="submit" className="w-full h-14 text-base bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-lg shadow-violet-900/40"
                      disabled={!textResponse.trim() || submitMutation.isPending}>Submit</Button>
                  </form>
                )}
                {activeSlide.type === "open_text" && (
                  <form onSubmit={(e) => { e.preventDefault(); if (textResponse.trim()) submitMutation.mutate(textResponse.trim()); }} className="space-y-4">
                    <Textarea value={textResponse} onChange={(e) => setTextResponse(e.target.value)}
                      placeholder="Type your response..."
                      className="min-h-[120px] text-base bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-violet-500/30 focus-visible:border-violet-500/50" />
                    <Button type="submit" className="w-full h-14 text-base bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-lg shadow-violet-900/40"
                      disabled={!textResponse.trim() || submitMutation.isPending}>Submit</Button>
                  </form>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="border-t border-white/5 bg-[#080810]">
        <EmojiBar sessionId={session.id} />
      </div>
    </div>
  );
}
