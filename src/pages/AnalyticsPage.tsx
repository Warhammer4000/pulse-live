import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BarChart3, Calendar, ArrowRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type PresentationRow = Tables<"presentations">;
type SessionRow = Tables<"sessions">;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

export default function AnalyticsPage() {
  const navigate = useNavigate();

  const { data: presentations = [], isLoading } = useQuery({
    queryKey: ["presentations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("presentations").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data as PresentationRow[];
    },
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["all-sessions-analytics"],
    queryFn: async () => {
      const presIds = presentations.map((p) => p.id);
      if (presIds.length === 0) return [];
      const { data, error } = await supabase.from("sessions").select("*").in("presentation_id", presIds).order("created_at", { ascending: false });
      if (error) throw error;
      return data as SessionRow[];
    },
    enabled: presentations.length > 0,
  });

  const presWithSessions = presentations
    .map((p) => ({ ...p, sessions: sessions.filter((s) => s.presentation_id === p.id) }))
    .filter((p) => p.sessions.length > 0);

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-bold tracking-tight text-white">Analytics</h1>
        <p className="mt-1 text-sm text-white/40">Review past sessions and explore response data</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : presWithSessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center py-16 text-center">
          <BarChart3 className="mb-4 h-10 w-10 text-white/20" />
          <p className="text-white/60 font-medium">No sessions recorded yet</p>
          <p className="text-white/30 text-sm mt-1">Start a presentation to see analytics here</p>
          <Button
            className="mt-6 bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-lg shadow-violet-900/40"
            onClick={() => navigate("/dashboard/presentations")}
          >
            Go to Presentations
          </Button>
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">
          {presWithSessions.map((p) => (
            <motion.div key={p.id} variants={fadeUp}>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-6 hover:border-white/12 transition-all duration-200">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <p className="font-semibold text-white">{p.title}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {p.sessions.length} session{p.sessions.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-white/8 hover:bg-white/12 text-white border border-white/10 shrink-0 h-8 px-3 text-xs"
                    onClick={() => navigate(`/history/${p.id}`)}
                  >
                    View Details <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.sessions.slice(0, 6).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => navigate(`/history/${p.id}`)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-all hover:border-white/15 hover:bg-white/8",
                        s.is_active
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border-white/8 bg-white/5 text-white/50"
                      )}
                    >
                      <Calendar className="h-3 w-3 shrink-0" />
                      {new Date(s.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      <span className="font-mono opacity-50">#{s.join_code}</span>
                      {s.is_active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                    </button>
                  ))}
                  {p.sessions.length > 6 && (
                    <span className="flex items-center px-3 py-2 text-xs text-white/30">
                      +{p.sessions.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
