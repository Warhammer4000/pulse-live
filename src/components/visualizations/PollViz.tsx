import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type ResponseRow = Tables<"responses">;

interface PollVizProps {
  options: string[];
  responses: ResponseRow[];
}

const POLL_COLORS = [
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-sky-500",
];

export function PollViz({ options, responses }: PollVizProps) {
  const counts = options.map((opt) => responses.filter((r) => r.value === opt).length);
  const total = responses.length;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        Waiting for votes...
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Donut representation via stacked bar */}
      <div className="flex h-8 w-full overflow-hidden rounded-full bg-muted">
        {options.map((opt, i) => {
          const pct = total > 0 ? (counts[i] / total) * 100 : 0;
          return (
            <motion.div
              key={opt}
              className={`h-full ${POLL_COLORS[i % POLL_COLORS.length]}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {options.map((opt, i) => {
          const pct = total > 0 ? Math.round((counts[i] / total) * 100) : 0;
          return (
            <div key={opt} className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${POLL_COLORS[i % POLL_COLORS.length]}`} />
              <span className="text-sm font-medium text-foreground">{opt}</span>
              <span className="text-sm font-mono text-muted-foreground">{pct}%</span>
            </div>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {total} {total === 1 ? "vote" : "votes"}
      </p>
    </div>
  );
}
