import type { Tables } from "@/integrations/supabase/types";

type SessionRow = Tables<"sessions">;
type SlideRow = Tables<"slides">;
type ResponseRow = Tables<"responses">;

export function exportToCSV(
  presentation: { title: string },
  slides: SlideRow[],
  responses: ResponseRow[],
  session: SessionRow
) {
  const rows: string[][] = [
    ["Presentation", "Session Code", "Session Date", "Slide #", "Question", "Type", "Response", "Participant ID", "Timestamp"],
  ];
  slides.forEach((slide, i) => {
    const slideResponses = responses.filter((r) => r.slide_id === slide.id);
    if (slideResponses.length === 0) {
      rows.push([presentation.title, session.join_code, new Date(session.created_at).toLocaleDateString(), String(i + 1), slide.question, slide.type, "(no responses)", "", ""]);
    } else {
      slideResponses.forEach((r) => {
        rows.push([presentation.title, session.join_code, new Date(session.created_at).toLocaleDateString(), String(i + 1), slide.question, slide.type, r.value, r.participant_id.slice(0, 8), new Date(r.created_at).toLocaleString()]);
      });
    }
  });
  const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${presentation.title.replaceAll(/[^a-z0-9]/gi, "_")}_${session.join_code}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseOptions(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") return JSON.parse(raw);
  return structuredClone(raw) as string[];
}
