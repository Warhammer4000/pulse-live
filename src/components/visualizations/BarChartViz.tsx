import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type ResponseRow = Tables<"responses">;

interface BarChartVizProps {
  options: string[];
  responses: ResponseRow[];
}

export function BarChartViz({ options, responses }: BarChartVizProps) {
  const counts = options.map((opt) => responses.filter((r) => r.value === opt).length);
  const maxCount = Math.max(...counts, 1);
  const totalVotes = responses.length;

  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto">
      {options.map((opt, i) => {
        const count = counts[i];
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const isMax = count === maxCount && count > 0;

        return (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs font-mono font-bold text-primary-foreground">
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </span>
              <span className="font-mono text-muted-foreground tabular-nums">
                {count} ({pct}%)
              </span>
            </div>
            <div className="h-10 w-full overflow-hidden rounded-lg bg-muted">
              <motion.div
                className={`h-full rounded-lg ${isMax ? "bg-primary" : "bg-primary/60"}`}
                initial={{ width: 0 }}
                animate={{ width: `${totalVotes > 0 ? (count / maxCount) * 100 : 0}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        );
      })}
      <p className="text-center text-sm text-muted-foreground mt-4">
        {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
      </p>
    </div>
  );
}
