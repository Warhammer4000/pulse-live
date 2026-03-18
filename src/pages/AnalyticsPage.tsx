import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { BarChart3, Calendar, ArrowRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type PresentationRow = Tables<"presentations">;
type SessionRow = Tables<"sessions">;

export default function AnalyticsPage() {
  const navigate = useNavigate();

  const { data: presentations = [], isLoading } = useQuery({
    queryKey: ["presentations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presentations")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as PresentationRow[];
    },
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["all-sessions-analytics"],
    queryFn: async () => {
      const presIds = presentations.map((p) => p.id);
      if (presIds.length === 0) return [];
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .in("presentation_id", presIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SessionRow[];
    },
    enabled: presentations.length > 0,
  });

  // Group sessions by presentation
  const presWithSessions = presentations
    .map((p) => ({
      ...p,
      sessions: sessions.filter((s) => s.presentation_id === p.id),
    }))
    .filter((p) => p.sessions.length > 0);

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="font-body mt-1 text-muted-foreground">Review past sessions and explore response data</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : presWithSessions.length === 0 ? (
        <Card className="glass-card border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">No sessions recorded yet</p>
            <p className="font-body text-sm text-muted-foreground/70">Start a presentation to see analytics here</p>
            <Button className="mt-6 gradient-bg text-primary-foreground" onClick={() => navigate("/dashboard/presentations")}>
              Go to Presentations
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {presWithSessions.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass-card rounded-2xl overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{p.title}</CardTitle>
                      <CardDescription className="font-body">
                        {p.sessions.length} session{p.sessions.length !== 1 ? "s" : ""}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/history/${p.id}`)}>
                      View Details <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {p.sessions.slice(0, 6).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => navigate(`/history/${p.id}`)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 px-3 py-2 text-sm transition-all hover:bg-muted",
                          s.is_active && "border-accent/30 bg-accent/5"
                        )}
                      >
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-body text-muted-foreground">
                          {new Date(s.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                        <span className="font-mono text-xs opacity-50">#{s.join_code}</span>
                        {s.is_active && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                      </button>
                    ))}
                    {p.sessions.length > 6 && (
                      <span className="flex items-center px-3 py-2 text-xs text-muted-foreground">
                        +{p.sessions.length - 6} more
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
