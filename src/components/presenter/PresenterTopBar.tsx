import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Lock, Unlock, RotateCcw, Eye, EyeOff, ArrowLeft,
  Maximize, Minimize, Users, StopCircle,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  session: Tables<"sessions">;
  participantCount: number;
  showResults: boolean;
  isFullscreen: boolean;
  onExit: () => void;
  onToggleVotingLock: () => void;
  onToggleResults: () => void;
  onResetResults: () => void;
  onEndSession: () => void;
  onToggleFullscreen: () => void;
}

export function PresenterTopBar({
  session, participantCount, showResults, isFullscreen,
  onExit, onToggleVotingLock, onToggleResults, onResetResults, onEndSession, onToggleFullscreen,
}: Readonly<Props>) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 bg-[#080810]/90 backdrop-blur-xl px-4 py-2 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-white/50 hover:text-white hover:bg-white/8 h-8 px-2 text-xs" onClick={onExit}>
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Exit
        </Button>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex items-center gap-1.5 text-sm text-white/50">
          <Users className="h-3.5 w-3.5" />
          <span className="font-mono font-medium text-white">{participantCount}</span>
          <span className="hidden sm:inline text-xs">
            {participantCount === 1 ? "participant" : "participants"}
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-white/50 hover:text-white hover:bg-white/8" onClick={onToggleVotingLock}>
          {session.voting_locked ? <Lock className="mr-1 h-3 w-3" /> : <Unlock className="mr-1 h-3 w-3" />}
          {session.voting_locked ? "Locked" : "Open"}
        </Button>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-white/50 hover:text-white hover:bg-white/8" onClick={onToggleResults}>
          {showResults ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
          Results
        </Button>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-white/50 hover:text-white hover:bg-white/8" onClick={onResetResults}>
          <RotateCcw className="mr-1 h-3 w-3" /> Reset
        </Button>
        <div className="h-4 w-px bg-white/10 mx-1" />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10">
              <StopCircle className="mr-1 h-3 w-3" /> End
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[#0f0f1a] border-white/10 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">End this session?</AlertDialogTitle>
              <AlertDialogDescription className="text-white/50">
                This will disconnect all audience members. Responses are saved and reviewable in analytics.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onEndSession} className="bg-red-600 hover:bg-red-500 text-white border-0">
                End Session
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div className="h-4 w-px bg-white/10 mx-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/8" onClick={onToggleFullscreen}>
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
