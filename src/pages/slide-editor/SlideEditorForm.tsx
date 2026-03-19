import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Copy, Cloud, MessageSquare, Star, ListOrdered, ThumbsUp, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TYPE_ICONS, TYPE_LABELS, parseOptionItems, parseRatingConfig } from "./types";
import type { SlideRow, SlideType, OptionItem } from "./types";

interface Props {
  readonly slide: SlideRow;
  readonly canDelete: boolean;
  readonly isDuplicating: boolean;
  readonly onTypeChange: (type: SlideType) => void;
  readonly onDuplicate: () => void;
  readonly onDelete: () => void;
  readonly onSave: (question: string, options: unknown) => void;
}

export function SlideEditorForm({ slide, canDelete, isDuplicating, onTypeChange, onDuplicate, onDelete, onSave }: Props) {
  const [localQuestion, setLocalQuestion] = useState(slide.question);
  const [localOptions, setLocalOptions] = useState<OptionItem[]>(() => parseOptionItems(slide.options));
  const [ratingConfig, setRatingConfig] = useState(() => parseRatingConfig(slide.options));
  const [pollStyle, setPollStyle] = useState<string[]>(() => {
    const items = parseOptionItems(slide.options);
    return items.length > 0 ? items.map((i) => i.text) : ["Yes", "No"];
  });
  const [imageUrl, setImageUrl] = useState((slide as any).image_url ?? "");

  useEffect(() => {
    setLocalQuestion(slide.question);
    setLocalOptions(parseOptionItems(slide.options));
    setRatingConfig(parseRatingConfig(slide.options));
    const items = parseOptionItems(slide.options);
    setPollStyle(items.length > 0 ? items.map((i) => i.text) : ["Yes", "No"]);
    setImageUrl((slide as any).image_url ?? "");
  }, [slide.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      let opts: unknown;
      if (slide.type === "rating_scale") {
        opts = ratingConfig;
      } else if (slide.type === "poll") {
        opts = pollStyle;
      } else if (slide.type === "multiple_choice" || slide.type === "quiz" || slide.type === "ranking") {
        opts = localOptions;
      } else {
        opts = [];
      }
      onSave(localQuestion, opts);
    }, 500);
    return () => clearTimeout(timer);
  }, [localQuestion, localOptions, ratingConfig, pollStyle]);

  const addOption = () =>
    setLocalOptions((prev) => [...prev, { text: `Option ${String.fromCodePoint(65 + prev.length)}` }]);
  const removeOption = (i: number) =>
    setLocalOptions((prev) => prev.filter((_, idx) => idx !== i));
  const updateOptionText = (i: number, val: string) =>
    setLocalOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, text: val } : o)));
  const updateOptionImage = (i: number, url: string) =>
    setLocalOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, image_url: url || undefined } : o)));
  const toggleCorrect = (i: number) =>
    setLocalOptions((prev) => prev.map((o, idx) => ({ ...o, is_correct: idx === i })));

  const needsOptions = slide.type === "multiple_choice" || slide.type === "quiz" || slide.type === "ranking";

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
          <Button size="sm" className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/8 h-8 px-3 text-xs" onClick={onDuplicate} disabled={isDuplicating}>
            <Copy className="mr-1 h-3 w-3" /> Duplicate
          </Button>
          <Button size="sm" className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 h-8 px-3 text-xs" onClick={onDelete} disabled={!canDelete}>
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
            {(["multiple_choice", "word_cloud", "open_text", "rating_scale", "quiz", "ranking", "poll"] as SlideType[]).map((t) => {
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

      {/* Question-level image URL */}
      <div className="space-y-1.5">
        <Label className="text-white/60 text-sm flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5" /> Question Image (optional)
        </Label>
        <Input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://i.imgur.com/example.jpg"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary/30 focus-visible:border-primary/50"
        />
        {imageUrl && (
          <img src={imageUrl} alt="Question" className="mt-2 max-h-32 rounded-xl border border-white/10 object-cover" loading="lazy" />
        )}
      </div>

      {/* Options for MC / Quiz / Ranking */}
      {needsOptions && (
        <div className="space-y-3">
          <Label className="text-white/60 text-sm">
            {slide.type === "ranking" ? "Items to Rank" : "Answer Options"}
          </Label>
          <AnimatePresence mode="popLayout">
            {localOptions.map((opt, i) => (
              <motion.div
                key={`opt-${i}`}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg accent-surface text-xs font-mono font-semibold accent-text">
                    {String.fromCodePoint(65 + i)}
                  </span>
                  <Input
                    value={opt.text}
                    onChange={(e) => updateOptionText(i, e.target.value)}
                    placeholder={`Option ${String.fromCodePoint(65 + i)}`}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary/30 focus-visible:border-primary/50"
                  />
                  {slide.type === "quiz" && (
                    <button
                      type="button"
                      onClick={() => toggleCorrect(i)}
                      className={`shrink-0 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                        opt.is_correct ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-white/30 border border-white/8 hover:text-white/50"
                      }`}
                    >
                      {opt.is_correct ? "✓ Correct" : "Mark correct"}
                    </button>
                  )}
                  <Button
                    size="icon"
                    className="h-8 w-8 shrink-0 bg-transparent hover:bg-red-500/10 text-white/30 hover:text-red-400 border-0"
                    onClick={() => removeOption(i)}
                    disabled={localOptions.length <= 2}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {/* Image URL for MC and Quiz options */}
                {(slide.type === "multiple_choice" || slide.type === "quiz") && (
                  <div className="ml-10 flex items-center gap-2">
                    <Input
                      value={opt.image_url ?? ""}
                      onChange={(e) => updateOptionImage(i, e.target.value)}
                      placeholder="Image URL (optional)"
                      className="h-8 text-xs bg-white/5 border-white/8 text-white/60 placeholder:text-white/20 focus-visible:ring-primary/30"
                    />
                    {opt.image_url && (
                      <img src={opt.image_url} alt={opt.text} className="h-8 w-8 rounded object-cover border border-white/10" loading="lazy" />
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {localOptions.length < 8 && (
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

      {/* Rating Scale config */}
      {slide.type === "rating_scale" && (
        <div className="space-y-3">
          <Label className="text-white/60 text-sm">Scale Range</Label>
          <Select value={String(ratingConfig.max)} onValueChange={(v) => setRatingConfig({ min: 1, max: Number(v) })}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-primary/30 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0f0f1a] border-white/10 text-white">
              <SelectItem value="5" className="focus:accent-surface focus:accent-text">1 – 5 stars</SelectItem>
              <SelectItem value="10" className="focus:accent-surface focus:accent-text">1 – 10 scale</SelectItem>
            </SelectContent>
          </Select>
          <div className="rounded-2xl border border-dashed border-white/10 py-8 text-center">
            <Star className="mx-auto mb-2 h-8 w-8 text-white/20" />
            <p className="text-white/50 text-sm">Audience rates on a {ratingConfig.min}–{ratingConfig.max} scale</p>
            <p className="text-white/30 text-xs mt-1">Results shown as average + distribution</p>
          </div>
        </div>
      )}

      {/* Poll config */}
      {slide.type === "poll" && (
        <div className="space-y-3">
          <Label className="text-white/60 text-sm">Poll Style</Label>
          <Select value={pollStyle.join(",")} onValueChange={(v) => setPollStyle(v.split(","))}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-primary/30 w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0f0f1a] border-white/10 text-white">
              <SelectItem value="Yes,No" className="focus:accent-surface focus:accent-text">Yes / No</SelectItem>
              <SelectItem value="Yes,No,Maybe" className="focus:accent-surface focus:accent-text">Yes / No / Maybe</SelectItem>
              <SelectItem value="👍,👎" className="focus:accent-surface focus:accent-text">👍 / 👎</SelectItem>
            </SelectContent>
          </Select>
          <div className="rounded-2xl border border-dashed border-white/10 py-8 text-center">
            <ThumbsUp className="mx-auto mb-2 h-8 w-8 text-white/20" />
            <p className="text-white/50 text-sm">Quick poll: {pollStyle.join(" / ")}</p>
            <p className="text-white/30 text-xs mt-1">Results shown as a donut chart</p>
          </div>
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
          {imageUrl && (
            <img src={imageUrl} alt="Question" className="mx-auto mb-4 max-h-40 rounded-xl border border-white/10 object-cover" loading="lazy" />
          )}
          <p
            className="text-center text-xl font-semibold text-white tracking-tight"
            style={{ textWrap: "balance" as React.CSSProperties["textWrap"] }}
          >
            {localQuestion || "Your question will appear here"}
          </p>
          {(slide.type === "multiple_choice" || slide.type === "quiz") && (
            <div className="mt-5 space-y-2">
              {localOptions.map((opt, i) => (
                <div key={`preview-${i}`} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 p-3.5">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-mono font-bold text-white ${
                    slide.type === "quiz" && opt.is_correct ? "bg-emerald-500" : "accent-bg"
                  }`}>
                    {String.fromCodePoint(65 + i)}
                  </span>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {opt.image_url && (
                      <img src={opt.image_url} alt={opt.text} className="h-10 w-10 rounded object-cover border border-white/10 shrink-0" loading="lazy" />
                    )}
                    <span className="text-sm font-medium text-white truncate">{opt.text}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {slide.type === "ranking" && (
            <div className="mt-5 space-y-2">
              {localOptions.map((opt, i) => (
                <div key={`rank-${i}`} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 p-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg accent-bg text-xs font-mono font-bold text-white">{i + 1}</span>
                  <span className="text-sm font-medium text-white">{opt.text}</span>
                </div>
              ))}
            </div>
          )}
          {slide.type === "rating_scale" && (
            <div className="mt-5 flex items-center justify-center gap-1">
              {Array.from({ length: ratingConfig.max }, (_, i) => (
                <Star key={i} className={`h-8 w-8 ${i < 3 ? "fill-primary text-primary" : "text-white/20"}`} />
              ))}
            </div>
          )}
          {slide.type === "poll" && (
            <div className="mt-5 flex items-center justify-center gap-3">
              {pollStyle.map((opt) => (
                <div key={opt} className="rounded-xl border border-white/8 bg-white/5 px-6 py-3 text-sm font-medium text-white">
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
