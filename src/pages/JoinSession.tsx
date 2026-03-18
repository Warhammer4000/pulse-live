import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useEffect } from "react";

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
        toast({
          title: "Session not found",
          description: "Check your code and try again",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      getParticipantId(); // Ensure ID exists
      navigate(`/live/${data.join_code}`);
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm text-center"
      >
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          Pulse<span className="text-primary">Live</span>
        </h1>
        <p className="mb-8 text-muted-foreground">Enter the session code to join</p>

        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(value) => {
              setCode(value);
              if (value.length === 6) handleJoin(value);
            }}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} className="h-14 w-12 text-xl font-mono font-bold" />
              <InputOTPSlot index={1} className="h-14 w-12 text-xl font-mono font-bold" />
              <InputOTPSlot index={2} className="h-14 w-12 text-xl font-mono font-bold" />
              <InputOTPSlot index={3} className="h-14 w-12 text-xl font-mono font-bold" />
              <InputOTPSlot index={4} className="h-14 w-12 text-xl font-mono font-bold" />
              <InputOTPSlot index={5} className="h-14 w-12 text-xl font-mono font-bold" />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          className="w-full h-14 text-lg"
          onClick={() => handleJoin(code)}
          disabled={code.length !== 6 || loading}
        >
          {loading ? "Joining..." : "Join Session"}
        </Button>
      </motion.div>
    </div>
  );
}
