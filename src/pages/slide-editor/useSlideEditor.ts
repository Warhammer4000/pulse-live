import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { arrayMove } from "@dnd-kit/sortable";
import { type DragEndEvent } from "@dnd-kit/core";
import type { SlideRow, SlideType } from "./types";

export { arrayMove } from "@dnd-kit/sortable";
export type { DragEndEvent } from "@dnd-kit/core";

export function useSlideEditor(id: string | undefined) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: presentation } = useQuery({
    queryKey: ["presentation", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("presentations").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: slides = [] } = useQuery({
    queryKey: ["slides", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("slides").select("*").eq("presentation_id", id).order("order");
      if (error) throw error;
      return data as SlideRow[];
    },
    enabled: !!id,
  });

  const addSlideMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = slides.length > 0 ? Math.max(...slides.map((s) => s.order)) + 1 : 0;
      const { data, error } = await supabase.from("slides").insert({
        presentation_id: id,
        order: maxOrder,
        type: "multiple_choice" as const,
        question: "",
        options: JSON.stringify(["Option A", "Option B"]),
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["slides", id] });
      return data;
    },
  });

  const duplicateSlideMutation = useMutation({
    mutationFn: async (src: SlideRow) => {
      const maxOrder = slides.length > 0 ? Math.max(...slides.map((s) => s.order)) + 1 : 0;
      const { data, error } = await supabase.from("slides").insert({
        presentation_id: id,
        order: maxOrder,
        type: src.type,
        question: src.question,
        options: src.options,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["slides", id] });
      toast({ title: "Slide duplicated" });
      return data;
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteSlideMutation = useMutation({
    mutationFn: async (slideId: string) => {
      const { error } = await supabase.from("slides").delete().eq("id", slideId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["slides", id] }),
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
      const { error } = await supabase.from("presentations").update({ title }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["presentation", id] }),
  });

  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const { data: existing } = await supabase.from("sessions").select("*")
        .eq("presentation_id", id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) return existing;
      const joinCode = Math.floor(100000 + Math.random() * 900000).toString();
      const { data, error } = await supabase.from("sessions").insert({
        presentation_id: id,
        join_code: joinCode,
        active_slide_id: slides[0]?.id ?? null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => navigate(`/present/${data.id}`),
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = slides.findIndex((s) => s.id === active.id);
    const newIndex = slides.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(slides, oldIndex, newIndex);
    queryClient.setQueryData(["slides", id], reordered);
    reorderSlidesMutation.mutate(reordered.map((s, i) => ({ id: s.id, order: i })));
  };

  const updateSlideType = (slide: SlideRow, type: SlideType) => {
    updateSlideMutation.mutate({ slideId: slide.id, data: { type } });
  };

  const saveSlideContent = (slide: SlideRow, question: string, options: string[]) => {
    updateSlideMutation.mutate({ slideId: slide.id, data: { question, options: JSON.stringify(options) } });
  };

  return {
    presentation,
    slides,
    addSlideMutation,
    duplicateSlideMutation,
    deleteSlideMutation,
    updateTitleMutation,
    startSessionMutation,
    handleDragEnd,
    updateSlideType,
    saveSlideContent,
  };
}
