import { useState } from "react";
import { motion } from "framer-motion";
import { Check, GripVertical, Star } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BarChartViz } from "@/components/visualizations/BarChartViz";
import { WordCloudViz } from "@/components/visualizations/WordCloudViz";
import { ResponseFeed } from "@/components/visualizations/ResponseFeed";
import { RatingViz } from "@/components/visualizations/RatingViz";
import { QuizViz } from "@/components/visualizations/QuizViz";
import { RankingViz } from "@/components/visualizations/RankingViz";
import { PollViz } from "@/components/visualizations/PollViz";
import { cn } from "@/lib/utils";
import { resolveRatingConfig, resolveOptionItems } from "./utils";
import type { SlideRow, ResponseRow } from "./types";

function SortableRankItem({ id, index, label }: { readonly id: string; readonly index: number; readonly label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-xl border p-3 transition-colors select-none",
        isDragging
          ? "border-violet-500/40 bg-violet-500/10 shadow-lg shadow-violet-900/30 z-50"
          : "border-white/8 bg-white/5"
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-xs font-mono font-bold text-violet-400">
        {index + 1}
      </span>
      <span className="flex-1 text-sm font-medium text-white">{label}</span>
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none p-1 text-white/30 hover:text-white/60 transition-colors"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
    </div>
  );
}

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
  readonly showHeader?: boolean;
}

export function SlideContent({
  votingLocked, isSubmitted, activeSlide, options, responses,
  selectedOption, textResponse, isPending, onSelectOption, onTextChange, onSubmitText,
  showHeader = false,
}: SlideContentProps) {
  const [rankingOrder, setRankingOrder] = useState<string[]>(() => [...options]);
  const optionItems = resolveOptionItems(activeSlide.options);
  const ratingConfig = resolveRatingConfig(activeSlide.options);
  const imageUrl = (activeSlide as any).image_url as string | null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setRankingOrder((items) => {
        const from = items.indexOf(active.id as string);
        const to = items.indexOf(over.id as string);
        return arrayMove(items, from, to);
      });
    }
  };

  const header = showHeader && (
    <>
      <h2
        className="mb-4 text-center text-2xl font-semibold tracking-tight text-white"
        style={{ textWrap: "balance" as React.CSSProperties["textWrap"] }}
      >
        {activeSlide.question}
      </h2>
      {imageUrl && (
        <div className="mb-6 flex justify-center">
          <img
            src={imageUrl}
            alt=""
            className="max-h-64 w-auto rounded-2xl border border-white/10 object-contain shadow-lg"
            loading="lazy"
          />
        </div>
      )}
    </>
  );

  if (votingLocked) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-3 py-8 text-center">
        {header}
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
        {header}
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
          {activeSlide.type === "rating_scale" && <RatingViz min={ratingConfig.min} max={ratingConfig.max} responses={responses} />}
          {activeSlide.type === "quiz" && <QuizViz options={optionItems.map((o) => ({ id: "", ...o }))} responses={responses} />}
          {activeSlide.type === "ranking" && <RankingViz options={options} responses={responses} />}
          {activeSlide.type === "poll" && <PollViz options={options} responses={responses} />}
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
      {header}
      {/* Multiple Choice */}
      {activeSlide.type === "multiple_choice" && (
        <div className="space-y-3">
          {optionItems.map((opt, i) => (
            <motion.button key={opt.text} whileTap={{ scale: 0.98 }}
              onClick={() => onSelectOption(opt.text)}
              disabled={isPending}
              className={cn(
                "flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition-all",
                selectedOption === opt.text
                  ? "border-primary/50 accent-surface"
                  : "border-white/8 bg-white/5 hover:border-white/15 hover:bg-white/8"
              )}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl accent-bg text-sm font-mono font-bold text-white">
                {String.fromCodePoint(65 + i)}
              </span>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {opt.image_url && (
                  <img src={opt.image_url} alt={opt.text} className="h-12 w-12 rounded-lg object-cover border border-white/10 shrink-0" loading="lazy" />
                )}
                <span className="text-lg font-medium text-white">{opt.text}</span>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Quiz (same as MC) */}
      {activeSlide.type === "quiz" && (
        <div className="space-y-3">
          {optionItems.map((opt, i) => (
            <motion.button key={opt.text} whileTap={{ scale: 0.98 }}
              onClick={() => onSelectOption(opt.text)}
              disabled={isPending}
              className={cn(
                "flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition-all",
                selectedOption === opt.text
                  ? "border-primary/50 accent-surface"
                  : "border-white/8 bg-white/5 hover:border-white/15 hover:bg-white/8"
              )}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl accent-bg text-sm font-mono font-bold text-white">
                {String.fromCodePoint(65 + i)}
              </span>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {opt.image_url && (
                  <img src={opt.image_url} alt={opt.text} className="h-12 w-12 rounded-lg object-cover border border-white/10 shrink-0" loading="lazy" />
                )}
                <span className="text-lg font-medium text-white">{opt.text}</span>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Rating Scale */}
      {activeSlide.type === "rating_scale" && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-1">
            {Array.from({ length: ratingConfig.max - ratingConfig.min + 1 }, (_, i) => {
              const val = ratingConfig.min + i;
              const selected = selectedOption === String(val);
              return (
                <motion.button
                  key={val}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onSelectOption(String(val))}
                  disabled={isPending}
                  className="p-1"
                >
                  <Star className={`h-10 w-10 transition-colors ${
                    selected || (selectedOption && val <= Number(selectedOption))
                      ? "fill-primary text-primary"
                      : "text-white/20 hover:text-white/40"
                  }`} />
                </motion.button>
              );
            })}
          </div>
          {selectedOption && (
            <p className="text-sm text-white/40">You selected {selectedOption} / {ratingConfig.max}</p>
          )}
        </div>
      )}

      {/* Ranking */}
      {activeSlide.type === "ranking" && (
        <div className="space-y-2">
          <p className="text-sm text-white/40 text-center mb-3">Drag to reorder, then submit</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={rankingOrder} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {rankingOrder.map((item, i) => (
                  <SortableRankItem key={item} id={item} index={i} label={item} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <Button
            onClick={() => onSubmitText(JSON.stringify(rankingOrder))}
            disabled={isPending}
            className="w-full h-14 text-base accent-bg accent-bg-hover text-white border-0 accent-shadow mt-3"
          >
            Submit Ranking
          </Button>
        </div>
      )}

      {/* Poll */}
      {activeSlide.type === "poll" && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {options.map((opt) => (
            <motion.button
              key={opt}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectOption(opt)}
              disabled={isPending}
              className={cn(
                "rounded-2xl border px-8 py-5 text-lg font-semibold transition-all",
                selectedOption === opt
                  ? "border-primary/50 accent-surface text-white"
                  : "border-white/8 bg-white/5 text-white hover:border-white/15 hover:bg-white/8"
              )}
            >
              {opt}
            </motion.button>
          ))}
        </div>
      )}

      {/* Word Cloud */}
      {activeSlide.type === "word_cloud" && (
        <form onSubmit={handleTextSubmit} className="space-y-4">
          <Input value={textResponse} onChange={(e) => onTextChange(e.target.value)}
            placeholder="Type a word or short phrase..." maxLength={50}
            className="h-14 text-lg text-center bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary/30 focus-visible:border-primary/50" />
          <Button type="submit" disabled={!textResponse.trim() || isPending}
            className="w-full h-14 text-base accent-bg accent-bg-hover text-white border-0 accent-shadow">
            Submit
          </Button>
        </form>
      )}

      {/* Open Text */}
      {activeSlide.type === "open_text" && (
        <form onSubmit={handleTextSubmit} className="space-y-4">
          <Textarea value={textResponse} onChange={(e) => onTextChange(e.target.value)}
            placeholder="Type your response..."
            className="min-h-[120px] text-base bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary/30 focus-visible:border-primary/50" />
          <Button type="submit" disabled={!textResponse.trim() || isPending}
            className="w-full h-14 text-base accent-bg accent-bg-hover text-white border-0 accent-shadow">
            Submit
          </Button>
        </form>
      )}
    </>
  );
}
