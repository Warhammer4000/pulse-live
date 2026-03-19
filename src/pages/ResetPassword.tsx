import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const hashParams = new URLSearchParams(globalThis.location.hash.substring(1));
    if (!hashParams.get("type") || hashParams.get("type") !== "recovery") {
      // Not a valid recovery link
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080810] px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgba(139,92,246,0.15),transparent)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 border border-violet-500/20 mb-4">
            <Lock className="h-6 w-6 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Set new password</h1>
          <p className="mt-2 text-sm text-white/40">Choose a strong password for your account</p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/5 p-8">
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-white/60 text-sm">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-violet-500/30 focus-visible:border-violet-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-white/60 text-sm">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-violet-500/30 focus-visible:border-violet-500/50"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-lg shadow-violet-900/40"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Password"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
