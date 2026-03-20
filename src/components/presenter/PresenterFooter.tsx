import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Music, VolumeX, Copy, Check } from "lucide-react";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTime } from "@/hooks/presenter/useStopwatch";
import type { RadioStation } from "@/music/stations";
import type { Tables } from "@/integrations/supabase/types";

type SlideRow = Tables<"slides">;
type SessionRow = Tables<"sessions">;

interface StopwatchState {
  elapsed: number;
  running: boolean;
  toggle: () => void;
  reset: () => void;
}

interface Props {
  session: SessionRow;
  slides: SlideRow[];
  activeSlide: SlideRow;
  activeIndex: number;
  responseCount: number;
  stopwatch: StopwatchState;
  musicPlaying: boolean;
  activeStation: RadioStation;
  stations: RadioStation[];
  onNavigate: (direction: "prev" | "next") => void;
  onJumpToSlide: (slideId: string) => void;
  onOpenQR: () => void;
  onToggleMusic: () => void;
  onSelectStation: (station: RadioStation) => void;
}

export function PresenterFooter({
  session, slides, activeSlide, activeIndex, responseCount,
  stopwatch, musicPlaying, activeStation, stations,
  onNavigate, onJumpToSlide, onOpenQR, onToggleMusic, onSelectStation,
}: Readonly<Props>) {
  const origin = globalThis.location?.origin ?? "";
  const joinUrl = `${origin}/join/${session.join_code}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

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
                    ? "accent-bg text-white shadow-sm"
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

      <div className="grid grid-cols-3 items-center px-6 py-4">
        {/* Left: QR + join info */}
        <div className="flex items-center gap-5">
          <button
            onClick={onOpenQR}
            className="rounded-xl overflow-hidden bg-white p-1.5 hover:ring-2 hover:ring-violet-500/50 transition-all cursor-zoom-in"
            title="Click to enlarge"
          >
            <QRCodeSVG
              value={`${origin}/join/${session.join_code}`}
              size={72}
              bgColor="#ffffff"
              fgColor="#080810"
              level="M"
            />
          </button>
          <div>
            <p className="text-xs text-white/40 mb-0.5">Join at</p>
            <p className="text-sm text-white/60">{origin}/join</p>
            <p className="font-mono text-4xl font-bold tracking-widest text-white mt-0.5">
              {session.join_code}
            </p>
          </div>
        </div>

        {/* Center: Timer + Music */}
        <div className="flex flex-col items-center gap-2">
          <span className={cn(
            "font-mono font-bold tabular-nums tracking-tight transition-colors text-5xl",
            stopwatch.running ? "text-violet-400" : "text-white/50",
          )}>
            {formatTime(stopwatch.elapsed)}
          </span>

          {/* Timer controls */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/8"
              onClick={stopwatch.toggle} title={stopwatch.running ? "Pause" : "Start"}>
              {stopwatch.running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/8"
              onClick={stopwatch.reset} disabled={stopwatch.elapsed === 0} title="Reset">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>

            <div className="h-4 w-px bg-white/10 mx-0.5" />

            {/* Music toggle */}
            <Button
              variant="ghost" size="icon"
              title={musicPlaying ? "Stop music" : "Play music"}
              className={cn(
                "h-8 w-8 transition-colors hover:bg-white/8",
                musicPlaying ? "text-violet-400 hover:text-violet-300" : "text-white/40 hover:text-white",
              )}
              onClick={onToggleMusic}
            >
              {musicPlaying ? <VolumeX className="h-4 w-4" /> : <Music className="h-4 w-4" />}
            </Button>
          </div>

          {/* Station picker */}
          <div className="flex items-center gap-1">
            {stations.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectStation(s)}
                title={s.description}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium transition-all",
                  s.id === activeStation.id
                    ? "bg-violet-500/20 border border-violet-500/30 text-violet-400"
                    : "bg-white/5 border border-white/8 text-white/30 hover:text-white/60 hover:bg-white/8",
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Nav + response count */}
        <div className="flex items-center justify-end gap-3">
          <div className="flex items-center gap-1.5 rounded-full accent-surface accent-border border px-3 py-1 text-sm font-medium accent-text">
            <span className="font-mono">{responseCount}</span>
            <span>{responseCount === 1 ? "response" : "responses"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-white/30">
              {activeIndex + 1} / {slides.length}
            </span>
            <Button size="icon" className="h-9 w-9 bg-white/5 hover:bg-white/10 text-white border border-white/8"
              onClick={() => onNavigate("prev")} disabled={activeIndex === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="icon" className="h-9 w-9 bg-white/5 hover:bg-white/10 text-white border border-white/8"
              onClick={() => onNavigate("next")} disabled={activeIndex === slides.length - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
