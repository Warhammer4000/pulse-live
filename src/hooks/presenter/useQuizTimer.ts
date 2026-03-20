import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parseQuizTimerSeconds } from "@/pages/slide-editor/types";
import type { Tables } from "@/integrations/supabase/types";

type SlideRow = Tables<"slides">;

interface QuizTimerResult {
  /** Seconds remaining, or null if no timer active */
  timeLeft: number | null;
  /** Total seconds for progress display */
  totalSeconds: number | null;
}

export function useQuizTimer(
  activeSlide: SlideRow | undefined,
  sessionId: string | undefined,
  onTimerExpire?: () => void,
): QuizTimerResult {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [totalSeconds, setTotalSeconds] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiredRef = useRef(false);

  // Reset timer when slide changes
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    expiredRef.current = false;

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

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          // Auto-lock voting
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

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeSlide?.id, sessionId]);

  return { timeLeft, totalSeconds };
}
