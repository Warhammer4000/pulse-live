import { motion, AnimatePresence } from "framer-motion";
import { BarChartViz } from "@/components/visualizations/BarChartViz";
import { WordCloudViz } from "@/components/visualizations/WordCloudViz";
import { ResponseFeed } from "@/components/visualizations/ResponseFeed";
import { RatingViz } from "@/components/visualizations/RatingViz";
import { QuizViz } from "@/components/visualizations/QuizViz";
import { RankingViz } from "@/components/visualizations/RankingViz";
import { PollViz } from "@/components/visualizations/PollViz";
import { parseOptionItems, optionTexts, parseRatingConfig } from "@/pages/slide-editor/types";
import type { Tables } from "@/integrations/supabase/types";

type SlideRow = Tables<"slides">;
type ResponseRow = Tables<"responses">;

interface Props {
  activeSlide: SlideRow;
  responses: ResponseRow[];
  showResults: boolean;
  quizTimeLeft?: number | null;
  quizTotalSeconds?: number | null;
}

export function SlideStage({ activeSlide, responses, showResults }: Readonly<Props>) {
  const optionItems = parseOptionItems(activeSlide.options);
  const options = optionTexts(optionItems);
  const ratingConfig = parseRatingConfig(activeSlide.options);
  const imageUrl = (activeSlide as any).image_url;

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
          {imageUrl && (
            <img src={imageUrl} alt="" className="mx-auto mb-6 max-h-48 rounded-2xl border border-white/10 object-cover" loading="lazy" />
          )}
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
              {activeSlide.type === "rating_scale" && <RatingViz min={ratingConfig.min} max={ratingConfig.max} responses={responses} />}
              {activeSlide.type === "quiz" && <QuizViz options={optionItems} responses={responses} />}
              {activeSlide.type === "ranking" && <RankingViz options={options} responses={responses} />}
              {activeSlide.type === "poll" && <PollViz options={options} responses={responses} />}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
