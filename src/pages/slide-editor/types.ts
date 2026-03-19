import { BarChart3, Cloud, MessageSquare, Star, Trophy, ListOrdered, ThumbsUp, ImageIcon } from "lucide-react";
import type { Tables, Enums } from "@/integrations/supabase/types";

export type SlideRow = Tables<"slides">;
export type SlideType = Enums<"slide_type">;

/** Unified option object used in MC, Quiz, and Ranking */
export interface OptionItem {
  text: string;
  image_url?: string;
  is_correct?: boolean;
}

export const TYPE_ICONS: Record<SlideType, React.ElementType> = {
  multiple_choice: BarChart3,
  word_cloud: Cloud,
  open_text: MessageSquare,
  rating_scale: Star,
  quiz: Trophy,
  ranking: ListOrdered,
  poll: ThumbsUp,
};

export const TYPE_LABELS: Record<SlideType, string> = {
  multiple_choice: "Multiple Choice",
  word_cloud: "Word Cloud",
  open_text: "Open Text",
  rating_scale: "Rating Scale",
  quiz: "Quiz",
  ranking: "Ranking",
  poll: "Poll",
};

/** Parse JSONB options into OptionItem[], handling legacy plain string arrays */
export function parseOptionItems(raw: unknown): OptionItem[] {
  if (!raw) return [];
  let arr: unknown[];
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (typeof raw === "string") {
    try { arr = JSON.parse(raw); } catch { return []; }
  } else {
    return [];
  }
  return arr.map((item) => {
    if (typeof item === "string") return { text: item };
    if (typeof item === "object" && item !== null && "text" in item) return item as OptionItem;
    return { text: String(item) };
  });
}

/** Extract plain text labels from option items */
export function optionTexts(items: OptionItem[]): string[] {
  return items.map((i) => i.text);
}

/** Parse rating scale config from options JSONB */
export function parseRatingConfig(raw: unknown): { min: number; max: number } {
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "min" in raw && "max" in raw) {
    return { min: Number((raw as Record<string, unknown>).min), max: Number((raw as Record<string, unknown>).max) };
  }
  return { min: 1, max: 5 };
}
