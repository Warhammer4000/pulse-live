import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type ResponseRow = Tables<"responses">;

interface RatingVizProps {
  readonly min: number;
  readonly max: number;
  readonly responses: ResponseRow[];
}

export function RatingViz({ min, max, responses }: RatingVizProps) {
  const safeResponses = Array.isArray(responses) ? responses : [];
  const values = safeResponses.map((r) => Number(r.value)).filter((v) => !Number.isNaN(v));
  const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const buckets = Array.from({ length: max - min + 1 }, (_, i) => {
    const val = min + i;
    return { val, count: values.filter((v) => v === val).length };
  });
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="w-full space-y-6">
      {/* Average score */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-1">
          {Array.from({ length: max }, (_, i) => (
            <Star
              key={i}
              className={`h-7 w-7 transition-colors ${
                i < Math.round(avg)
                  ? "fill-violet-400 text-violet-400"
                  : "fill-white/10 text-white/10"
              }`}
            />
          ))}
        </div>
        <p className="text-3xl font-bold font-mono text-white tabular-nums">
          {values.length > 0 ? avg.toFixed(1) : "—"}
          <span className="text-base font-normal text-white/40 ml-1">/ {max}</span>
        </p>
      </div>

      {/* Bar chart */}
      <div className="flex items-end justify-center gap-3 h-28 px-2">
        {buckets.map(({ val, count }) => (
          <div key={val} className="flex flex-col items-center gap-2 flex-1">
            <span className="text-xs font-mono text-white/50 tabular-nums">
              {count > 0 ? count : ""}
            </span>
            <div className="w-full flex items-end" style={{ height: "72px" }}>
              <motion.div
                className="w-full rounded-t-lg bg-violet-500"
                initial={{ height: 0 }}
                animate={{ height: count > 0 ? `${(count / maxCount) * 100}%` : "3px" }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  opacity: count > 0 ? 1 : 0.15,
                  minHeight: count > 0 ? "6px" : "3px",
                }}
              />
            </div>
            <span className="text-sm font-mono font-medium text-white/60">{val}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-white/40">
        {values.length} {values.length === 1 ? "rating" : "ratings"}
      </p>
    </div>
  );
}
