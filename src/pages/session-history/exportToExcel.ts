import * as XLSX from "xlsx";
import type { Tables } from "@/integrations/supabase/types";
import { parseOptionItems, parseRatingConfig, optionTexts } from "@/pages/slide-editor/types";

type SessionRow = Tables<"sessions">;
type SlideRow = Tables<"slides">;
type ResponseRow = Tables<"responses">;

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bgDark: "FF080810", bgSurface: "FF0F0F1A", bgHeader: "FF1A1030",
  bgViolet: "FF2D1B69", bgEmerald: "FF0D2B22", bgAccent: "FF1E1040",
  violet: "FFB197FC", violetDim: "FF7C3AED", emerald: "FF34D399",
  white: "FFFFFFFF", white60: "99FFFFFF", white40: "66FFFFFF", white20: "33FFFFFF",
  gold: "FFFBBF24", silver: "FFC0C0C0",
};

type BS = { style: string; color: { rgb: string } };
type CB = { top?: BS; bottom?: BS; left?: BS; right?: BS };
type CS = { font?: { bold?: boolean; sz?: number; color?: { rgb: string }; name?: string }; fill?: { fgColor: { rgb: string } }; alignment?: { horizontal?: string; vertical?: string; wrapText?: boolean }; border?: CB };

const thin = (rgb = C.white20): CB => ({ top: { style: "thin", color: { rgb } }, bottom: { style: "thin", color: { rgb } }, left: { style: "thin", color: { rgb } }, right: { style: "thin", color: { rgb } } });

const s: Record<string, CS> = {
  title:      { font: { bold: true, sz: 18, color: { rgb: C.violet }, name: "Calibri" }, fill: { fgColor: { rgb: C.bgDark } }, alignment: { horizontal: "left", vertical: "center" } },
  subtitle:   { font: { sz: 11, color: { rgb: C.white60 }, name: "Calibri" }, fill: { fgColor: { rgb: C.bgDark } }, alignment: { horizontal: "left", vertical: "center" } },
  secHdr:     { font: { bold: true, sz: 10, color: { rgb: C.violet }, name: "Calibri" }, fill: { fgColor: { rgb: C.bgHeader } }, alignment: { horizontal: "left", vertical: "center" }, border: thin(C.violetDim) },
  hdr:        { font: { bold: true, sz: 10, color: { rgb: C.white }, name: "Calibri" }, fill: { fgColor: { rgb: C.bgViolet } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: thin(C.violetDim) },
  hdrL:       { font: { bold: true, sz: 10, color: { rgb: C.white }, name: "Calibri" }, fill: { fgColor: { rgb: C.bgViolet } }, alignment: { horizontal: "left", vertical: "center", wrapText: true }, border: thin(C.violetDim) },
  data:       { font: { sz: 10, color: { rgb: C.white }, name: "Calibri" }, fill: { fgColor: { rgb: C.bgSurface } }, alignment: { horizontal: "left", vertical: "center", wrapText: true }, border: thin(C.white20) },
  dataAlt:    { font: { sz: 10, color: { rgb: C.white }, name: "Calibri" }, fill: { fgColor: { rgb: "FF0C0C18" } }, alignment: { horizontal: "left", vertical: "center", wrapText: true }, border: thin(C.white20) },
  dataC:      { font: { sz: 10, color: { rgb: C.white }, name: "Calibri" }, fill: { fgColor: { rgb: C.bgSurface } }, alignment: { horizontal: "center", vertical: "center" }, border: thin(C.white20) },
  mono:       { font: { sz: 10, color: { rgb: C.violet }, name: "Courier New" }, fill: { fgColor: { rgb: C.bgSurface } }, alignment: { horizontal: "center", vertical: "center" }, border: thin(C.white20) },
  statVal:    { font: { bold: true, sz: 14, color: { rgb: C.violet }, name: "Courier New" }, fill: { fgColor: { rgb: C.bgAccent } }, alignment: { horizontal: "center", vertical: "center" }, border: thin(C.violetDim) },
  statLbl:    { font: { sz: 9, color: { rgb: C.white40 }, name: "Calibri" }, fill: { fgColor: { rgb: C.bgAccent } }, alignment: { horizontal: "center", vertical: "center" }, border: thin(C.violetDim) },
  correct:    { font: { bold: true, sz: 10, color: { rgb: C.emerald }, name: "Calibri" }, fill: { fgColor: { rgb: C.bgEmerald } }, alignment: { horizontal: "left", vertical: "center" }, border: thin(C.emerald) },
  barFill:    { font: { sz: 9, color: { rgb: C.bgDark }, name: "Calibri" }, fill: { fgColor: { rgb: C.violetDim } }, alignment: { horizontal: "center", vertical: "center" }, border: thin(C.violetDim) },
  barEmpty:   { font: { sz: 9, color: { rgb: C.white20 }, name: "Calibri" }, fill: { fgColor: { rgb: C.bgSurface } }, alignment: { horizontal: "left", vertical: "center" }, border: thin(C.white20) },
  empty:      { fill: { fgColor: { rgb: C.bgDark } } },
  gold:       { font: { bold: true, sz: 10, color: { rgb: C.gold }, name: "Calibri" }, fill: { fgColor: { rgb: "FF2B2000" } }, alignment: { horizontal: "left", vertical: "center" }, border: thin(C.gold) },
  goldC:      { font: { bold: true, sz: 10, color: { rgb: C.gold }, name: "Courier New" }, fill: { fgColor: { rgb: "FF2B2000" } }, alignment: { horizontal: "center", vertical: "center" }, border: thin(C.gold) },
  silver:     { font: { sz: 10, color: { rgb: C.silver }, name: "Courier New" }, fill: { fgColor: { rgb: C.bgSurface } }, alignment: { horizontal: "center", vertical: "center" }, border: thin(C.white20) },
  emeraldTxt: { font: { sz: 10, color: { rgb: C.emerald }, name: "Calibri" }, fill: { fgColor: { rgb: C.bgSurface } }, alignment: { horizontal: "left", vertical: "center", wrapText: true }, border: thin(C.white20) },
};

// ─── Low-level helpers ────────────────────────────────────────────────────────
function sc(ws: XLSX.WorkSheet, col: number, row: number, v: string | number, style: CS = {}) {
  ws[XLSX.utils.encode_cell({ c: col, r: row })] = { v, t: typeof v === "number" ? "n" : "s", s: style } as XLSX.CellObject;
}
function mg(ws: XLSX.WorkSheet, c1: number, r1: number, c2: number, r2: number) {
  if (!ws["!merges"]) ws["!merges"] = [];
  ws["!merges"].push({ s: { c: c1, r: r1 }, e: { c: c2, r: r2 } });
}
function blank(ws: XLSX.WorkSheet, row: number, cols: number) {
  for (let c = 0; c < cols; c++) sc(ws, c, row, "", s.empty);
}

interface BarArgs { ws: XLSX.WorkSheet; row: number; label: string; count: number; total: number; maxCount: number; barCols: number; labelStyle: CS; isTop: boolean }
function drawBar({ ws, row, label, count, total, maxCount, barCols, labelStyle, isTop }: BarArgs) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const filled = maxCount > 0 ? Math.round((count / maxCount) * barCols) : 0;
  sc(ws, 0, row, label, isTop ? s.gold : labelStyle);
  sc(ws, 1, row, count, s.mono);
  sc(ws, 2, row, `${pct}%`, s.mono);
  for (let i = 0; i < barCols; i++) sc(ws, 3 + i, row, i < filled ? " " : "", i < filled ? s.barFill : s.barEmpty);
}

function sheetTabName(index: number, question: string): string {
  const clean = question.replaceAll(/[\\/*?[\]:]/gu, "").trim().slice(0, 24);
  return clean ? `Q${index + 1} – ${clean}` : `Q${index + 1}`;
}

// ─── Choice sheet (MC / Poll / Quiz) ─────────────────────────────────────────
function buildChoiceSheet(slide: SlideRow, responses: ResponseRow[], isQuiz: boolean): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = { "!ref": "A1" };
  const items = parseOptionItems(slide.options);
  const options = optionTexts(items);
  const BAR = 10; const COLS = 3 + BAR; let row = 0;

  sc(ws, 0, row, slide.question || "Untitled", s.title); mg(ws, 0, row, COLS - 1, row); row++;
  sc(ws, 0, row, `Type: ${isQuiz ? "Quiz" : "Multiple Choice"}  ·  ${responses.length} responses`, s.subtitle); mg(ws, 0, row, COLS - 1, row); row++;
  blank(ws, row, COLS); row++;

  sc(ws, 0, row, "Option", s.hdrL); sc(ws, 1, row, "Votes", s.hdr); sc(ws, 2, row, "%", s.hdr);
  sc(ws, 3, row, "Distribution", s.hdr); mg(ws, 3, row, COLS - 1, row);
  for (let i = 4; i < COLS; i++) sc(ws, i, row, "", s.hdr);
  row++;

  const counts = options.map((opt) => responses.filter((r) => r.value === opt).length);
  const maxCount = Math.max(...counts, 1);
  options.forEach((opt, i) => {
    const isCorrect = isQuiz && items[i]?.is_correct === true;
    drawBar({ ws, row, label: isCorrect ? `✓ ${opt}` : opt, count: counts[i], total: responses.length, maxCount, barCols: BAR, labelStyle: isCorrect ? s.correct : s.data, isTop: false });
    row++;
  });

  blank(ws, row, COLS); row++;
  sc(ws, 0, row, "RAW RESPONSES", s.secHdr); mg(ws, 0, row, COLS - 1, row); row++;
  sc(ws, 0, row, "Participant", s.hdr); sc(ws, 1, row, "Answer", s.hdrL); mg(ws, 1, row, 3, row);
  sc(ws, 4, row, "Timestamp", s.hdr); mg(ws, 4, row, COLS - 1, row); row++;
  responses.forEach((r) => {
    sc(ws, 0, row, r.participant_id.slice(0, 8), s.mono);
    sc(ws, 1, row, r.value, s.data); mg(ws, 1, row, 3, row);
    sc(ws, 4, row, new Date(r.created_at).toLocaleString(), s.data); mg(ws, 4, row, COLS - 1, row); row++;
  });

  ws["!ref"] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: COLS - 1, r: row - 1 } });
  ws["!cols"] = [{ wch: 32 }, { wch: 8 }, { wch: 7 }, ...new Array(BAR).fill({ wch: 2 })];
  ws["!rows"] = Array.from({ length: row }, (_, i) => ({ hpt: i < 2 ? 22 : 18 }));
  return ws;
}

// ─── Word Cloud sheet ─────────────────────────────────────────────────────────
function buildWordCloudSheet(slide: SlideRow, responses: ResponseRow[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = { "!ref": "A1" };
  const BAR = 8; const COLS = 3 + BAR; let row = 0;

  sc(ws, 0, row, slide.question || "Untitled", s.title); mg(ws, 0, row, COLS - 1, row); row++;
  sc(ws, 0, row, `Type: Word Cloud  ·  ${responses.length} responses`, s.subtitle); mg(ws, 0, row, COLS - 1, row); row++;
  blank(ws, row, COLS); row++;

  const freq = new Map<string, number>();
  responses.forEach((r) => r.value.trim().toLowerCase().split(/\s+/).forEach((w) => freq.set(w, (freq.get(w) ?? 0) + 1)));
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  const maxFreq = sorted[0]?.[1] ?? 1;

  sc(ws, 0, row, "Word", s.hdrL); sc(ws, 1, row, "Count", s.hdr); sc(ws, 2, row, "%", s.hdr);
  sc(ws, 3, row, "Frequency", s.hdr); mg(ws, 3, row, COLS - 1, row);
  for (let i = 4; i < COLS; i++) sc(ws, i, row, "", s.hdr);
  row++;

  sorted.slice(0, 40).forEach(([word, count], i) => {
    drawBar({ ws, row, label: word, count, total: responses.length, maxCount: maxFreq, barCols: BAR, labelStyle: s.data, isTop: i === 0 });
    row++;
  });

  blank(ws, row, COLS); row++;
  sc(ws, 0, row, "ALL RESPONSES", s.secHdr); mg(ws, 0, row, COLS - 1, row); row++;
  sc(ws, 0, row, "Participant", s.hdr); sc(ws, 1, row, "Response", s.hdrL); mg(ws, 1, row, 3, row);
  sc(ws, 4, row, "Timestamp", s.hdr); mg(ws, 4, row, COLS - 1, row); row++;
  responses.forEach((r) => {
    sc(ws, 0, row, r.participant_id.slice(0, 8), s.mono);
    sc(ws, 1, row, r.value, s.data); mg(ws, 1, row, 3, row);
    sc(ws, 4, row, new Date(r.created_at).toLocaleString(), s.data); mg(ws, 4, row, COLS - 1, row); row++;
  });

  ws["!ref"] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: COLS - 1, r: row - 1 } });
  ws["!cols"] = [{ wch: 20 }, { wch: 8 }, { wch: 7 }, ...new Array(BAR).fill({ wch: 2 })];
  ws["!rows"] = Array.from({ length: row }, () => ({ hpt: 18 }));
  return ws;
}

// ─── Open Text sheet ──────────────────────────────────────────────────────────
function buildOpenTextSheet(slide: SlideRow, responses: ResponseRow[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = { "!ref": "A1" };
  const COLS = 6; let row = 0;

  sc(ws, 0, row, slide.question || "Untitled", s.title); mg(ws, 0, row, COLS - 1, row); row++;
  sc(ws, 0, row, `Type: Open Text  ·  ${responses.length} responses`, s.subtitle); mg(ws, 0, row, COLS - 1, row); row++;
  blank(ws, row, COLS); row++;

  sc(ws, 0, row, "#", s.hdr); sc(ws, 1, row, "Participant", s.hdr);
  sc(ws, 2, row, "Response", s.hdrL); mg(ws, 2, row, COLS - 2, row);
  sc(ws, COLS - 1, row, "Timestamp", s.hdr); row++;

  responses.forEach((r, i) => {
    sc(ws, 0, row, i + 1, s.dataC); sc(ws, 1, row, r.participant_id.slice(0, 8), s.mono);
    sc(ws, 2, row, r.value, s.data); mg(ws, 2, row, COLS - 2, row);
    sc(ws, COLS - 1, row, new Date(r.created_at).toLocaleString(), s.data); row++;
  });

  ws["!ref"] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: COLS - 1, r: row - 1 } });
  ws["!cols"] = [{ wch: 5 }, { wch: 12 }, { wch: 50 }, { wch: 10 }, { wch: 10 }, { wch: 20 }];
  ws["!rows"] = Array.from({ length: row }, () => ({ hpt: 20 }));
  return ws;
}

// ─── Rating Scale sheet ───────────────────────────────────────────────────────
function buildRatingSheet(slide: SlideRow, responses: ResponseRow[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = { "!ref": "A1" };
  const { min, max } = parseRatingConfig(slide.options);
  const BAR = 10; const COLS = 3 + BAR; let row = 0;

  const values = responses.map((r) => Number(r.value)).filter((v) => !Number.isNaN(v));
  const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const buckets = Array.from({ length: max - min + 1 }, (_, i) => ({ val: min + i, count: values.filter((v) => v === min + i).length }));
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  sc(ws, 0, row, slide.question || "Untitled", s.title); mg(ws, 0, row, COLS - 1, row); row++;
  sc(ws, 0, row, `Type: Rating Scale (${min}–${max})  ·  ${responses.length} responses`, s.subtitle); mg(ws, 0, row, COLS - 1, row); row++;
  blank(ws, row, COLS); row++;

  // KPI row
  sc(ws, 0, row, "Average", s.statLbl); mg(ws, 0, row, 1, row);
  sc(ws, 2, row, "Min", s.statLbl); sc(ws, 3, row, "Max", s.statLbl); sc(ws, 4, row, "Responses", s.statLbl); row++;
  sc(ws, 0, row, avg.toFixed(2), s.statVal); mg(ws, 0, row, 1, row);
  sc(ws, 2, row, values.length > 0 ? Math.min(...values) : "—", s.statVal);
  sc(ws, 3, row, values.length > 0 ? Math.max(...values) : "—", s.statVal);
  sc(ws, 4, row, values.length, s.statVal); row++;
  blank(ws, row, COLS); row++;

  sc(ws, 0, row, "Rating", s.hdr); sc(ws, 1, row, "Count", s.hdr); sc(ws, 2, row, "%", s.hdr);
  sc(ws, 3, row, "Distribution", s.hdr); mg(ws, 3, row, COLS - 1, row);
  for (let i = 4; i < COLS; i++) sc(ws, i, row, "", s.hdr);
  row++;

  buckets.forEach(({ val, count }) => {
    drawBar({ ws, row, label: String(val), count, total: values.length, maxCount, barCols: BAR, labelStyle: s.data, isTop: val === Math.round(avg) });
    row++;
  });

  ws["!ref"] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: COLS - 1, r: row - 1 } });
  ws["!cols"] = [{ wch: 10 }, { wch: 8 }, { wch: 7 }, ...new Array(BAR).fill({ wch: 2 })];
  ws["!rows"] = Array.from({ length: row }, () => ({ hpt: 20 }));
  return ws;
}

// ─── Ranking sheet ────────────────────────────────────────────────────────────
function buildRankingSheet(slide: SlideRow, responses: ResponseRow[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = { "!ref": "A1" };
  const items = parseOptionItems(slide.options);
  const options = optionTexts(items);
  const BAR = 10; const COLS = 4 + BAR; let row = 0;

  const n = options.length;
  const scores = new Map<string, number>();
  options.forEach((o) => scores.set(o, 0));
  responses.forEach((r) => {
    try { const ranked: string[] = JSON.parse(r.value); ranked.forEach((item, idx) => scores.set(item, (scores.get(item) ?? 0) + (n - idx))); } catch { /* skip */ }
  });
  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const maxScore = Math.max(...sorted.map(([, v]) => v), 1);

  sc(ws, 0, row, slide.question || "Untitled", s.title); mg(ws, 0, row, COLS - 1, row); row++;
  sc(ws, 0, row, `Type: Ranking  ·  ${responses.length} responses`, s.subtitle); mg(ws, 0, row, COLS - 1, row); row++;
  blank(ws, row, COLS); row++;

  sc(ws, 0, row, "Rank", s.hdr); sc(ws, 1, row, "Option", s.hdrL);
  sc(ws, 2, row, "Score", s.hdr); sc(ws, 3, row, "%", s.hdr);
  sc(ws, 4, row, "Score Distribution", s.hdr); mg(ws, 4, row, COLS - 1, row);
  for (let i = 5; i < COLS; i++) sc(ws, i, row, "", s.hdr);
  row++;

  sorted.forEach(([item, score], i) => {
    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const filled = Math.round((score / maxScore) * BAR);
    let rankStyle = s.mono;
    if (i === 0) rankStyle = s.goldC;
    else if (i === 1) rankStyle = s.silver;
    const labelStyle = i === 0 ? s.gold : s.data;
    sc(ws, 0, row, `#${i + 1}`, rankStyle);
    sc(ws, 1, row, item, labelStyle);
    sc(ws, 2, row, score, s.mono);
    sc(ws, 3, row, `${pct}%`, s.mono);
    for (let j = 0; j < BAR; j++) sc(ws, 4 + j, row, j < filled ? " " : "", j < filled ? s.barFill : s.barEmpty);
    row++;
  });

  blank(ws, row, COLS); row++;
  sc(ws, 0, row, "RAW RESPONSES", s.secHdr); mg(ws, 0, row, COLS - 1, row); row++;
  sc(ws, 0, row, "Participant", s.hdr);
  sc(ws, 1, row, "Ranked Order (1st → last)", s.hdrL); mg(ws, 1, row, COLS - 2, row);
  sc(ws, COLS - 1, row, "Timestamp", s.hdr); row++;
  responses.forEach((r) => {
    let ranked: string[] = [];
    try { ranked = JSON.parse(r.value); } catch { ranked = [r.value]; }
    sc(ws, 0, row, r.participant_id.slice(0, 8), s.mono);
    sc(ws, 1, row, ranked.join(" → "), s.data); mg(ws, 1, row, COLS - 2, row);
    sc(ws, COLS - 1, row, new Date(r.created_at).toLocaleString(), s.data); row++;
  });

  ws["!ref"] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: COLS - 1, r: row - 1 } });
  ws["!cols"] = [{ wch: 7 }, { wch: 30 }, { wch: 8 }, { wch: 7 }, ...new Array(BAR).fill({ wch: 2 })];
  ws["!rows"] = Array.from({ length: row }, () => ({ hpt: 18 }));
  return ws;
}

// ─── Summary sheet ────────────────────────────────────────────────────────────
function buildSummarySheet(presentation: { title: string }, session: SessionRow, slides: SlideRow[], responses: ResponseRow[], uniqueParticipants: number): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = { "!ref": "A1" };
  const COLS = 8; let row = 0;

  sc(ws, 0, row, presentation.title, s.title); mg(ws, 0, row, COLS - 1, row); row++;
  sc(ws, 0, row, "Session Report  ·  PulseLive", s.subtitle); mg(ws, 0, row, COLS - 1, row); row++;
  blank(ws, row, COLS); row++;

  sc(ws, 0, row, "SESSION DETAILS", s.secHdr); mg(ws, 0, row, COLS - 1, row); row++;
  const meta: [string, string][] = [
    ["Session Code", session.join_code],
    ["Date", new Date(session.created_at).toLocaleString()],
    ["Status", session.is_active ? "Active" : "Closed"],
  ];
  meta.forEach(([k, v]) => {
    sc(ws, 0, row, k, s.hdrL); mg(ws, 0, row, 1, row);
    const valStyle = k === "Status" && session.is_active ? s.emeraldTxt : s.data;
    sc(ws, 2, row, v, valStyle); mg(ws, 2, row, COLS - 1, row); row++;
  });
  blank(ws, row, COLS); row++;

  sc(ws, 0, row, "OVERVIEW", s.secHdr); mg(ws, 0, row, COLS - 1, row); row++;
  const kpis = [
    { label: "Total Responses", value: responses.length },
    { label: "Unique Participants", value: uniqueParticipants },
    { label: "Questions", value: slides.length },
    { label: "Avg Responses / Q", value: slides.length > 0 ? (responses.length / slides.length).toFixed(1) : "0" },
  ];
  kpis.forEach((k, i) => { sc(ws, i * 2, row, k.label, s.statLbl); mg(ws, i * 2, row, i * 2 + 1, row); }); row++;
  kpis.forEach((k, i) => { sc(ws, i * 2, row, k.value, s.statVal); mg(ws, i * 2, row, i * 2 + 1, row); }); row++;
  blank(ws, row, COLS); row++;

  sc(ws, 0, row, "QUESTION SUMMARY", s.secHdr); mg(ws, 0, row, COLS - 1, row); row++;
  sc(ws, 0, row, "#", s.hdr);
  sc(ws, 1, row, "Question", s.hdrL); mg(ws, 1, row, 3, row);
  sc(ws, 4, row, "Type", s.hdr);
  sc(ws, 5, row, "Responses", s.hdr);
  sc(ws, 6, row, "Top Answer / Insight", s.hdrL); mg(ws, 6, row, COLS - 1, row);
  row++;

  slides.forEach((slide, i) => {
    const sr = responses.filter((r) => r.slide_id === slide.id);
    const count = sr.length;
    let insight = "";

    if (["multiple_choice", "poll", "quiz"].includes(slide.type)) {
      const freq = new Map<string, number>();
      sr.forEach((r) => freq.set(r.value, (freq.get(r.value) ?? 0) + 1));
      const top = [...freq.entries()].sort((a, b) => b[1] - a[1])[0];
      if (top) insight = `"${top[0]}" — ${top[1]} votes (${Math.round((top[1] / count) * 100)}%)`;
    } else if (slide.type === "rating_scale") {
      const vals = sr.map((r) => Number(r.value)).filter((v) => !Number.isNaN(v));
      if (vals.length) insight = `Avg: ${(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)}`;
    } else if (slide.type === "word_cloud") {
      const freq = new Map<string, number>();
      sr.forEach((r) => r.value.trim().toLowerCase().split(/\s+/).forEach((w) => freq.set(w, (freq.get(w) ?? 0) + 1)));
      const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w]) => w);
      if (top.length) insight = `Top words: ${top.join(", ")}`;
    } else if (slide.type === "ranking") {
      const opts = optionTexts(parseOptionItems(slide.options));
      const sc2 = new Map<string, number>();
      opts.forEach((o) => sc2.set(o, 0));
      sr.forEach((r) => { try { const ranked: string[] = JSON.parse(r.value); ranked.forEach((item, idx) => sc2.set(item, (sc2.get(item) ?? 0) + (opts.length - idx))); } catch { /* skip */ } });
      const top = [...sc2.entries()].sort((a, b) => b[1] - a[1])[0];
      if (top) insight = `#1: "${top[0]}"`;
    } else if (slide.type === "open_text") {
      insight = `${count} free-text responses`;
    }

    const rowStyle = i % 2 === 0 ? s.data : s.dataAlt;
    sc(ws, 0, row, i + 1, { ...rowStyle, alignment: { horizontal: "center" } });
    sc(ws, 1, row, slide.question || "Untitled", rowStyle); mg(ws, 1, row, 3, row);
    sc(ws, 4, row, slide.type.replaceAll("_", " "), rowStyle);
    sc(ws, 5, row, count, { ...rowStyle, font: { ...rowStyle.font, color: { rgb: C.violet } }, alignment: { horizontal: "center" } });
    sc(ws, 6, row, insight, rowStyle); mg(ws, 6, row, COLS - 1, row);
    row++;
  });

  ws["!ref"] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: COLS - 1, r: row - 1 } });
  ws["!cols"] = [{ wch: 5 }, { wch: 22 }, { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 10 }, { wch: 32 }, { wch: 10 }];
  ws["!rows"] = Array.from({ length: row }, (_, i) => ({ hpt: i < 2 ? 26 : 20 }));
  return ws;
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function exportToExcel(presentation: { title: string }, slides: SlideRow[], responses: ResponseRow[], session: SessionRow) {
  const wb = XLSX.utils.book_new();
  const uniqueParticipants = new Set(responses.map((r) => r.participant_id)).size;

  XLSX.utils.book_append_sheet(wb, buildSummarySheet(presentation, session, slides, responses, uniqueParticipants), "📊 Summary");

  slides.forEach((slide, i) => {
    const sr = responses.filter((r) => r.slide_id === slide.id);
    let ws: XLSX.WorkSheet;
    switch (slide.type) {
      case "multiple_choice": case "poll": ws = buildChoiceSheet(slide, sr, false); break;
      case "quiz":            ws = buildChoiceSheet(slide, sr, true);  break;
      case "word_cloud":      ws = buildWordCloudSheet(slide, sr);     break;
      case "open_text":       ws = buildOpenTextSheet(slide, sr);      break;
      case "rating_scale":    ws = buildRatingSheet(slide, sr);        break;
      case "ranking":         ws = buildRankingSheet(slide, sr);       break;
      default:                ws = buildOpenTextSheet(slide, sr);      break;
    }
    XLSX.utils.book_append_sheet(wb, ws, sheetTabName(i, slide.question ?? ""));
  });

  XLSX.writeFile(wb, `${presentation.title.replaceAll(/[^a-z0-9]/gi, "_")}_${session.join_code}.xlsx`);
}

export function parseOptions(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") return JSON.parse(raw);
  return structuredClone(raw) as string[];
}
