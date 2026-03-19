import { motion, AnimatePresence } from "framer-motion";
import { BarChartViz } from "@/components/visualizations/BarChartViz";
import { WordCloudViz } from "@/components/visualizations/WordCloudViz";
import { ResponseFeed } from "@/components/visualizations/ResponseFeed";
import type { Tables } from "@/integrations/supabase/types";

type SlideRow = Tables<"slides">;
type ResponseRow = Tables<"responses">;

interface Props {
  activeSlide: SlideRow;
  responses: ResponseRow[];
  showResults: boolean;
}

function parseOptions(raw: SlideRow["options"]): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}

export function SlideStage({ activeSlide, responses, showResults }: Readonly<Props>) {
  const options = parseOptions(activeSlide.options);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlide.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
          className="w-full max-w-4xl text-center"
        >
          <h2
            className="mb-8 text-5xl font-semibold tracking-tight text-white"
            style={{ textWrap: "balance" as React.CSSProperties["textWrap"] }}
          >
            {activeSlide.question ?? "Waiting for question..."}
          </h2>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              {activeSlide.type === "multiple_choice" && <BarChartViz options={options} responses={responses} />}
              {activeSlide.type === "word_cloud" && <WordCloudViz responses={responses} />}
              {activeSlide.type === "open_text" && <ResponseFeed responses={responses} />}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
