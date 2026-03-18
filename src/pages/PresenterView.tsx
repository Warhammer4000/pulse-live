import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Lock, Unlock, RotateCcw, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Tables } from "@/integrations/supabase/types";
import { BarChartViz } from "@/components/visualizations/BarChartViz";
import { WordCloudViz } from "@/components/visualizations/WordCloudViz";
import { ResponseFeed } from "@/components/visualizations/ResponseFeed";

type SessionRow = Tables<"sessions">;
type SlideRow = Tables<"slides">;
type ResponseRow = Tables<"responses">;

export default function PresenterView() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showResults, setShowResults] = useState(true);

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

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") navigateSlide("next");
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") navigateSlide("prev");
      if (e.key === " ") { e.preventDefault(); setShowResults((v) => !v); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigateSlide]);

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
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Exit
        </Button>
        <div className="flex items-center gap-2">
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
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
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

      {/* Footer with join info + navigation */}
      <div className="border-t border-border/30 bg-card/50 backdrop-blur-xl">
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

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
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
  );
}
