import { BarChart3, Cloud, MessageSquare } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type SlideRow = Tables<"slides">;
type ResponseRow = Tables<"responses">;

const slideTypeIcon = { multiple_choice: BarChart3, word_cloud: Cloud, open_text: MessageSquare };

export function SlideList({ slides, responses, activeSlideId, onSelect }: Readonly<{
  slides: SlideRow[];
  responses: ResponseRow[];
  activeSlideId: string | undefined;
  onSelect: (id: string) => void;
}>) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-white/40 uppercase tracking-widest mb-3">Slides</p>
      {slides.map((slide, i) => {
        const count = responses.filter((r) => r.slide_id === slide.id).length;
        const Icon = slideTypeIcon[slide.type];
        return (
          <button
            key={slide.id}
            onClick={() => onSelect(slide.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl p-3 text-left text-sm transition-all",
              activeSlideId === slide.id
                ? "accent-surface accent-text border accent-border"
                : "text-white/50 hover:bg-white/5 hover:text-white border border-transparent"
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-mono font-semibold">
              {i + 1}
            </span>
            <span className="flex-1 truncate">{slide.question || "Untitled"}</span>
            <Icon className="h-3.5 w-3.5 shrink-0 opacity-50" />
            <span className="font-mono text-xs opacity-50">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
