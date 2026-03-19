import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type ResponseRow = Tables<"responses">;

interface RankingVizProps {
  options: string[];
  responses: ResponseRow[];
}

export function RankingViz({ options, responses }: RankingVizProps) {
  // Each response value is a JSON array of ordered items. Lower position = better.
  // Score = sum of (n - position) for each response where n = number of items
  const n = options.length;
  const scores = new Map<string, number>();
  options.forEach((o) => scores.set(o, 0));

  responses.forEach((r) => {
    try {
      const ranked: string[] = JSON.parse(r.value);
      ranked.forEach((item, idx) => {
        scores.set(item, (scores.get(item) ?? 0) + (n - idx));
      });
    } catch { /* skip malformed */ }
  });

  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const maxScore = Math.max(...sorted.map(([, s]) => s), 1);

  if (responses.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        Waiting for responses...
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full max-w-2xl mx-auto">
      {sorted.map(([item, score], i) => (
        <div key={item} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs font-mono font-bold text-primary-foreground">
                {i + 1}
              </span>
              {item}
            </span>
            <span className="font-mono text-muted-foreground tabular-nums">{score} pts</span>
          </div>
          <div className="h-8 w-full overflow-hidden rounded-lg bg-muted">
            <motion.div
              className={`h-full rounded-lg ${i === 0 ? "bg-primary" : "bg-primary/60"}`}
              initial={{ width: 0 }}
              animate={{ width: `${(score / maxScore) * 100}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      ))}
      <p className="text-center text-sm text-muted-foreground mt-4">
        {responses.length} {responses.length === 1 ? "response" : "responses"}
      </p>
    </div>
  );
}
