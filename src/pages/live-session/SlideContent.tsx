import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BarChartViz } from "@/components/visualizations/BarChartViz";
import { WordCloudViz } from "@/components/visualizations/WordCloudViz";
import { ResponseFeed } from "@/components/visualizations/ResponseFeed";
import { cn } from "@/lib/utils";
import type { SlideRow, ResponseRow } from "./types";

export interface SlideContentProps {
  readonly votingLocked: boolean;
  readonly isSubmitted: boolean;
  readonly activeSlide: SlideRow;
  readonly options: string[];
  readonly responses: ResponseRow[];
  readonly selectedOption: string | null;
  readonly textResponse: string;
  readonly isPending: boolean;
  readonly onSelectOption: (opt: string) => void;
  readonly onTextChange: (val: string) => void;
  readonly onSubmitText: (val: string) => void;
}

export function SlideContent({
  votingLocked, isSubmitted, activeSlide, options, responses,
  selectedOption, textResponse, isPending, onSelectOption, onTextChange, onSubmitText,
}: SlideContentProps) {
  if (votingLocked) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10">
          <span className="text-2xl">🔒</span>
        </div>
        <p className="text-lg font-medium text-white">Voting is locked</p>
        <p className="text-sm text-white/40">Wait for the presenter to open voting</p>
      </motion.div>
    );
  }

  if (isSubmitted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 py-3 text-emerald-400">
          <Check className="h-5 w-5" />
          <span className="font-medium">Response submitted!</span>
        </motion.div>
        <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
          <p className="mb-4 text-center text-xs font-medium text-white/40 uppercase tracking-widest">Live Results</p>
          {activeSlide.type === "multiple_choice" && <BarChartViz options={options} responses={responses} />}
          {activeSlide.type === "word_cloud" && <WordCloudViz responses={responses} />}
          {activeSlide.type === "open_text" && <ResponseFeed responses={responses} />}
        </div>
      </motion.div>
    );
  }

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textResponse.trim()) onSubmitText(textResponse.trim());
  };

  return (
    <>
      {activeSlide.type === "multiple_choice" && (
        <div className="space-y-3">
          {options.map((opt, i) => (
            <motion.button key={opt} whileTap={{ scale: 0.98 }}
              onClick={() => onSelectOption(opt)}
              disabled={isPending}
              className={cn(
                "flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition-all",
                selectedOption === opt
                  ? "border-violet-500/50 bg-violet-500/10"
                  : "border-white/8 bg-white/5 hover:border-white/15 hover:bg-white/8"
              )}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-sm font-mono font-bold text-white">
                {String.fromCodePoint(65 + i)}
              </span>
              <span className="text-lg font-medium text-white">{opt}</span>
            </motion.button>
          ))}
        </div>
      )}
      {activeSlide.type === "word_cloud" && (
        <form onSubmit={handleTextSubmit} className="space-y-4">
          <Input value={textResponse} onChange={(e) => onTextChange(e.target.value)}
            placeholder="Type a word or short phrase..." maxLength={50}
            className="h-14 text-lg text-center bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-violet-500/30 focus-visible:border-violet-500/50" />
          <Button type="submit" disabled={!textResponse.trim() || isPending}
            className="w-full h-14 text-base bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-lg shadow-violet-900/40">
            Submit
          </Button>
        </form>
      )}
      {activeSlide.type === "open_text" && (
        <form onSubmit={handleTextSubmit} className="space-y-4">
          <Textarea value={textResponse} onChange={(e) => onTextChange(e.target.value)}
            placeholder="Type your response..."
            className="min-h-[120px] text-base bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-violet-500/30 focus-visible:border-violet-500/50" />
          <Button type="submit" disabled={!textResponse.trim() || isPending}
            className="w-full h-14 text-base bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-lg shadow-violet-900/40">
            Submit
          </Button>
        </form>
      )}
    </>
  );
}
