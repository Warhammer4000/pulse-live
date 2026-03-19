import { ArrowLeft, Plus, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  readonly onBack: () => void;
  readonly onTitleChange: (title: string) => void;
  readonly onSelectSlide: (id: string) => void;
  readonly onAddSlide: () => void;
  readonly onPresent: () => void;
  readonly onDragEnd: (event: DragEndEvent) => void;
}

export function SlideEditorSidebar({
  presentationTitle,
  slides,
  selectedSlideId,
  isAddingSlide,
  isStartingSession,
  onBack,
  onTitleChange,
  onSelectSlide,
  onAddSlide,
  onPresent,
  onDragEnd,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
          value={presentationTitle}
          onChange={(e) => onTitleChange(e.target.value)}
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
                onSelect={() => onSelectSlide(slide.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Footer actions */}
      <div className="border-t border-white/5 p-2 space-y-2">
        <Button
          className="w-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/8 h-9 text-sm"
          onClick={onAddSlide}
          disabled={isAddingSlide}
        >
          <Plus className="mr-2 h-3.5 w-3.5" /> Add Slide
        </Button>
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
