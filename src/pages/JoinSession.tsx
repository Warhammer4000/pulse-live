import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

function getParticipantId(): string {
  let id = localStorage.getItem("pulse_participant_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("pulse_participant_id", id);
  }
  return id;
}

export default function JoinSession() {
  const { code: urlCode } = useParams<{ code: string }>();
  const [code, setCode] = useState(urlCode ?? "");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (urlCode && urlCode.length === 6) {
      handleJoin(urlCode);
    }
  }, [urlCode]);

  const handleJoin = async (joinCode: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("id, join_code")
        .eq("join_code", joinCode)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        toast({ title: "Session not found", description: "Check your code and try again", variant: "destructive" });
        setLoading(false);
        return;
      }

      getParticipantId();
      navigate(`/live/${data.join_code}`);
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#080810] px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(139,92,246,0.12),transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#080810_100%)]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm text-center"
      >
        <div className="mb-8">
          <span className="text-2xl font-bold text-white tracking-tight">
            Pulse<span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Live</span>
          </span>
          <p className="mt-3 text-white/40 text-sm">Enter the 6-digit session code to join</p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/5 p-8 space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(value) => {
                setCode(value);
                if (value.length === 6) handleJoin(value);
              }}
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="h-14 w-11 text-xl font-mono font-bold bg-white/5 border-white/10 text-white"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            className="w-full h-12 bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-lg shadow-violet-900/40"
            onClick={() => handleJoin(code)}
            disabled={code.length !== 6 || loading}
          >
            {loading ? "Joining..." : "Join Session"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <p className="mt-6 text-xs text-white/30">
          No account needed — just enter the code your presenter shared
        </p>
      </motion.div>
    </div>
  );
}
