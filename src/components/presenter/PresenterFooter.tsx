import { ChevronLeft, ChevronRight } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type SlideRow = Tables<"slides">;
type SessionRow = Tables<"sessions">;

interface Props {
  session: SessionRow;
  slides: SlideRow[];
  activeSlide: SlideRow;
  activeIndex: number;
  responseCount: number;
  onNavigate: (direction: "prev" | "next") => void;
  onJumpToSlide: (slideId: string) => void;
}

export function PresenterFooter({
  session, slides, activeSlide, activeIndex, responseCount, onNavigate, onJumpToSlide,
}: Readonly<Props>) {
  const origin = globalThis.location?.origin ?? "";

  return (
    <div className="border-t border-white/5 bg-[#080810]/90 backdrop-blur-xl shrink-0">
      {/* Slide strip */}
      {slides.length > 1 && (
        <div className="border-b border-white/5 px-4 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => onJumpToSlide(slide.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  slide.id === activeSlide.id
                    ? "bg-violet-600 text-white shadow-sm shadow-violet-900/40"
                    : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white",
                )}
              >
                <span className="font-mono">{i + 1}</span>
                <span className="max-w-[80px] truncate hidden sm:inline">
                  {slide.question ?? "Untitled"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-6 py-4">
        {/* QR + join info */}
        <div className="flex items-center gap-5">
          <div className="rounded-xl overflow-hidden bg-white p-1.5">
            <QRCodeSVG
              value={`${origin}/join/${session.join_code}`}
              size={72}
              bgColor="#ffffff"
              fgColor="#080810"
              level="M"
            />
          </div>
          <div>
            <p className="text-xs text-white/40 mb-0.5">Join at</p>
            <p className="text-sm text-white/60">{origin}/join</p>
            <p className="font-mono text-4xl font-bold tracking-widest text-white mt-0.5">
              {session.join_code}
            </p>
          </div>
        </div>

        {/* Nav + response count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1 text-sm font-medium text-violet-400">
            <span className="font-mono">{responseCount}</span>
            <span>{responseCount === 1 ? "response" : "responses"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-white/30">
              {activeIndex + 1} / {slides.length}
            </span>
            <Button
              size="icon"
              className="h-9 w-9 bg-white/5 hover:bg-white/10 text-white border border-white/8"
              onClick={() => onNavigate("prev")}
              disabled={activeIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              className="h-9 w-9 bg-white/5 hover:bg-white/10 text-white border border-white/8"
              onClick={() => onNavigate("next")}
              disabled={activeIndex === slides.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
