import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parseQuizTimerSeconds } from "@/pages/slide-editor/types";
import type { Tables } from "@/integrations/supabase/types";

type SlideRow = Tables<"slides">;

interface QuizTimerResult {
  timeLeft: number | null;
  totalSeconds: number | null;
  started: boolean;
  startTimer: () => void;
  resetTimer: () => void;
}

export function useQuizTimer(
  activeSlide: SlideRow | undefined,
  sessionId: string | undefined,
  onTimerExpire?: () => void,
): QuizTimerResult {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [totalSeconds, setTotalSeconds] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiredRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Reset when slide changes — auto-lock voting for quiz slides with timer
  useEffect(() => {
    clearTimer();
    expiredRef.current = false;
    setStarted(false);

    if (!activeSlide || activeSlide.type !== "quiz") {
      setTimeLeft(null);
      setTotalSeconds(null);
      return;
    }

    const seconds = parseQuizTimerSeconds(activeSlide.options);
    if (!seconds) {
      setTimeLeft(null);
      setTotalSeconds(null);
      return;
    }

    setTotalSeconds(seconds);
    setTimeLeft(seconds);

    // Auto-lock voting on slide entry so participants can't answer yet
    if (sessionId) {
      supabase.from("sessions").update({ voting_locked: true }).eq("id", sessionId).then();
    }

    return clearTimer;
  }, [activeSlide?.id, sessionId, clearTimer]);

  const beginCountdown = useCallback(() => {
    clearTimer();
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearTimer();
          if (!expiredRef.current && sessionId) {
            expiredRef.current = true;
            supabase.from("sessions").update({ voting_locked: true }).eq("id", sessionId).then();
            onTimerExpire?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [sessionId, onTimerExpire, clearTimer]);

  const startTimer = useCallback(() => {
    if (started || totalSeconds === null) return;
    setStarted(true);
    // Unlock voting so participants can answer
    if (sessionId) {
      supabase.from("sessions").update({ voting_locked: false }).eq("id", sessionId).then();
    }
    beginCountdown();
  }, [started, totalSeconds, sessionId, beginCountdown]);

  const resetTimer = useCallback(() => {
    clearTimer();
    expiredRef.current = false;
    setStarted(false);
    setTimeLeft(totalSeconds);
    // Re-lock voting
    if (sessionId) {
      supabase.from("sessions").update({ voting_locked: true }).eq("id", sessionId).then();
    }
  }, [totalSeconds, sessionId, clearTimer]);

  return { timeLeft, totalSeconds, started, startTimer, resetTimer };
}
