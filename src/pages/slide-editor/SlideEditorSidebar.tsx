import { ArrowLeft, Plus, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableSlideItem } from "./SortableSlideItem";
import type { SlideRow } from "./types";

interface Props {
  readonly presentationTitle: string;
  readonly slides: SlideRow[];
  readonly selectedSlideId: string | null;
  readonly isAddingSlide: boolean;
  readonly isStartingSession: boolean;
  readonly isDuplicating: boolean;
  readonly onBack: () => void;
  readonly onTitleChange: (title: string) => void;
  readonly onSelectSlide: (id: string) => void;
  readonly onAddSlide: () => void;
  readonly onPresent: () => void;
  readonly onDragEnd: (event: DragEndEvent) => void;
  readonly onDuplicate: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

export function SlideEditorSidebar({
  presentationTitle,
  slides,
  selectedSlideId,
  isAddingSlide,
  isStartingSession,
  isDuplicating,
  onBack,
  onTitleChange,
  onSelectSlide,
  onAddSlide,
  onPresent,
  onDragEnd,
  onDuplicate,
  onDelete,
}: Props) {
  const [localTitle, setLocalTitle] = useState(presentationTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleTitleFocus = () => {
    setLocalTitle(presentationTitle);
    setIsEditingTitle(true);
  };

  const handleTitleCommit = () => {
    const trimmed = localTitle.trim();
    if (trimmed && trimmed !== presentationTitle) {
      onTitleChange(trimmed);
    } else {
      setLocalTitle(presentationTitle);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      titleRef.current?.blur();
    } else if (e.key === "Escape") {
      setLocalTitle(presentationTitle);
      setIsEditingTitle(false);
      titleRef.current?.blur();
    }
  };

  return (
    <div className="flex w-60 flex-col border-r border-white/5 bg-[#080810] shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/5 p-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/8 shrink-0"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <input
          ref={titleRef}
          value={isEditingTitle ? localTitle : presentationTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onFocus={handleTitleFocus}
          onBlur={handleTitleCommit}
          onKeyDown={handleTitleKeyDown}
          className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-white placeholder:text-white/30 outline-none truncate"
          placeholder="Untitled"
        />
      </div>

      {/* Slide list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {slides.map((slide, i) => (
              <SortableSlideItem
                key={slide.id}
                slide={slide}
                index={i}
                isSelected={selectedSlideId === slide.id}
                canDelete={slides.length > 1}
                isDuplicating={isDuplicating}
                onSelect={() => onSelectSlide(slide.id)}
                onDuplicate={() => onDuplicate(slide.id)}
                onDelete={() => onDelete(slide.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Add slide — sits right below the last slide */}
        <button
          onClick={onAddSlide}
          disabled={isAddingSlide}
          className="group flex w-full items-center gap-2 rounded-xl border border-dashed border-white/10 px-2.5 py-2 text-sm text-white/30 transition-all hover:border-white/20 hover:text-white/60 disabled:pointer-events-none disabled:opacity-40 mt-1"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add slide</span>
        </button>
      </div>

      {/* Footer actions */}
      <div className="border-t border-white/5 p-2">
        <Button
          className="w-full accent-bg accent-bg-hover text-white border-0 accent-shadow h-9 text-sm"
          onClick={onPresent}
          disabled={isStartingSession || slides.length === 0}
        >
          <Play className="mr-2 h-3.5 w-3.5" /> Present
        </Button>
      </div>
    </div>
  );
}
