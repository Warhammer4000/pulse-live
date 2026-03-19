import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Plus, Presentation, BarChart3, Users, TrendingUp, ArrowRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type PresentationRow = Tables<"presentations">;
type SessionRow = Tables<"sessions">;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

export default function DashboardOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: presentations = [], isLoading: presLoading } = useQuery({
    queryKey: ["presentations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("presentations").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data as PresentationRow[];
    },
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["all-sessions"],
    queryFn: async () => {
      // Close stale sessions (24h+) before fetching
      await supabase.rpc("close_stale_sessions");
      const presIds = presentations.map((p) => p.id);
      if (presIds.length === 0) return [];
      const { data, error } = await supabase.from("sessions").select("*").in("presentation_id", presIds).order("created_at", { ascending: false });
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
      const { count, error } = await supabase.from("responses").select("*", { count: "exact", head: true }).in("session_id", sessionIds);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: sessions.length > 0,
  });

  const displayName = user?.user_metadata?.display_name || "there";
  const recentPresentations = presentations.slice(0, 4);
  const recentSessions = sessions.slice(0, 5);

  const stats = [
    { label: "Presentations", value: presentations.length, icon: Presentation },
    { label: "Sessions", value: sessions.length, icon: TrendingUp },
    { label: "Total Responses", value: totalResponses, icon: BarChart3 },
    { label: "Avg per Session", value: sessions.length > 0 ? Math.round(totalResponses / sessions.length) : 0, icon: Users },
  ];

  return (
    <div className="p-8 lg:p-12 max-w-6xl mx-auto space-y-10">
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-10">
        {/* Header + quick actions */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <p className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-2">Dashboard</p>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Welcome back, <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">{displayName}</span>
            </h1>
            <p className="mt-1.5 text-sm text-white/40">Here's an overview of your PulseLive activity</p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Button className="bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-lg shadow-violet-900/40 rounded-xl" onClick={() => navigate("/dashboard/presentations")}>
              <Plus className="mr-2 h-4 w-4" />
              New Presentation
            </Button>
            <Button className="bg-white/8 hover:bg-white/12 text-white border border-white/10 rounded-xl" onClick={() => navigate("/dashboard/analytics")}>
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/8 bg-white/5 p-5 hover:border-white/15 hover:bg-white/8 transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                  <stat.icon className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono text-white">{presLoading ? "–" : stat.value}</p>
                  <p className="text-xs text-white/40">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Presentations */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white/60 tracking-widest uppercase">Recent Presentations</h2>
              <button onClick={() => navigate("/dashboard/presentations")} className="flex items-center gap-1 text-xs text-white/40 hover:text-violet-400 transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            {presLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}
              </div>
            ) : recentPresentations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center py-12 text-center">
                <Presentation className="mb-3 h-8 w-8 text-white/20" />
                <p className="text-white/40 text-sm">No presentations yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentPresentations.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/edit/${p.id}`)}
                    className="w-full flex items-center justify-between rounded-xl border border-white/8 bg-white/5 px-4 py-3 hover:border-white/15 hover:bg-white/8 transition-all duration-200 text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.title}</p>
                      <p className="text-xs text-white/30">Updated {new Date(p.updated_at).toLocaleDateString()}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-white/20" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent Sessions */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white/60 tracking-widest uppercase">Recent Sessions</h2>
              <button onClick={() => navigate("/dashboard/analytics")} className="flex items-center gap-1 text-xs text-white/40 hover:text-violet-400 transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            {sessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center py-12 text-center">
                <TrendingUp className="mb-3 h-8 w-8 text-white/20" />
                <p className="text-white/40 text-sm">No sessions yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSessions.map((s) => {
                  const pres = presentations.find((p) => p.id === s.presentation_id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => pres && navigate(`/history/${pres.id}`)}
                      className="w-full flex items-center justify-between rounded-xl border border-white/8 bg-white/5 px-4 py-3 hover:border-white/15 hover:bg-white/8 transition-all duration-200 text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-sm font-semibold text-violet-400 shrink-0">{s.join_code}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{pres?.title ?? "Unknown"}</p>
                          <p className="text-xs text-white/30">
                            {new Date(s.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {s.is_active && (
                          <span className="flex items-center gap-1 text-xs text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live
                          </span>
                        )}
                        <ArrowRight className="h-4 w-4 text-white/20" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
