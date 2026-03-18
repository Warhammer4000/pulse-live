import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, GripVertical, MessageSquare, BarChart3, Cloud, Copy, Play } from "lucide-react";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type SlideRow = Tables<"slides">;
type SlideType = Enums<"slide_type">;

const TYPE_ICONS: Record<SlideType, React.ElementType> = {
  multiple_choice: BarChart3,
  word_cloud: Cloud,
  open_text: MessageSquare,
};

const TYPE_LABELS: Record<SlideType, string> = {
  multiple_choice: "Multiple Choice",
  word_cloud: "Word Cloud",
  open_text: "Open Text",
};

function SortableSlideItem({ slide, index, isSelected, onSelect }: {
  slide: SlideRow; index: number; isSelected: boolean; onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id });
  const Icon = TYPE_ICONS[slide.type];
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 10 : undefined }}>
      <button
        onClick={onSelect}
        className={cn(
          "group flex w-full items-center gap-2 rounded-xl p-2.5 text-left text-sm transition-all",
          isSelected ? "bg-violet-500/10 text-violet-400 border border-violet-500/20" : "text-white/50 hover:bg-white/5 hover:text-white border border-transparent"
        )}
      >
        <span {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}
          className="flex shrink-0 cursor-grab items-center text-white/20 hover:text-white/50 active:cursor-grabbing">
          <GripVertical className="h-3.5 w-3.5" />
        </span>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/5 text-xs font-mono font-medium">
          {index + 1}
        </span>
        <span className="flex-1 truncate">{slide.question || "Untitled"}</span>
        <Icon className="h-3.5 w-3.5 shrink-0 opacity-40" />
      </button>
    </div>
  );
}

export default function SlideEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { data: presentation } = useQuery({
    queryKey: ["presentation", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("presentations").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: slides = [] } = useQuery({
    queryKey: ["slides", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("slides").select("*").eq("presentation_id", id!).order("order");
      if (error) throw error;
      return data as SlideRow[];
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (slides.length > 0 && !selectedSlideId) setSelectedSlideId(slides[0].id);
  }, [slides, selectedSlideId]);

  const selectedSlide = slides.find((s) => s.id === selectedSlideId);

  const addSlideMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = slides.length > 0 ? Math.max(...slides.map((s) => s.order)) + 1 : 0;
      const { data, error } = await supabase.from("slides").insert({
        presentation_id: id!, order: maxOrder, type: "multiple_choice" as const,
        question: "", options: JSON.stringify(["Option A", "Option B"]),
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ["slides", id] }); setSelectedSlideId(data.id); },
  });

  const duplicateSlideMutation = useMutation({
    mutationFn: async (src: SlideRow) => {
      const maxOrder = slides.length > 0 ? Math.max(...slides.map((s) => s.order)) + 1 : 0;
      const { data, error } = await supabase.from("slides").insert({
        presentation_id: id!, order: maxOrder, type: src.type, question: src.question, options: src.options,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["slides", id] });
      setSelectedSlideId(data.id);
      toast({ title: "Slide duplicated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteSlideMutation = useMutation({
    mutationFn: async (slideId: string) => {
      const { error } = await supabase.from("slides").delete().eq("id", slideId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slides", id] });
      const remaining = slides.filter((s) => s.id !== selectedSlideId);
      setSelectedSlideId(remaining[0]?.id ?? null);
    },
  });

  const updateSlideMutation = useMutation({
    mutationFn: async ({ slideId, data }: { slideId: string; data: Partial<Pick<SlideRow, "question" | "type" | "options">> }) => {
      const { error } = await supabase.from("slides").update(data).eq("id", slideId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["slides", id] }),
  });

  const reorderSlidesMutation = useMutation({
    mutationFn: async (reordered: { id: string; order: number }[]) => {
      await Promise.all(reordered.map((s) => supabase.from("slides").update({ order: s.order }).eq("id", s.id)));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["slides", id] }),
  });

  const updateTitleMutation = useMutation({
    mutationFn: async (title: string) => {
      const { error } = await supabase.from("presentations").update({ title }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["presentation", id] }),
  });

  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const { data: existing } = await supabase.from("sessions").select("*")
        .eq("presentation_id", id!).eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (existing) return existing;
      const joinCode = Math.floor(100000 + Math.random() * 900000).toString();
      const { data, error } = await supabase.from("sessions").insert({
        presentation_id: id!, join_code: joinCode, active_slide_id: slides[0]?.id ?? null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => navigate(`/present/${data.id}`),
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const [localQuestion, setLocalQuestion] = useState("");
  const [localOptions, setLocalOptions] = useState<string[]>([]);

  useEffect(() => {
    if (selectedSlide) {
      setLocalQuestion(selectedSlide.question);
      const opts = selectedSlide.options;
      setLocalOptions(Array.isArray(opts) ? (opts as string[]) : JSON.parse(typeof opts === "string" ? opts : "[]"));
    }
  }, [selectedSlide?.id]);

  useEffect(() => {
    if (!selectedSlide) return;
    const timer = setTimeout(() => {
      updateSlideMutation.mutate({ slideId: selectedSlide.id, data: { question: localQuestion, options: JSON.stringify(localOptions) } });
    }, 500);
    return () => clearTimeout(timer);
  }, [localQuestion, localOptions]);

  const handleTypeChange = (type: SlideType) => {
    if (!selectedSlide) return;
    updateSlideMutation.mutate({ slideId: selectedSlide.id, data: { type } });
  };

  const addOption = () => setLocalOptions([...localOptions, `Option ${String.fromCharCode(65 + localOptions.length)}`]);
  const removeOption = (i: number) => setLocalOptions(localOptions.filter((_, idx) => idx !== i));
  const updateOption = (i: number, val: string) => setLocalOptions(localOptions.map((o, idx) => idx === i ? val : o));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = slides.findIndex((s) => s.id === active.id);
    const newIndex = slides.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(slides, oldIndex, newIndex);
    queryClient.setQueryData(["slides", id], reordered);
    reorderSlidesMutation.mutate(reordered.map((s, i) => ({ id: s.id, order: i })));
  };

  return (
    <div className="flex h-screen bg-[#080810] text-white">
      {/* Sidebar */}
      <div className="flex w-60 flex-col border-r border-white/5 bg-[#080810] shrink-0">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-white/5 p-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/8 shrink-0"
            onClick={() => navigate("/dashboard/presentations")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <input
            value={presentation?.title ?? ""}
            onChange={(e) => updateTitleMutation.mutate(e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-white placeholder:text-white/30 outline-none truncate"
            placeholder="Untitled"
          />
        </div>

        {/* Slide list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {slides.map((slide, i) => (
                <SortableSlideItem key={slide.id} slide={slide} index={i}
                  isSelected={selectedSlideId === slide.id} onSelect={() => setSelectedSlideId(slide.id)} />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Add slide */}
        <div className="border-t border-white/5 p-2 space-y-2">
          <Button className="w-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/8 h-9 text-sm"
            onClick={() => addSlideMutation.mutate()} disabled={addSlideMutation.isPending}>
            <Plus className="mr-2 h-3.5 w-3.5" /> Add Slide
          </Button>
          <Button className="w-full bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-lg shadow-violet-900/40 h-9 text-sm"
            onClick={() => startSessionMutation.mutate()} disabled={startSessionMutation.isPending || slides.length === 0}>
            <Play className="mr-2 h-3.5 w-3.5" /> Present
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        {selectedSlide ? (
          <motion.div key={selectedSlide.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }} className="mx-auto max-w-2xl p-8 space-y-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Edit Slide</h2>
              <div className="flex gap-2">
                <Button size="sm" className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/8 h-8 px-3 text-xs"
                  onClick={() => duplicateSlideMutation.mutate(selectedSlide)} disabled={duplicateSlideMutation.isPending}>
                  <Copy className="mr-1 h-3 w-3" /> Duplicate
                </Button>
                <Button size="sm" className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 h-8 px-3 text-xs"
                  onClick={() => deleteSlideMutation.mutate(selectedSlide.id)} disabled={slides.length <= 1}>
                  <Trash2 className="mr-1 h-3 w-3" /> Delete
                </Button>
              </div>
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label className="text-white/60 text-sm">Slide Type</Label>
              <Select value={selectedSlide.type} onValueChange={(v) => handleTypeChange(v as SlideType)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-violet-500/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0f0f1a] border-white/10 text-white">
                  {(["multiple_choice", "word_cloud", "open_text"] as SlideType[]).map((t) => {
                    const Icon = TYPE_ICONS[t];
                    return (
                      <SelectItem key={t} value={t} className="focus:bg-violet-500/10 focus:text-violet-400">
                        <span className="flex items-center gap-2"><Icon className="h-4 w-4" />{TYPE_LABELS[t]}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Question */}
            <div className="space-y-1.5">
              <Label className="text-white/60 text-sm">Question</Label>
              <Textarea value={localQuestion} onChange={(e) => setLocalQuestion(e.target.value)}
                placeholder="Type your question here..."
                className="min-h-[100px] text-base bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-violet-500/30 focus-visible:border-violet-500/50 resize-none" />
            </div>

            {/* Options */}
            {selectedSlide.type === "multiple_choice" && (
              <div className="space-y-3">
                <Label className="text-white/60 text-sm">Answer Options</Label>
                <AnimatePresence mode="popLayout">
                  {localOptions.map((opt, i) => (
                    <motion.div key={i} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-xs font-mono font-semibold text-violet-400">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <Input value={opt} onChange={(e) => updateOption(i, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-violet-500/30 focus-visible:border-violet-500/50" />
                      <Button size="icon" className="h-8 w-8 shrink-0 bg-transparent hover:bg-red-500/10 text-white/30 hover:text-red-400 border-0"
                        onClick={() => removeOption(i)} disabled={localOptions.length <= 2}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {localOptions.length < 6 && (
                  <Button size="sm" className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/8 h-8 text-xs"
                    onClick={addOption}>
                    <Plus className="mr-1 h-3 w-3" /> Add Option
                  </Button>
                )}
              </div>
            )}

            {selectedSlide.type === "word_cloud" && (
              <div className="rounded-2xl border border-dashed border-white/10 py-8 text-center">
                <Cloud className="mx-auto mb-2 h-8 w-8 text-white/20" />
                <p className="text-white/50 text-sm">Audience submits words or short phrases</p>
                <p className="text-white/30 text-xs mt-1">Results appear as a dynamic word cloud</p>
              </div>
            )}

            {selectedSlide.type === "open_text" && (
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
                <p className="text-center text-xl font-semibold text-white tracking-tight" style={{ textWrap: "balance" as any }}>
                  {localQuestion || "Your question will appear here"}
                </p>
                {selectedSlide.type === "multiple_choice" && (
                  <div className="mt-5 space-y-2">
                    {localOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 p-3.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-xs font-mono font-bold text-white">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-sm font-medium text-white">{opt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex h-full items-center justify-center text-white/30 text-sm">
            Select a slide to edit
          </div>
        )}
      </div>
    </div>
  );
}
