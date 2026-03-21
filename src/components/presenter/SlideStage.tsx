import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  quizStarted?: boolean;
  onStartQuizTimer?: () => void;
  onResetQuizTimer?: () => void;
}

export function SlideStage({
  activeSlide,
  responses,
  showResults,
  quizTimeLeft,
  quizTotalSeconds,
  quizStarted,
  onStartQuizTimer,
  onResetQuizTimer,
}: Readonly<Props>) {
  const optionItems = parseOptionItems(activeSlide.options);
  const options = optionTexts(optionItems);
  const ratingConfig = parseRatingConfig(activeSlide.options);
  const imageUrl = (activeSlide as any).image_url;
  const hasTimer = quizTotalSeconds !== null && quizTotalSeconds !== undefined && quizTotalSeconds > 0;
  const isQuizWithTimer = activeSlide.type === "quiz" && hasTimer;
  const timerExpired = isQuizWithTimer && quizStarted && quizTimeLeft === 0;

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

          {/* Quiz timer: not started yet — show Start button */}
          {isQuizWithTimer && !quizStarted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <p className="text-white/40 text-lg">Options are hidden from participants</p>
              <p className="text-white/60 text-sm font-mono">{quizTotalSeconds}s countdown</p>
              <Button
                onClick={onStartQuizTimer}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-lg px-8 py-6 gap-2"
              >
                <Play className="h-5 w-5" />
                Start Quiz
              </Button>
            </motion.div>
          )}

          {/* Quiz timer: running or expired — show countdown */}
          {isQuizWithTimer && quizStarted && quizTimeLeft !== null && quizTimeLeft !== undefined && (
            <div className="mb-6 flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "font-mono text-3xl font-bold tabular-nums",
                  quizTimeLeft <= 5 ? "text-red-400 animate-pulse" : quizTimeLeft <= 10 ? "text-amber-400" : "text-emerald-400",
                )}>
                  {quizTimeLeft === 0 ? "Time's up!" : `${quizTimeLeft}s`}
                </span>
                {timerExpired && onResetQuizTimer && (
                  <Button
                    onClick={onResetQuizTimer}
                    size="sm"
                    variant="ghost"
                    className="text-white/40 hover:text-white hover:bg-white/10 gap-1"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </Button>
                )}
              </div>
              {quizTimeLeft > 0 && (
                <div className="h-2 w-64 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      quizTimeLeft <= 5 ? "bg-red-500" : quizTimeLeft <= 10 ? "bg-amber-500" : "bg-emerald-500",
                    )}
                    initial={{ width: "100%" }}
                    animate={{ width: `${(quizTimeLeft / quizTotalSeconds) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Results: show for non-quiz, or for quiz when started */}
          {showResults && (!isQuizWithTimer || quizStarted) && (
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
