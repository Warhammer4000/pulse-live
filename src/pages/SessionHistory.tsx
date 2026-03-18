import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Download, BarChart3, Cloud, MessageSquare, Calendar, Users, Hash, RotateCcw, Play } from "lucide-react";
import { BarChartViz } from "@/components/visualizations/BarChartViz";
import { WordCloudViz } from "@/components/visualizations/WordCloudViz";
import { ResponseFeed } from "@/components/visualizations/ResponseFeed";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type SessionRow = Tables<"sessions">;
type SlideRow = Tables<"slides">;
type ResponseRow = Tables<"responses">;

function exportToCSV(
  presentation: { title: string },
  slides: SlideRow[],
  responses: ResponseRow[],
  session: SessionRow
) {
  const rows: string[][] = [
    ["Presentation", "Session Code", "Session Date", "Slide #", "Question", "Type", "Response", "Participant ID", "Timestamp"],
  ];

  slides.forEach((slide, i) => {
    const slideResponses = responses.filter((r) => r.slide_id === slide.id);
    if (slideResponses.length === 0) {
      rows.push([
        presentation.title,
        session.join_code,
        new Date(session.created_at).toLocaleDateString(),
        String(i + 1),
        slide.question,
        slide.type,
        "(no responses)",
        "",
        "",
      ]);
    } else {
      slideResponses.forEach((r) => {
        rows.push([
          presentation.title,
          session.join_code,
          new Date(session.created_at).toLocaleDateString(),
          String(i + 1),
          slide.question,
          slide.type,
          r.value,
          r.participant_id.slice(0, 8),
          new Date(r.created_at).toLocaleString(),
        ]);
      });
    }
  });

  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${presentation.title.replace(/[^a-z0-9]/gi, "_")}_${session.join_code}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SessionHistory() {
  const { presentationId } = useParams<{ presentationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);

  const reopenSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase
        .from("sessions")
        .update({ is_active: true })
        .eq("id", sessionId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sessions-history", presentationId] });
      navigate(`/present/${data.id}`);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const { data: presentation } = useQuery({
    queryKey: ["presentation", presentationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presentations")
        .select("*")
        .eq("id", presentationId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!presentationId,
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["sessions-history", presentationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("presentation_id", presentationId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SessionRow[];
    },
    enabled: !!presentationId,
  });

  const { data: slides = [] } = useQuery({
    queryKey: ["slides", presentationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("slides")
        .select("*")
        .eq("presentation_id", presentationId!)
        .order("order");
      if (error) throw error;
      return data as SlideRow[];
    },
    enabled: !!presentationId,
  });

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? sessions[0];

  const { data: responses = [], isLoading: responsesLoading } = useQuery({
    queryKey: ["session-responses", selectedSession?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("responses")
        .select("*")
        .eq("session_id", selectedSession!.id);
      if (error) throw error;
      return data as ResponseRow[];
    },
    enabled: !!selectedSession?.id,
  });

  const activeSlideId = selectedSlideId ?? slides[0]?.id;
  const activeSlide = slides.find((s) => s.id === activeSlideId);
  const slideResponses = responses.filter((r) => r.slide_id === activeSlideId);
  const uniqueParticipants = new Set(responses.map((r) => r.participant_id)).size;

  const slideTypeIcon = {
    multiple_choice: BarChart3,
    word_cloud: Cloud,
    open_text: MessageSquare,
  };

  const options: string[] = activeSlide?.options
    ? (Array.isArray(activeSlide.options) ? activeSlide.options as string[] : JSON.parse(String(activeSlide.options)))
    : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/60 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/analytics")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{presentation?.title ?? "..."}</h1>
              <p className="text-xs text-muted-foreground font-body">Session History & Analytics</p>
            </div>
          </div>
          {selectedSession && presentation && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(presentation, slides, responses, selectedSession)}
              disabled={responses.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {sessionsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : sessions.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium text-muted-foreground">No sessions yet</p>
              <p className="font-body text-sm text-muted-foreground/70">Start a presentation to see analytics here</p>
              <Button className="mt-6 gradient-bg text-primary-foreground" onClick={() => navigate(`/edit/${presentationId}`)}>
                Go to Editor
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Session selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground mr-1">Session:</span>
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedSessionId(s.id);
                    setSelectedSlideId(null);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                    (selectedSession?.id === s.id)
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border/50 bg-card/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(s.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  <span className="font-mono text-xs opacity-60">#{s.join_code}</span>
                  {s.is_active && (
                    <span className="flex h-2 w-2 rounded-full bg-accent" />
                  )}
                </button>
              ))}
            </div>

            {/* Summary stats */}
            {selectedSession && (
              <motion.div
                key={selectedSession.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-4 sm:grid-cols-3"
              >
                <Card className="glass-card">
                  <CardContent className="flex items-center gap-4 py-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Hash className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold font-mono">{responses.length}</p>
                      <p className="text-xs text-muted-foreground font-body">Total Responses</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="flex items-center gap-4 py-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                      <Users className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold font-mono">{uniqueParticipants}</p>
                      <p className="text-xs text-muted-foreground font-body">Unique Participants</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="flex items-center gap-4 py-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold font-mono">
                        {slides.length > 0 ? Math.round(responses.length / slides.length) : 0}
                      </p>
                      <p className="text-xs text-muted-foreground font-body">Avg Responses/Slide</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Slide tabs + visualization */}
            {selectedSession && (
              <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                {/* Slide list */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Slides</p>
                  {slides.map((slide, i) => {
                    const count = responses.filter((r) => r.slide_id === slide.id).length;
                    const Icon = slideTypeIcon[slide.type];
                    return (
                      <button
                        key={slide.id}
                        onClick={() => setSelectedSlideId(slide.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl p-3 text-left text-sm transition-all",
                          activeSlideId === slide.id
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-muted-foreground hover:bg-muted border border-transparent"
                        )}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-mono font-semibold">
                          {i + 1}
                        </span>
                        <span className="flex-1 truncate">{slide.question || "Untitled"}</span>
                        <Icon className="h-3.5 w-3.5 shrink-0 opacity-50" />
                        <span className="font-mono text-xs opacity-50">{count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Results visualization */}
                <Card className="glass-card overflow-hidden">
                  {responsesLoading ? (
                    <CardContent className="py-16">
                      <Skeleton className="mx-auto h-48 w-full max-w-md rounded-xl" />
                    </CardContent>
                  ) : activeSlide ? (
                    <>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl" style={{ textWrap: "balance" as any }}>
                          {activeSlide.question || "Untitled question"}
                        </CardTitle>
                        <CardDescription className="font-body">
                          {slideResponses.length} response{slideResponses.length !== 1 ? "s" : ""} ·{" "}
                          {activeSlide.type.replace("_", " ")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4 pb-8">
                        {slideResponses.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <p className="font-body">No responses for this slide</p>
                          </div>
                        ) : (
                          <>
                            {activeSlide.type === "multiple_choice" && (
                              <BarChartViz options={options} responses={slideResponses} />
                            )}
                            {activeSlide.type === "word_cloud" && (
                              <WordCloudViz responses={slideResponses} />
                            )}
                            {activeSlide.type === "open_text" && (
                              <ResponseFeed responses={slideResponses} />
                            )}
                          </>
                        )}
                      </CardContent>
                    </>
                  ) : (
                    <CardContent className="py-16 text-center text-muted-foreground">
                      Select a slide to view results
                    </CardContent>
                  )}
                </Card>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
