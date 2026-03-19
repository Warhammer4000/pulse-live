import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SlideEditorSidebar } from "./slide-editor/SlideEditorSidebar";
import { SlideEditorForm } from "./slide-editor/SlideEditorForm";
import { useSlideEditor } from "./slide-editor/useSlideEditor";
import type { SlideType } from "./slide-editor/types";

export default function SlideEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);

  const {
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
  } = useSlideEditor(id);

  useEffect(() => {
    if (slides.length > 0 && !selectedSlideId) setSelectedSlideId(slides[0].id);
  }, [slides, selectedSlideId]);

  const selectedSlide = slides.find((s) => s.id === selectedSlideId);

  const handleAddSlide = async () => {
    const data = await addSlideMutation.mutateAsync();
    if (data) setSelectedSlideId(data.id);
  };

  const handleDuplicate = async () => {
    if (!selectedSlide) return;
    const data = await duplicateSlideMutation.mutateAsync(selectedSlide);
    if (data) setSelectedSlideId(data.id);
  };

  const handleDelete = () => {
    if (!selectedSlide) return;
    deleteSlideMutation.mutate(selectedSlide.id, {
      onSuccess: () => {
        const remaining = slides.find((s) => s.id !== selectedSlide.id);
        setSelectedSlideId(remaining?.id ?? null);
      },
    });
  };

  return (
    <div className="flex h-screen bg-[#080810] text-white">
      <SlideEditorSidebar
        presentationTitle={presentation?.title ?? ""}
        slides={slides}
        selectedSlideId={selectedSlideId}
        isAddingSlide={addSlideMutation.isPending}
        isStartingSession={startSessionMutation.isPending}
        onBack={() => navigate("/dashboard/presentations")}
        onTitleChange={(title) => updateTitleMutation.mutate(title)}
        onSelectSlide={setSelectedSlideId}
        onAddSlide={handleAddSlide}
        onPresent={() => startSessionMutation.mutate()}
        onDragEnd={handleDragEnd}
      />

      <div className="flex-1 overflow-y-auto">
        {selectedSlide ? (
          <SlideEditorForm
            slide={selectedSlide}
            canDelete={slides.length > 1}
            isDuplicating={duplicateSlideMutation.isPending}
            onTypeChange={(type: SlideType) => updateSlideType(selectedSlide, type)}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onSave={(question, options) => saveSlideContent(selectedSlide, question, options)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/30 text-sm">
            Select a slide to edit
          </div>
        )}
      </div>
    </div>
  );
}
