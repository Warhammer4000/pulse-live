import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { User, Lock, Save } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const initials = (displayName || user?.email || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { display_name: displayName } });
      if (error) throw error;
      await supabase.from("profiles").update({ display_name: displayName }).eq("user_id", user!.id);
      toast({ title: "Profile updated", description: "Your display name has been saved." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password updated", description: "Your password has been changed." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-white/40">Manage your account and preferences</p>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-5">
        {/* Profile */}
        <motion.div variants={fadeUp} className="rounded-2xl border border-white/8 bg-white/5 p-6">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-violet-400" />
            <h2 className="text-base font-semibold text-white">Profile</h2>
          </div>
          <p className="text-sm text-white/40 mb-6">Update your personal information</p>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-violet-500/20 text-violet-300 text-lg font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-white">{displayName || "No name set"}</p>
                <p className="text-sm text-white/40">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="text-white/60 text-sm">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-violet-500/30 focus-visible:border-violet-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/60 text-sm">Email</Label>
              <Input
                value={user?.email ?? ""}
                disabled
                className="bg-white/5 border-white/10 text-white/30 cursor-not-allowed"
              />
              <p className="text-xs text-white/30">Email cannot be changed</p>
            </div>

            <Button
              type="submit"
              disabled={savingProfile}
              className="bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-lg shadow-violet-900/40"
            >
              <Save className="mr-2 h-4 w-4" />
              {savingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </motion.div>

        {/* Password */}
        <motion.div variants={fadeUp} className="rounded-2xl border border-white/8 bg-white/5 p-6">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="h-4 w-4 text-violet-400" />
            <h2 className="text-base font-semibold text-white">Change Password</h2>
          </div>
          <p className="text-sm text-white/40 mb-6">Update your account password</p>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-white/60 text-sm">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-violet-500/30 focus-visible:border-violet-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-white/60 text-sm">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-violet-500/30 focus-visible:border-violet-500/50"
              />
            </div>
            <Button
              type="submit"
              disabled={savingPassword}
              className="bg-white/8 hover:bg-white/12 text-white border border-white/10"
            >
              <Lock className="mr-2 h-4 w-4" />
              {savingPassword ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}
