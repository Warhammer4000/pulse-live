import { GripVertical, Copy, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { TYPE_ICONS } from "./types";
import type { SlideRow } from "./types";

interface Props {
  readonly slide: SlideRow;
  readonly index: number;
  readonly isSelected: boolean;
  readonly canDelete: boolean;
  readonly isDuplicating: boolean;
  readonly onSelect: () => void;
  readonly onDuplicate: () => void;
  readonly onDelete: () => void;
}

export function SortableSlideItem({ slide, index, isSelected, canDelete, isDuplicating, onSelect, onDuplicate, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id });
  const Icon = TYPE_ICONS[slide.type];

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 10 : undefined }}
    >
      <button
        onClick={onSelect}
        className={cn(
          "group flex w-full items-center gap-2 rounded-xl p-2.5 text-left text-sm transition-all",
          isSelected
            ? "accent-surface accent-text border accent-border"
            : "text-white/50 hover:bg-white/5 hover:text-white border border-transparent"
        )}
      >
        <button
          {...attributes}
          {...listeners}
          type="button"
          aria-label="Drag to reorder"
          onKeyDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="flex shrink-0 cursor-grab items-center text-white/20 hover:text-white/50 active:cursor-grabbing bg-transparent border-0 p-0"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/5 text-xs font-mono font-medium">
          {index + 1}
        </span>
        <span className="flex-1 truncate">{slide.question || "Untitled"}</span>

        {/* Action buttons — visible on hover or when selected */}
        <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            aria-label="Duplicate slide"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            disabled={isDuplicating}
            className="flex h-5 w-5 items-center justify-center rounded text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors disabled:pointer-events-none disabled:opacity-40 border-0 bg-transparent p-0"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            type="button"
            aria-label="Delete slide"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={!canDelete}
            className="flex h-5 w-5 items-center justify-center rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:pointer-events-none disabled:opacity-20 border-0 bg-transparent p-0"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </span>

        <Icon className="h-3.5 w-3.5 shrink-0 opacity-40" />
      </button>
    </div>
  );
}
