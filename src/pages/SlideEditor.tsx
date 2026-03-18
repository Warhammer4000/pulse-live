import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, GripVertical, MessageSquare, BarChart3, Cloud, Copy } from "lucide-react";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type SlideRow = Tables<"slides">;
type SlideType = Enums<"slide_type">;

const SLIDE_TYPE_ICONS: Record<SlideType, React.ReactNode> = {
  multiple_choice: <BarChart3 className="h-4 w-4" />,
  word_cloud: <Cloud className="h-4 w-4" />,
  open_text: <MessageSquare className="h-4 w-4" />,
};

const SLIDE_TYPE_LABELS: Record<SlideType, string> = {
  multiple_choice: "Multiple Choice",
  word_cloud: "Word Cloud",
  open_text: "Open Text",
};

function SortableSlideItem({
  slide,
  index,
  isSelected,
  onSelect,
}: {
  slide: SlideRow;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <button
        onClick={onSelect}
        className={cn(
          "group flex w-full items-center gap-1.5 rounded-xl p-3 text-left text-sm transition-all",
          isSelected
            ? "bg-primary/10 text-primary border border-primary/20"
            : "text-muted-foreground hover:bg-muted border border-transparent"
        )}
      >
        <span
          {...attributes}
          {...listeners}
          className="flex shrink-0 cursor-grab items-center text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-mono font-medium">
          {index + 1}
        </span>
        <span className="flex-1 truncate">
          {slide.question || "Untitled"}
        </span>
        {SLIDE_TYPE_ICONS[slide.type]}
      </button>
    </div>
  );
}

export default function SlideEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
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
      const { data, error } = await supabase
        .from("presentations")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: slides = [] } = useQuery({
    queryKey: ["slides", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("slides")
        .select("*")
        .eq("presentation_id", id!)
        .order("order");
      if (error) throw error;
      return data as SlideRow[];
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (slides.length > 0 && !selectedSlideId) {
      setSelectedSlideId(slides[0].id);
    }
  }, [slides, selectedSlideId]);

  const selectedSlide = slides.find((s) => s.id === selectedSlideId);

  const addSlideMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = slides.length > 0 ? Math.max(...slides.map((s) => s.order)) + 1 : 0;
      const { data, error } = await supabase
        .from("slides")
        .insert({
          presentation_id: id!,
          order: maxOrder,
          type: "multiple_choice" as const,
          question: "",
          options: JSON.stringify(["Option A", "Option B"]),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["slides", id] });
      setSelectedSlideId(data.id);
    },
  });

  const duplicateSlideMutation = useMutation({
    mutationFn: async (sourceSlide: SlideRow) => {
      const maxOrder = slides.length > 0 ? Math.max(...slides.map((s) => s.order)) + 1 : 0;
      const { data, error } = await supabase
        .from("slides")
        .insert({
          presentation_id: id!,
          order: maxOrder,
          type: sourceSlide.type,
          question: sourceSlide.question,
          options: sourceSlide.options,
        })
        .select()
        .single();
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
      if (selectedSlideId && slides.length > 1) {
        const remaining = slides.filter((s) => s.id !== selectedSlideId);
        setSelectedSlideId(remaining[0]?.id ?? null);
      }
    },
  });

  const updateSlideMutation = useMutation({
    mutationFn: async (update: { slideId: string; data: Partial<Pick<SlideRow, "question" | "type" | "options">> }) => {
      const { error } = await supabase
        .from("slides")
        .update(update.data)
        .eq("id", update.slideId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["slides", id] }),
  });

  const reorderSlidesMutation = useMutation({
    mutationFn: async (reorderedSlides: { id: string; order: number }[]) => {
      const promises = reorderedSlides.map((s) =>
        supabase.from("slides").update({ order: s.order }).eq("id", s.id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["slides", id] }),
  });

  const updateTitleMutation = useMutation({
    mutationFn: async (title: string) => {
      const { error } = await supabase
        .from("presentations")
        .update({ title })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["presentation", id] }),
  });

  // Debounced update
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
      updateSlideMutation.mutate({
        slideId: selectedSlide.id,
        data: { question: localQuestion, options: JSON.stringify(localOptions) },
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [localQuestion, localOptions]);

  const handleTypeChange = (type: SlideType) => {
    if (!selectedSlide) return;
    updateSlideMutation.mutate({ slideId: selectedSlide.id, data: { type } });
  };

  const addOption = () => setLocalOptions([...localOptions, `Option ${String.fromCharCode(65 + localOptions.length)}`]);
  const removeOption = (i: number) => setLocalOptions(localOptions.filter((_, idx) => idx !== i));
  const updateOption = (i: number, val: string) => setLocalOptions(localOptions.map((o, idx) => (idx === i ? val : o)));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = slides.findIndex((s) => s.id === active.id);
    const newIndex = slides.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(slides, oldIndex, newIndex);

    // Optimistic update
    queryClient.setQueryData(["slides", id], reordered);

    reorderSlidesMutation.mutate(
      reordered.map((s, i) => ({ id: s.id, order: i }))
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="flex w-64 flex-col border-r border-border/40 bg-card/50 backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-border/40 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/presentations")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={presentation?.title ?? ""}
            onChange={(e) => updateTitleMutation.mutate(e.target.value)}
            className="h-8 border-none bg-transparent text-sm font-semibold shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {slides.map((slide, i) => (
                <SortableSlideItem
                  key={slide.id}
                  slide={slide}
                  index={i}
                  isSelected={selectedSlideId === slide.id}
                  onSelect={() => setSelectedSlideId(slide.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <div className="border-t border-border/40 p-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => addSlideMutation.mutate()}
            disabled={addSlideMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Slide
          </Button>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 overflow-y-auto p-8">
        {selectedSlide ? (
          <motion.div
            key={selectedSlide.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mx-auto max-w-2xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit Slide</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => duplicateSlideMutation.mutate(selectedSlide)}
                  disabled={duplicateSlideMutation.isPending}
                >
                  <Copy className="mr-1 h-3 w-3" />
                  Duplicate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteSlideMutation.mutate(selectedSlide.id)}
                  className="text-destructive hover:text-destructive"
                  disabled={slides.length <= 1}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Delete
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Slide Type</Label>
              <Select value={selectedSlide.type} onValueChange={(v) => handleTypeChange(v as SlideType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">
                    <span className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" /> Multiple Choice
                    </span>
                  </SelectItem>
                  <SelectItem value="word_cloud">
                    <span className="flex items-center gap-2">
                      <Cloud className="h-4 w-4" /> Word Cloud
                    </span>
                  </SelectItem>
                  <SelectItem value="open_text">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" /> Open Text
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Question</Label>
              <Textarea
                value={localQuestion}
                onChange={(e) => setLocalQuestion(e.target.value)}
                placeholder="Type your question here..."
                className="min-h-[100px] text-lg"
              />
            </div>

            {selectedSlide.type === "multiple_choice" && (
              <div className="space-y-3">
                <Label>Answer Options</Label>
                <AnimatePresence mode="popLayout">
                  {localOptions.map((opt, i) => (
                    <motion.div
                      key={i}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-mono font-semibold text-primary">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <Input
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(i)}
                        disabled={localOptions.length <= 2}
                        className="shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {localOptions.length < 6 && (
                  <Button variant="outline" size="sm" onClick={addOption}>
                    <Plus className="mr-1 h-3 w-3" />
                    Add Option
                  </Button>
                )}
              </div>
            )}

            {selectedSlide.type === "word_cloud" && (
              <Card className="border-dashed glass-card">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Cloud className="mx-auto mb-2 h-8 w-8" />
                  <p>Audience will submit words or short phrases</p>
                  <p className="font-body text-sm">Results appear as a dynamic word cloud</p>
                </CardContent>
              </Card>
            )}

            {selectedSlide.type === "open_text" && (
              <Card className="border-dashed glass-card">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <MessageSquare className="mx-auto mb-2 h-8 w-8" />
                  <p>Audience will submit free-text responses</p>
                  <p className="font-body text-sm">Results appear as a scrolling feed</p>
                </CardContent>
              </Card>
            )}

            {/* Preview card */}
            <Card className="overflow-hidden glass-card">
              <div className="bg-primary/5 p-6">
                <p className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wider">Audience Preview</p>
                <p className="text-center text-2xl font-semibold tracking-tight text-foreground" style={{ textWrap: "balance" as any }}>
                  {localQuestion || "Your question will appear here"}
                </p>
                {selectedSlide.type === "multiple_choice" && (
                  <div className="mt-6 space-y-2">
                    {localOptions.map((opt, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-xl bg-background p-4 shadow-sm"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-mono font-bold text-primary-foreground">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="font-medium">{opt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Select a slide to edit
          </div>
        )}
      </div>
    </div>
  );
}
