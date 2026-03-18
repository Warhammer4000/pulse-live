import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  RotateCcw,
  Eye,
  EyeOff,
  ArrowLeft,
  Maximize,
  Minimize,
  Users,
  Timer,
  Square,
  Play,
  Pause,
} from "lucide-react";
import { StopCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Tables } from "@/integrations/supabase/types";
import { BarChartViz } from "@/components/visualizations/BarChartViz";
import { WordCloudViz } from "@/components/visualizations/WordCloudViz";
import { ResponseFeed } from "@/components/visualizations/ResponseFeed";
import { cn } from "@/lib/utils";

type SessionRow = Tables<"sessions">;
type SlideRow = Tables<"slides">;
type ResponseRow = Tables<"responses">;

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number;
}

function PresenterFloatingReactions({ sessionId }: { sessionId: string }) {
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel(`presenter-reactions-${sessionId}`)
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        const newEmoji: FloatingEmoji = {
          id: crypto.randomUUID(),
          emoji: payload.emoji,
          x: 5 + Math.random() * 15,
        };
        setEmojis((prev) => [...prev.slice(-30), newEmoji]);
        setTimeout(() => {
          setEmojis((prev) => prev.filter((e) => e.id !== newEmoji.id));
        }, 3000);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {emojis.map((e) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 1, y: "80vh", x: `${e.x}vw`, scale: 0.8 }}
            animate={{ opacity: 0, y: "10vh", scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="absolute text-2xl"
          >
            {e.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function useStopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const toggle = () => setRunning((r) => !r);
  const reset = () => {
    setRunning(false);
    setElapsed(0);
  };

  return { elapsed, running, toggle, reset };
}

function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  return { isFullscreen, toggle };
}

function useParticipantCount(sessionId: string | undefined) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!sessionId) return;

    // Get unique participant count from responses
    const fetchCount = async () => {
      const { data, error } = await supabase
        .from("responses")
        .select("participant_id")
        .eq("session_id", sessionId);
      if (!error && data) {
        const unique = new Set(data.map((r) => r.participant_id));
        setCount(unique.size);
      }
    };

    fetchCount();

    // Listen for new responses to update count
    const channel = supabase
      .channel(`participants-${sessionId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "responses",
        filter: `session_id=eq.${sessionId}`,
      }, () => {
        fetchCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId!)
        .single();
      if (error) throw error;
      return data as SessionRow;
    },
    enabled: !!sessionId,
  });

  const { data: slides = [] } = useQuery({
    queryKey: ["session-slides", session?.presentation_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("slides")
        .select("*")
        .eq("presentation_id", session!.presentation_id)
        .order("order");
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
      const { data, error } = await supabase
        .from("responses")
        .select("*")
        .eq("session_id", sessionId!)
        .eq("slide_id", activeSlide!.id);
      if (error) throw error;
      return data as ResponseRow[];
    },
    enabled: !!sessionId && !!activeSlide?.id,
  });

  // Realtime subscription for responses
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`responses-${sessionId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "responses",
        filter: `session_id=eq.${sessionId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["responses", sessionId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, queryClient]);

  const navigateSlide = useCallback(async (direction: "prev" | "next") => {
    if (!session || slides.length === 0) return;
    const newIndex = direction === "next"
      ? Math.min(activeIndex + 1, slides.length - 1)
      : Math.max(activeIndex - 1, 0);

    await supabase
      .from("sessions")
      .update({ active_slide_id: slides[newIndex].id })
      .eq("id", session.id);

    queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
  }, [session, slides, activeIndex, sessionId, queryClient]);

  const jumpToSlide = async (slideId: string) => {
    if (!session) return;
    await supabase
      .from("sessions")
      .update({ active_slide_id: slideId })
      .eq("id", session.id);
    queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
  };

  const toggleVotingLock = async () => {
    if (!session) return;
    await supabase
      .from("sessions")
      .update({ voting_locked: !session.voting_locked })
      .eq("id", session.id);
    queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
  };

  const resetResults = async () => {
    if (!sessionId || !activeSlide) return;
    await supabase
      .from("responses")
      .delete()
      .eq("session_id", sessionId)
      .eq("slide_id", activeSlide.id);
    queryClient.invalidateQueries({ queryKey: ["responses", sessionId] });
  };

  const endSession = async () => {
    if (!session) return;
    await supabase
      .from("sessions")
      .update({ is_active: false })
      .eq("id", session.id);
    navigate("/dashboard");
  };

  // Keyboard navigation
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const options: string[] = activeSlide.options
    ? (Array.isArray(activeSlide.options) ? activeSlide.options as string[] : JSON.parse(String(activeSlide.options)))
    : [];

  return (
    <div className="flex h-screen flex-col bg-background">
      <PresenterFloatingReactions sessionId={session.id} />
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border/30 bg-card/30 backdrop-blur-xl px-4 py-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Exit
          </Button>
          <div className="h-5 w-px bg-border/50" />
          {/* Participant count */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span className="font-mono font-medium">{participantCount}</span>
            <span className="hidden sm:inline">participant{participantCount !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Center: Timer */}
        <div className="flex items-center gap-1.5">
          <div className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-sm transition-colors",
            stopwatch.running
              ? "border-primary/30 bg-primary/5 text-primary"
              : "border-border/50 bg-card/50 text-muted-foreground"
          )}>
            <Timer className="h-3.5 w-3.5" />
            <span className="w-[3.5ch] tabular-nums font-semibold">{formatTime(stopwatch.elapsed)}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={stopwatch.toggle}>
            {stopwatch.running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={stopwatch.reset} disabled={stopwatch.elapsed === 0}>
            <Square className="h-3 w-3" />
          </Button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={toggleVotingLock}>
            {session.voting_locked ? <Lock className="mr-1 h-3 w-3" /> : <Unlock className="mr-1 h-3 w-3" />}
            {session.voting_locked ? "Locked" : "Open"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowResults((v) => !v)}>
            {showResults ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
            Results
          </Button>
          <Button variant="ghost" size="sm" onClick={resetResults}>
            <RotateCcw className="mr-1 h-3 w-3" /> Reset
          </Button>
          <div className="h-5 w-px bg-border/50 mx-1" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <StopCircle className="mr-1 h-3 w-3" /> End
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End this session?</AlertDialogTitle>
                <AlertDialogDescription className="font-body">
                  This will disconnect all audience members and mark the session as complete. Responses are saved and you can review them later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={endSession} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  End Session
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="h-5 w-px bg-border/50 mx-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main visualization area */}
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
            className="w-full max-w-4xl text-center"
          >
            <h2 className="mb-8 text-5xl font-semibold tracking-tight" style={{ textWrap: "balance" as any }}>
              {activeSlide.question || "Waiting for question..."}
            </h2>

            {showResults && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                {activeSlide.type === "multiple_choice" && (
                  <BarChartViz options={options} responses={responses} />
                )}
                {activeSlide.type === "word_cloud" && (
                  <WordCloudViz responses={responses} />
                )}
                {activeSlide.type === "open_text" && (
                  <ResponseFeed responses={responses} />
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer with join info + slide thumbnails + navigation */}
      <div className="border-t border-border/30 bg-card/50 backdrop-blur-xl">
        {/* Slide thumbnail strip */}
        {slides.length > 1 && (
          <div className="border-b border-border/20 px-6 py-2">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  onClick={() => jumpToSlide(slide.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    slide.id === activeSlide.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span className="font-mono">{i + 1}</span>
                  <span className="max-w-[80px] truncate hidden sm:inline">
                    {slide.question || "Untitled"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <QRCodeSVG
              value={`${window.location.origin}/join/${session.join_code}`}
              size={80}
              bgColor="transparent"
              fgColor="hsl(var(--foreground))"
              level="M"
            />
            <div>
              <p className="text-xs text-muted-foreground">Join at</p>
              <p className="text-sm font-medium">{window.location.origin}/join/{session.join_code}</p>
              <p className="font-mono text-4xl font-bold tracking-widest text-primary mt-1">
                {session.join_code}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Response count badge */}
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <span className="font-mono">{responses.length}</span>
              <span>response{responses.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-muted-foreground">
                {activeIndex + 1} / {slides.length}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateSlide("prev")}
                disabled={activeIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateSlide("next")}
                disabled={activeIndex === slides.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
