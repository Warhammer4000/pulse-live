import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ArrowLeft, Download, BarChart3, Calendar, Users, Hash, RotateCcw, Play } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { exportToExcel, parseOptions } from "./session-history/exportToExcel";
import { SlideList } from "./session-history/SlideList";
import { SlideViz } from "./session-history/SlideViz";

type SessionRow = Tables<"sessions">;
type SlideRow = Tables<"slides">;
type ResponseRow = Tables<"responses">;

export default function SessionHistory() {
  const { presentationId } = useParams<{ presentationId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);

  const reopenSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase.from("sessions").update({ is_active: true }).eq("id", sessionId).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sessions-history", presentationId] });
      navigate(`/present/${data.id}`);
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const { data: presentation } = useQuery({
    queryKey: ["presentation", presentationId],
    queryFn: async () => {
      const { data, error } = await supabase.from("presentations").select("*").eq("id", presentationId ?? "").single();
      if (error) throw error;
      return data;
    },
    enabled: !!presentationId,
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["sessions-history", presentationId],
    queryFn: async () => {
      const { data, error } = await supabase.from("sessions").select("*").eq("presentation_id", presentationId ?? "").order("created_at", { ascending: false });
      if (error) throw error;
      return data as SessionRow[];
    },
    enabled: !!presentationId,
  });

  const { data: slides = [] } = useQuery({
    queryKey: ["slides", presentationId],
    queryFn: async () => {
      const { data, error } = await supabase.from("slides").select("*").eq("presentation_id", presentationId ?? "").order("order");
      if (error) throw error;
      return data as SlideRow[];
    },
    enabled: !!presentationId,
  });

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? sessions[0];

  const { data: responses = [], isLoading: responsesLoading } = useQuery({
    queryKey: ["session-responses", selectedSession?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("responses").select("*").eq("session_id", selectedSession?.id ?? "");
      if (error) throw error;
      return data as ResponseRow[];
    },
    enabled: !!selectedSession?.id,
  });

  const activeSlideId = selectedSlideId ?? slides[0]?.id;
  const activeSlide = slides.find((s) => s.id === activeSlideId);
  const slideResponses = responses.filter((r) => r.slide_id === activeSlideId);
  const uniqueParticipants = new Set(responses.map((r) => r.participant_id)).size;
  const options = parseOptions(activeSlide?.options);

  let mainContent: React.ReactNode;
  if (sessionsLoading) {
    mainContent = (
      <div className="space-y-4">
        <div className="h-10 w-64 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-64 w-full rounded-2xl bg-white/5 animate-pulse" />
      </div>
    );
  } else if (sessions.length === 0) {
    mainContent = (
      <div className="rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center py-16 text-center">
        <BarChart3 className="mb-4 h-10 w-10 text-white/20" />
        <p className="text-white/60 font-medium">No sessions yet</p>
        <p className="text-white/30 text-sm mt-1">Start a presentation to see analytics here</p>
        <Button
          className="mt-6 accent-bg accent-bg-hover text-white border-0 accent-shadow"
          onClick={() => navigate(`/edit/${presentationId}`)}
        >
          Go to Editor
        </Button>
      </div>
    );
  } else {
    mainContent = (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-white/40 mr-1">Session:</span>
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center gap-1">
              <button
                onClick={() => { setSelectedSessionId(s.id); setSelectedSlideId(null); }}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all",
                  selectedSession?.id === s.id
                    ? "border-primary/30 bg-primary/10 accent-text"
                    : "border-white/8 bg-white/5 text-white/50 hover:border-white/15 hover:text-white"
                )}
              >
                <Calendar className="h-3 w-3" />
                {new Date(s.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                <span className="font-mono opacity-50">#{s.join_code}</span>
                {s.is_active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              </button>
              {s.is_active ? (
                <Button size="sm" variant="ghost" className="h-8 px-2 accent-text hover:accent-surface" onClick={() => navigate(`/present/${s.id}`)}>
                  <Play className="h-3 w-3 mr-1" /> Resume
                </Button>
              ) : (
                <Button size="sm" variant="ghost" className="h-8 px-2 text-white/40 hover:text-white hover:bg-white/8" onClick={() => reopenSession.mutate(s.id)} disabled={reopenSession.isPending}>
                  <RotateCcw className="h-3 w-3 mr-1" /> Reopen
                </Button>
              )}
            </div>
          ))}
        </div>

        {selectedSession && (
          <motion.div key={selectedSession.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Hash, label: "Total Responses", value: responses.length },
              { icon: Users, label: "Unique Participants", value: uniqueParticipants },
              { icon: BarChart3, label: "Avg Responses/Slide", value: slides.length > 0 ? Math.round(responses.length / slides.length) : 0 },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/8 bg-white/5 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl accent-surface">
                    <stat.icon className="h-5 w-5 accent-text" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-mono text-white">{stat.value}</p>
                    <p className="text-xs text-white/40">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {selectedSession && (
          <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
            <SlideList slides={slides} responses={responses} activeSlideId={activeSlideId} onSelect={setSelectedSlideId} />
            <SlideViz activeSlide={activeSlide} slideResponses={slideResponses} options={options} responsesLoading={responsesLoading} />
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <header className="sticky top-0 z-10 border-b border-white/5 bg-[#080810]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/8" onClick={() => navigate("/dashboard/analytics")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-sm font-semibold text-white">{presentation?.title ?? "..."}</p>
              <p className="text-xs text-white/40">Session History</p>
            </div>
          </div>
          {selectedSession && presentation && (
            <Button
              size="sm"
              className="bg-white/8 hover:bg-white/12 text-white border border-white/10"
              onClick={() => exportToExcel(presentation, slides, responses, selectedSession)}
              disabled={responses.length === 0}
            >
              <Download className="mr-2 h-3.5 w-3.5" />
              Export Excel
            </Button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {mainContent}
      </main>
    </div>
  );
}
