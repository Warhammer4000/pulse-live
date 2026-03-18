import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Plus, Presentation, BarChart3, Users, TrendingUp, ArrowRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type PresentationRow = Tables<"presentations">;
type SessionRow = Tables<"sessions">;
type ResponseRow = Tables<"responses">;

export default function DashboardOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: presentations = [], isLoading: presLoading } = useQuery({
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
    queryKey: ["all-sessions"],
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

  const { data: totalResponses = 0 } = useQuery({
    queryKey: ["total-responses"],
    queryFn: async () => {
      const sessionIds = sessions.map((s) => s.id);
      if (sessionIds.length === 0) return 0;
      const { count, error } = await supabase
        .from("responses")
        .select("*", { count: "exact", head: true })
        .in("session_id", sessionIds);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: sessions.length > 0,
  });

  const displayName = user?.user_metadata?.display_name || "there";
  const recentPresentations = presentations.slice(0, 4);
  const recentSessions = sessions.slice(0, 5);

  const stats = [
    { label: "Presentations", value: presentations.length, icon: Presentation, color: "text-primary" },
    { label: "Sessions", value: sessions.length, icon: TrendingUp, color: "text-accent" },
    { label: "Total Responses", value: totalResponses, icon: BarChart3, color: "text-primary" },
    { label: "Avg per Session", value: sessions.length > 0 ? Math.round(totalResponses / sessions.length) : 0, icon: Users, color: "text-accent" },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, <span className="gradient-text">{displayName}</span>
        </h1>
        <p className="font-body mt-1 text-muted-foreground">
          Here's an overview of your PulseLive activity
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat) => (
          <Card key={stat.label} className="glass-card">
            <CardContent className="flex items-center gap-4 py-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-muted ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{presLoading ? "–" : stat.value}</p>
                <p className="text-xs text-muted-foreground font-body">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-wrap gap-3"
      >
        <Button className="gradient-bg glow-button text-primary-foreground" onClick={() => navigate("/dashboard/presentations")}>
          <Plus className="mr-2 h-4 w-4" />
          New Presentation
        </Button>
        <Button variant="outline" onClick={() => navigate("/dashboard/analytics")}>
          <BarChart3 className="mr-2 h-4 w-4" />
          View Analytics
        </Button>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Presentations */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Presentations</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/presentations")}>
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          {presLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : recentPresentations.length === 0 ? (
            <Card className="glass-card border-dashed">
              <CardContent className="py-10 text-center text-muted-foreground">
                <Presentation className="mx-auto mb-3 h-8 w-8 opacity-50" />
                <p className="font-body text-sm">No presentations yet. Create your first one!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentPresentations.map((p) => (
                <Card
                  key={p.id}
                  className="glass-card-hover cursor-pointer rounded-xl"
                  onClick={() => navigate(`/edit/${p.id}`)}
                >
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground font-body">
                        Updated {new Date(p.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Sessions</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/analytics")}>
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          {sessions.length === 0 ? (
            <Card className="glass-card border-dashed">
              <CardContent className="py-10 text-center text-muted-foreground">
                <TrendingUp className="mx-auto mb-3 h-8 w-8 opacity-50" />
                <p className="font-body text-sm">No sessions yet. Start presenting!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((s) => {
                const pres = presentations.find((p) => p.id === s.presentation_id);
                return (
                  <Card
                    key={s.id}
                    className="glass-card-hover cursor-pointer rounded-xl"
                    onClick={() => pres && navigate(`/history/${pres.id}`)}
                  >
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="min-w-0 flex items-center gap-3">
                        <span className="font-mono text-sm font-semibold text-primary">{s.join_code}</span>
                        <div>
                          <p className="text-sm font-medium truncate">{pres?.title ?? "Unknown"}</p>
                          <p className="text-xs text-muted-foreground font-body">
                            {new Date(s.created_at).toLocaleDateString(undefined, {
                              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.is_active && (
                          <span className="flex items-center gap-1 text-xs font-medium text-accent">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                            Live
                          </span>
                        )}
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
