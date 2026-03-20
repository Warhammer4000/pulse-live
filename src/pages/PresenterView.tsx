import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useStopwatch } from "@/hooks/presenter/useStopwatch";
import { useFullscreen } from "@/hooks/presenter/useFullscreen";
import { useParticipantCount } from "@/hooks/presenter/useParticipantCount";
import { useSoothingMusic } from "@/hooks/presenter/useSoothingMusic";
import { useQuizTimer } from "@/hooks/presenter/useQuizTimer";
import { FloatingReactions } from "@/components/presenter/FloatingReactions";
import { PresenterTopBar } from "@/components/presenter/PresenterTopBar";
import { SlideStage } from "@/components/presenter/SlideStage";
import { PresenterFooter } from "@/components/presenter/PresenterFooter";
import type { Tables } from "@/integrations/supabase/types";

type SessionRow = Tables<"sessions">;
type SlideRow = Tables<"slides">;
type ResponseRow = Tables<"responses">;

export default function PresenterView() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showResults, setShowResults] = useState(true);
  const [qrOpen, setQrOpen] = useState(false);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const stopwatch = useStopwatch();
  const participantCount = useParticipantCount(sessionId);
  const { playing: musicPlaying, toggle: toggleMusic, station, selectStation, stations } = useSoothingMusic();

  const { data: session } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase.from("sessions").select("*").eq("id", sessionId).single();
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
        .eq("presentation_id", session.presentation_id)
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
        .eq("session_id", sessionId)
        .eq("slide_id", activeSlide.id);
      if (error) throw error;
      return data as ResponseRow[];
    },
    enabled: !!sessionId && !!activeSlide?.id,
  });

  // Realtime response updates
  useEffect(() => {
    if (!sessionId) return;
    const ch = supabase
      .channel(`responses-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "responses", filter: `session_id=eq.${sessionId}` },
        () => queryClient.invalidateQueries({ queryKey: ["responses", sessionId] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [sessionId, queryClient]);

  const navigateSlide = useCallback(async (direction: "prev" | "next") => {
    if (!session || slides.length === 0) return;
    const newIndex = direction === "next"
      ? Math.min(activeIndex + 1, slides.length - 1)
      : Math.max(activeIndex - 1, 0);
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

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") navigateSlide("next");
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") navigateSlide("prev");
      else if (e.key === " ") { e.preventDefault(); setShowResults((v) => !v); }
      else if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    globalThis.addEventListener("keydown", handler);
    return () => globalThis.removeEventListener("keydown", handler);
  }, [navigateSlide, toggleFullscreen]);

  if (!session || !activeSlide) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080810]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#080810] text-white">
      <FloatingReactions sessionId={session.id} />
      {/* QR Modal */}
      {qrOpen && (
        <>
          <button
            aria-label="Close QR code"
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm cursor-default"
            onClick={() => setQrOpen(false)}
          />
          <dialog
            open
            aria-label="QR Code"
            className="fixed z-50 m-auto inset-0 flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-[#0f0f1a] p-10 shadow-2xl"
          >
            <button
              onClick={() => setQrOpen(false)}
              className="absolute right-4 top-4 text-white/40 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="rounded-2xl overflow-hidden bg-white p-3">
              <QRCodeSVG
                value={`${globalThis.location?.origin ?? ""}/join/${session.join_code}`}
                size={280}
                bgColor="#ffffff"
                fgColor="#080810"
                level="M"
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-white/40 mb-1">
                Join at <span className="text-white/70">{globalThis.location?.origin ?? ""}/join</span>
              </p>
              <p className="font-mono text-5xl font-bold tracking-widest text-white">
                {session.join_code}
              </p>
            </div>
          </dialog>
        </>
      )}
      <PresenterTopBar
        session={session}
        participantCount={participantCount}
        showResults={showResults}
        isFullscreen={isFullscreen}
        onExit={() => navigate("/dashboard")}
        onToggleVotingLock={toggleVotingLock}
        onToggleResults={() => setShowResults((v) => !v)}
        onResetResults={resetResults}
        onEndSession={endSession}
        onToggleFullscreen={toggleFullscreen}
      />
      <SlideStage
        activeSlide={activeSlide}
        responses={responses}
        showResults={showResults}
      />
      <PresenterFooter
        session={session}
        slides={slides}
        activeSlide={activeSlide}
        activeIndex={activeIndex}
        responseCount={responses.length}
        stopwatch={stopwatch}
        musicPlaying={musicPlaying}
        activeStation={station}
        stations={stations}
        onNavigate={navigateSlide}
        onJumpToSlide={jumpToSlide}
        onOpenQR={() => setQrOpen(true)}
        onToggleMusic={toggleMusic}
        onSelectStation={selectStation}
      />
    </div>
  );
}
