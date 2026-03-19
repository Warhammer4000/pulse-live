import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type ResponseRow = Tables<"responses">;

interface RatingVizProps {
  min: number;
  max: number;
  responses: ResponseRow[];
}

export function RatingViz({ min, max, responses }: RatingVizProps) {
  const values = responses.map((r) => Number(r.value)).filter((v) => !isNaN(v));
  const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const buckets = Array.from({ length: max - min + 1 }, (_, i) => {
    const val = min + i;
    return { val, count: values.filter((v) => v === val).length };
  });
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {values.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: max }, (_, i) => (
              <Star
                key={i}
                className={`h-6 w-6 ${i < Math.round(avg) ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
              />
            ))}
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {avg.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">/ {max}</span>
          </p>
        </div>
      )}
      <div className="flex items-end justify-center gap-2 h-32">
        {buckets.map(({ val, count }) => (
          <div key={val} className="flex flex-col items-center gap-1 flex-1">
            <motion.div
              className="w-full rounded-t-md bg-primary/70"
              initial={{ height: 0 }}
              animate={{ height: `${(count / maxCount) * 100}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ minHeight: count > 0 ? 4 : 0 }}
            />
            <span className="text-xs font-mono text-muted-foreground">{val}</span>
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {values.length} {values.length === 1 ? "rating" : "ratings"}
      </p>
    </div>
  );
}
