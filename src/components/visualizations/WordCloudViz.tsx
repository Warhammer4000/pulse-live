import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type ResponseRow = Tables<"responses">;

interface WordCloudVizProps {
  responses: ResponseRow[];
}

export function WordCloudViz({ responses }: WordCloudVizProps) {
  const wordMap = useMemo(() => {
    const map = new Map<string, number>();
    responses.forEach((r) => {
      const word = r.value.toLowerCase().trim();
      map.set(word, (map.get(word) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40);
  }, [responses]);

  const maxFreq = Math.max(...wordMap.map(([, c]) => c), 1);

  if (wordMap.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        Waiting for responses...
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-8">
      <AnimatePresence mode="popLayout">
        {wordMap.map(([word, count]) => {
          const scale = 0.75 + (count / maxFreq) * 1.5;
          const opacity = 0.5 + (count / maxFreq) * 0.5;
          return (
            <motion.span
              key={word}
              layout
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="inline-block rounded-xl bg-primary/10 px-4 py-2 font-semibold text-primary"
              style={{ fontSize: `${scale}rem` }}
            >
              {word}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
