import * as XLSX from "xlsx";
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
  const rows: (string | number)[][] = [
    ["Presentation", "Session Code", "Session Date", "Slide #", "Question", "Type", "Response", "Participant ID", "Timestamp"],
  ];

  slides.forEach((slide, i) => {
    const slideResponses = responses.filter((r) => r.slide_id === slide.id);
    if (slideResponses.length === 0) {
      rows.push([presentation.title, session.join_code, new Date(session.created_at).toLocaleDateString(), i + 1, slide.question, slide.type, "(no responses)", "", ""]);
    } else {
      slideResponses.forEach((r) => {
        rows.push([presentation.title, session.join_code, new Date(session.created_at).toLocaleDateString(), i + 1, slide.question, slide.type, r.value, r.participant_id.slice(0, 8), new Date(r.created_at).toLocaleString()]);
      });
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Auto-width columns
  const colWidths = rows[0].map((_, colIdx) =>
    Math.max(...rows.map((row) => String(row[colIdx] ?? "").length)) + 2
  );
  ws["!cols"] = colWidths.map((w) => ({ wch: w }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Responses");

  const filename = `${presentation.title.replaceAll(/[^a-z0-9]/gi, "_")}_${session.join_code}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function parseOptions(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") return JSON.parse(raw);
  return structuredClone(raw) as string[];
}
