import { BarChart3, Cloud, MessageSquare } from "lucide-react";
import type { Tables, Enums } from "@/integrations/supabase/types";

export type SlideRow = Tables<"slides">;
export type SlideType = Enums<"slide_type">;

export const TYPE_ICONS: Record<SlideType, React.ElementType> = {
  multiple_choice: BarChart3,
  word_cloud: Cloud,
  open_text: MessageSquare,
};

export const TYPE_LABELS: Record<SlideType, string> = {
  multiple_choice: "Multiple Choice",
  word_cloud: "Word Cloud",
  open_text: "Open Text",
};
