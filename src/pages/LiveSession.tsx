import { useEffect, useState } from "react";
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

type SessionRow = Tables<"sessions">;
type SlideRow = Tables<"slides">;

function getParticipantId(): string {
  let id = localStorage.getItem("pulse_participant_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("pulse_participant_id", id);
  }
  return id;
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
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("join_code", code!)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data as SessionRow;
    },
    enabled: !!code,
  });

  const { data: activeSlide } = useQuery({
    queryKey: ["live-slide", session?.active_slide_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("slides")
        .select("*")
        .eq("id", session!.active_slide_id!)
        .single();
      if (error) throw error;
      return data as SlideRow;
    },
    enabled: !!session?.active_slide_id,
  });

  // Realtime: listen for session changes (slide navigation, voting lock)
  useEffect(() => {
    if (!session?.id) return;
    const channel = supabase
      .channel(`session-${session.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "sessions",
        filter: `id=eq.${session.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["live-session", code] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session?.id, code, queryClient]);

  // Reset local state when slide changes
  useEffect(() => {
    if (activeSlide?.id) {
      const participantId = getParticipantId();
      const key = `${activeSlide.id}-${participantId}`;
      if (!submitted[key]) {
        setSelectedOption(null);
        setTextResponse("");
      }
    }
  }, [activeSlide?.id]);

  const submitMutation = useMutation({
    mutationFn: async (value: string) => {
      const { error } = await supabase.from("responses").insert({
        session_id: session!.id,
        slide_id: activeSlide!.id,
        participant_id: getParticipantId(),
        value,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      const key = `${activeSlide!.id}-${getParticipantId()}`;
      setSubmitted((prev) => ({ ...prev, [key]: true }));
    },
  });

  const isSubmitted = activeSlide
    ? submitted[`${activeSlide.id}-${getParticipantId()}`]
    : false;

  if (!session || !activeSlide) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">Connecting to session...</p>
      </div>
    );
  }

  const options: string[] = activeSlide.options
    ? (Array.isArray(activeSlide.options) ? activeSlide.options as string[] : JSON.parse(String(activeSlide.options)))
    : [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Status bar */}
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
        <span className="text-sm font-medium">
          Pulse<span className="text-primary">Live</span>
        </span>
        <span className="flex items-center gap-1.5 text-xs text-accent">
          <Wifi className="h-3 w-3" />
          Connected
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg"
          >
            <h2 className="mb-6 text-center text-2xl font-semibold tracking-tight" style={{ textWrap: "balance" as any }}>
              {activeSlide.question}
            </h2>

            {session.voting_locked ? (
              <div className="text-center text-muted-foreground">
                <p className="text-lg font-medium">Voting is locked</p>
                <p className="text-sm">Wait for the presenter to open voting</p>
              </div>
            ) : isSubmitted ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex flex-col items-center gap-3 py-8"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                  <Check className="h-8 w-8 text-accent" />
                </div>
                <p className="text-lg font-medium">Response submitted!</p>
                <p className="text-sm text-muted-foreground">Waiting for next question...</p>
              </motion.div>
            ) : (
              <>
                {activeSlide.type === "multiple_choice" && (
                  <div className="space-y-3">
                    {options.map((opt, i) => (
                      <motion.button
                        key={i}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedOption(opt);
                          submitMutation.mutate(opt);
                        }}
                        disabled={submitMutation.isPending}
                        className={cn(
                          "flex w-full items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all",
                          selectedOption === opt
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30 hover:bg-muted/50"
                        )}
                        style={{ minHeight: 64 }}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-mono font-bold text-primary-foreground">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-lg font-medium">{opt}</span>
                      </motion.button>
                    ))}
                  </div>
                )}

                {activeSlide.type === "word_cloud" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (textResponse.trim()) submitMutation.mutate(textResponse.trim());
                    }}
                    className="space-y-4"
                  >
                    <Input
                      value={textResponse}
                      onChange={(e) => setTextResponse(e.target.value)}
                      placeholder="Type a word or short phrase..."
                      className="h-14 text-lg text-center"
                      maxLength={50}
                    />
                    <Button
                      type="submit"
                      className="w-full h-14 text-lg"
                      disabled={!textResponse.trim() || submitMutation.isPending}
                    >
                      Submit
                    </Button>
                  </form>
                )}

                {activeSlide.type === "open_text" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (textResponse.trim()) submitMutation.mutate(textResponse.trim());
                    }}
                    className="space-y-4"
                  >
                    <Textarea
                      value={textResponse}
                      onChange={(e) => setTextResponse(e.target.value)}
                      placeholder="Type your response..."
                      className="min-h-[120px] text-lg"
                    />
                    <Button
                      type="submit"
                      className="w-full h-14 text-lg"
                      disabled={!textResponse.trim() || submitMutation.isPending}
                    >
                      Submit
                    </Button>
                  </form>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
