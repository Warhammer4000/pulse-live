import { motion, AnimatePresence } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type ResponseRow = Tables<"responses">;

interface ResponseFeedProps {
  responses: ResponseRow[];
}

export function ResponseFeed({ responses }: ResponseFeedProps) {
  const sorted = [...responses].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-white/40">
        Waiting for responses...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-3 max-h-[50vh] overflow-y-auto px-2">
      <AnimatePresence mode="popLayout">
        {sorted.map((r) => (
          <motion.div
            key={r.id}
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-xl border border-white/8 bg-white/5 p-4"
          >
            <p className="text-base leading-relaxed text-white">{r.value}</p>
            <p className="mt-1 text-xs text-white/40">
              {new Date(r.created_at).toLocaleTimeString()}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
