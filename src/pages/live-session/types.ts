import type { Tables } from "@/integrations/supabase/types";

export type SessionRow = Tables<"sessions">;
export type SlideRow = Tables<"slides">;
export type ResponseRow = Tables<"responses">;

export interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number;
}
