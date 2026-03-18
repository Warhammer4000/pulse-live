import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Lock, Unlock, RotateCcw, Eye, EyeOff,
  ArrowLeft, Maximize, Minimize, Users, Timer, Square, Play, Pause, StopCircle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Tables } from "@/integrations/supabase/types";
import { BarChartViz } from "@/components/visualizations/BarChartViz";
import { WordCloudViz } from "@/components/visualizations/WordCloudViz";
import { ResponseFeed } from "@/components/visualizations/ResponseFeed";
import { cn } from "@/lib/utils";

type SessionRow = Tables<"sessions">;
type SlideRow = Tables<"slides">;
type ResponseRow = Tables<"responses">;

interface FloatingEmoji { id: string; emoji: string; x: number; }

function PresenterFloatingReactions({ sessionId }: { sessionId: string }) {
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);
  useEffect(() => {
    const channel = supabase.channel(`presenter-reactions-${sessionId}`)
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        const e: FloatingEmoji = { id: crypto.randomUUID(), emoji: payload.emoji, x: 5 + Math.random() * 15 };
        setEmojis((prev) => [...prev.slice(-30), e]);
        setTimeout(() => setEmojis((prev) => prev.filter((x) => x.id !== e.id)), 3000);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {emojis.map((e) => (
          <motion.div key={e.id} initial={{ opacity: 1, y: "80vh", x: `${e.x}vw`, scale: 0.8 }}
            animate={{ opacity: 0, y: "10vh", scale: 1.2 }} exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: "easeOut" }} className="absolute text-2xl">
            {e.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function formatTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

function useStopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (running) { ref.current = setInterval(() => setElapsed((e) => e + 1), 1000); }
    else if (ref.current) clearInterval(ref.current);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);
  return { elapsed, running, toggle: () => setRunning((r) => !r), reset: () => { setRunning(false); setElapsed(0); } };
}

function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggle = async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  };
  return { isFullscreen, toggle };
}

function useParticipantCount(sessionId: string | undefined) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!sessionId) return;
    const fetch = async () => {
      const { data } = await supabase.from("responses").select("participant_id").eq("session_id", sessionId);
      if (data) setCount(new Set(data.map((r) => r.participant_id)).size);
    };
    fetch();
    const ch = supabase.channel(`participants-${sessionId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "responses", filter: `session_id=eq.${sessionId}` }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [sessionId]);
  return count;
}

export default function PresenterView() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showResults, setShowResults] = useState(true);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const stopwatch = useStopwatch();
  const participantCount = useParticipantCount(sessionId);

  const { data: session } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase.from("sessions").select("*").eq("id", sessionId!).single();
      if (error) throw error;
      return data as SessionRow;
    },
    enabled: !!sessionId,
  });

  const { data: slides = [] } = useQuery({
    queryKey: ["session-slides", session?.presentation_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("slides").select("*").eq("presentation_id", session!.presentation_id).order("order");
      if (error) throw error;
      return data as SlideRow[];
    },
    enabled: !!session?.presentation_id,
  });

  const activeSlide = slides.find((s) => s.id === session?.active_slide_id);
  const activeIndex = slides.findIndex((s) => s.id === session?.active_slide_id);

  const { data: responses = [] } = useQuery({
    queryKey: ["responses", sessionId, activeSlide?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("responses").select("*").eq("session_id", sessionId!).eq("slide_id", activeSlide!.id);
      if (error) throw error;
      return data as ResponseRow[];
    },
    enabled: !!sessionId && !!activeSlide?.id,
  });

  useEffect(() => {
    if (!sessionId) return;
    const ch = supabase.channel(`responses-${sessionId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "responses", filter: `session_id=eq.${sessionId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["responses", sessionId] });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [sessionId, queryClient]);

  const navigateSlide = useCallback(async (direction: "prev" | "next") => {
    if (!session || slides.length === 0) return;
    const newIndex = direction === "next" ? Math.min(activeIndex + 1, slides.length - 1) : Math.max(activeIndex - 1, 0);
    await supabase.from("sessions").update({ active_slide_id: slides[newIndex].id }).eq("id", session.id);
    queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
  }, [session, slides, activeIndex, sessionId, queryClient]);

  const jumpToSlide = async (slideId: string) => {
    if (!session) return;
    await supabase.from("sessions").update({ active_slide_id: slideId }).eq("id", session.id);
    queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
  };

  const toggleVotingLock = async () => {
    if (!session) return;
    await supabase.from("sessions").update({ voting_locked: !session.voting_locked }).eq("id", session.id);
    queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
  };

  const resetResults = async () => {
    if (!sessionId || !activeSlide) return;
    await supabase.from("responses").delete().eq("session_id", sessionId).eq("slide_id", activeSlide.id);
    queryClient.invalidateQueries({ queryKey: ["responses", sessionId] });
  };

  const endSession = async () => {
    if (!session) return;
    await supabase.from("sessions").update({ is_active: false }).eq("id", session.id);
    navigate("/dashboard");
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") navigateSlide("next");
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") navigateSlide("prev");
      if (e.key === " ") { e.preventDefault(); setShowResults((v) => !v); }
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigateSlide, toggleFullscreen]);

  if (!session || !activeSlide) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080810]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  const options: string[] = activeSlide.options
    ? (Array.isArray(activeSlide.options) ? activeSlide.options as string[] : JSON.parse(String(activeSlide.options)))
    : [];

  return (
    <div className="flex h-screen flex-col bg-[#080810] text-white">
      <PresenterFloatingReactions sessionId={session.id} />

      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/5 bg-[#080810]/90 backdrop-blur-xl px-4 py-2 shrink-0">
        {/* Left */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-white/50 hover:text-white hover:bg-white/8 h-8 px-2 text-xs"
            onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Exit
          </Button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-1.5 text-sm text-white/50">
            <Users className="h-3.5 w-3.5" />
            <span className="font-mono font-medium text-white">{participantCount}</span>
            <span className="hidden sm:inline text-xs">participant{participantCount !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Center: stopwatch */}
        <div className="flex items-center gap-1">
          <div className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-sm transition-colors",
            stopwatch.running ? "border-violet-500/30 bg-violet-500/10 text-violet-400" : "border-white/8 bg-white/5 text-white/40"
          )}>
            <Timer className="h-3.5 w-3.5" />
            <span className="tabular-nums font-semibold">{formatTime(stopwatch.elapsed)}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/8" onClick={stopwatch.toggle}>
            {stopwatch.running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/8" onClick={stopwatch.reset} disabled={stopwatch.elapsed === 0}>
            <Square className="h-3 w-3" />
          </Button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-white/50 hover:text-white hover:bg-white/8" onClick={toggleVotingLock}>
            {session.voting_locked ? <Lock className="mr-1 h-3 w-3" /> : <Unlock className="mr-1 h-3 w-3" />}
            {session.voting_locked ? "Locked" : "Open"}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-white/50 hover:text-white hover:bg-white/8" onClick={() => setShowResults((v) => !v)}>
            {showResults ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
            Results
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-white/50 hover:text-white hover:bg-white/8" onClick={resetResults}>
            <RotateCcw className="mr-1 h-3 w-3" /> Reset
          </Button>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10">
                <StopCircle className="mr-1 h-3 w-3" /> End
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#0f0f1a] border-white/10 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">End this session?</AlertDialogTitle>
                <AlertDialogDescription className="text-white/50">
                  This will disconnect all audience members. Responses are saved and reviewable in analytics.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={endSession} className="bg-red-600 hover:bg-red-500 text-white border-0">End Session</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/8" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main visualization */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={activeSlide.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
            className="w-full max-w-4xl text-center">
            <h2 className="mb-8 text-5xl font-semibold tracking-tight text-white" style={{ textWrap: "balance" as any }}>
              {activeSlide.question || "Waiting for question..."}
            </h2>
            {showResults && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.3 }}>
                {activeSlide.type === "multiple_choice" && <BarChartViz options={options} responses={responses} />}
                {activeSlide.type === "word_cloud" && <WordCloudViz responses={responses} />}
                {activeSlide.type === "open_text" && <ResponseFeed responses={responses} />}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 bg-[#080810]/90 backdrop-blur-xl shrink-0">
        {/* Slide strip */}
        {slides.length > 1 && (
          <div className="border-b border-white/5 px-4 py-2">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {slides.map((slide, i) => (
                <button key={slide.id} onClick={() => jumpToSlide(slide.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    slide.id === activeSlide.id
                      ? "bg-violet-600 text-white shadow-sm shadow-violet-900/40"
                      : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                  )}>
                  <span className="font-mono">{i + 1}</span>
                  <span className="max-w-[80px] truncate hidden sm:inline">{slide.question || "Untitled"}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-6 py-4">
          {/* QR + join info */}
          <div className="flex items-center gap-5">
            <div className="rounded-xl overflow-hidden bg-white p-1.5">
              <QRCodeSVG
                value={`${window.location.origin}/join/${session.join_code}`}
                size={72}
                bgColor="#ffffff"
                fgColor="#080810"
                level="M"
              />
            </div>
            <div>
              <p className="text-xs text-white/40 mb-0.5">Join at</p>
              <p className="text-sm text-white/60">{window.location.origin}/join</p>
              <p className="font-mono text-4xl font-bold tracking-widest text-white mt-0.5">
                {session.join_code}
              </p>
            </div>
          </div>

          {/* Nav + response count */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1 text-sm font-medium text-violet-400">
              <span className="font-mono">{responses.length}</span>
              <span>response{responses.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-white/30">{activeIndex + 1} / {slides.length}</span>
              <Button size="icon" className="h-9 w-9 bg-white/5 hover:bg-white/10 text-white border border-white/8"
                onClick={() => navigateSlide("prev")} disabled={activeIndex === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="icon" className="h-9 w-9 bg-white/5 hover:bg-white/10 text-white border border-white/8"
                onClick={() => navigateSlide("next")} disabled={activeIndex === slides.length - 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
