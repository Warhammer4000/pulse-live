import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Copy, Cloud, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TYPE_ICONS, TYPE_LABELS } from "./types";
import type { SlideRow, SlideType } from "./types";

interface Props {
  readonly slide: SlideRow;
  readonly canDelete: boolean;
  readonly isDuplicating: boolean;
  readonly onTypeChange: (type: SlideType) => void;
  readonly onDuplicate: () => void;
  readonly onDelete: () => void;
  readonly onSave: (question: string, options: string[]) => void;
}

function parseOptions(raw: SlideRow["options"]): string[] {
  if (Array.isArray(raw)) return raw as string[];
  const str = typeof raw === "string" ? raw : "[]";
  return JSON.parse(str) as string[];
}

export function SlideEditorForm({ slide, canDelete, isDuplicating, onTypeChange, onDuplicate, onDelete, onSave }: Props) {
  const [localQuestion, setLocalQuestion] = useState(slide.question);
  const [localOptions, setLocalOptions] = useState<string[]>(() => parseOptions(slide.options));

  useEffect(() => {
    setLocalQuestion(slide.question);
    setLocalOptions(parseOptions(slide.options));
  }, [slide.id]);

  useEffect(() => {
    const timer = setTimeout(() => onSave(localQuestion, localOptions), 500);
    return () => clearTimeout(timer);
  }, [localQuestion, localOptions]);

  const addOption = () =>
    setLocalOptions((prev) => [...prev, `Option ${String.fromCodePoint(65 + prev.length)}`]);
  const removeOption = (i: number) =>
    setLocalOptions((prev) => prev.filter((_, idx) => idx !== i));
  const updateOption = (i: number, val: string) =>
    setLocalOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)));

  return (
    <motion.div
      key={slide.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mx-auto max-w-2xl p-8 space-y-6"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Edit Slide</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/8 h-8 px-3 text-xs"
            onClick={onDuplicate}
            disabled={isDuplicating}
          >
            <Copy className="mr-1 h-3 w-3" /> Duplicate
          </Button>
          <Button
            size="sm"
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 h-8 px-3 text-xs"
            onClick={onDelete}
            disabled={!canDelete}
          >
            <Trash2 className="mr-1 h-3 w-3" /> Delete
          </Button>
        </div>
      </div>

      {/* Type */}
      <div className="space-y-1.5">
        <Label className="text-white/60 text-sm">Slide Type</Label>
        <Select value={slide.type} onValueChange={(v) => onTypeChange(v as SlideType)}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-primary/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0f0f1a] border-white/10 text-white">
            {(["multiple_choice", "word_cloud", "open_text"] as SlideType[]).map((t) => {
              const Icon = TYPE_ICONS[t];
              return (
                <SelectItem key={t} value={t} className="focus:accent-surface focus:accent-text">
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {TYPE_LABELS[t]}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Question */}
      <div className="space-y-1.5">
        <Label className="text-white/60 text-sm">Question</Label>
        <Textarea
          value={localQuestion}
          onChange={(e) => setLocalQuestion(e.target.value)}
          placeholder="Type your question here..."
          className="min-h-[100px] text-base bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary/30 focus-visible:border-primary/50 resize-none"
        />
      </div>

      {/* Options */}
      {slide.type === "multiple_choice" && (
        <div className="space-y-3">
          <Label className="text-white/60 text-sm">Answer Options</Label>
          <AnimatePresence mode="popLayout">
            {localOptions.map((opt, i) => (
              <motion.div
                key={opt + i}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg accent-surface text-xs font-mono font-semibold accent-text">
                  {String.fromCodePoint(65 + i)}
                </span>
                <Input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${String.fromCodePoint(65 + i)}`}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary/30 focus-visible:border-primary/50"
                />
                <Button
                  size="icon"
                  className="h-8 w-8 shrink-0 bg-transparent hover:bg-red-500/10 text-white/30 hover:text-red-400 border-0"
                  onClick={() => removeOption(i)}
                  disabled={localOptions.length <= 2}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
          {localOptions.length < 6 && (
            <Button
              size="sm"
              className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/8 h-8 text-xs"
              onClick={addOption}
            >
              <Plus className="mr-1 h-3 w-3" /> Add Option
            </Button>
          )}
        </div>
      )}

      {slide.type === "word_cloud" && (
        <div className="rounded-2xl border border-dashed border-white/10 py-8 text-center">
          <Cloud className="mx-auto mb-2 h-8 w-8 text-white/20" />
          <p className="text-white/50 text-sm">Audience submits words or short phrases</p>
          <p className="text-white/30 text-xs mt-1">Results appear as a dynamic word cloud</p>
        </div>
      )}

      {slide.type === "open_text" && (
        <div className="rounded-2xl border border-dashed border-white/10 py-8 text-center">
          <MessageSquare className="mx-auto mb-2 h-8 w-8 text-white/20" />
          <p className="text-white/50 text-sm">Audience submits free-text responses</p>
          <p className="text-white/30 text-xs mt-1">Results appear as a scrolling feed</p>
        </div>
      )}

      {/* Preview */}
      <div className="rounded-2xl border border-white/8 bg-white/5 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/5">
          <p className="text-xs text-white/40 uppercase tracking-widest font-medium">Audience Preview</p>
        </div>
        <div className="p-6">
          <p
            className="text-center text-xl font-semibold text-white tracking-tight"
            style={{ textWrap: "balance" as React.CSSProperties["textWrap"] }}
          >
            {localQuestion || "Your question will appear here"}
          </p>
          {slide.type === "multiple_choice" && (
            <div className="mt-5 space-y-2">
              {localOptions.map((opt, i) => (
                <div key={opt + i} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 p-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg accent-bg text-xs font-mono font-bold text-white">
                    {String.fromCodePoint(65 + i)}
                  </span>
                  <span className="text-sm font-medium text-white">{opt}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
