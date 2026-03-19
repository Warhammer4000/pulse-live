import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Cloud, MessageSquare, Zap, ArrowRight } from "lucide-react";

const bullets = [
  { icon: BarChart3, text: "Real-time polls with live results" },
  { icon: Cloud, text: "Dynamic word clouds from audience input" },
  { icon: MessageSquare, text: "Open text Q&A and feedback" },
  { icon: Zap, text: "No app downloads for participants" },
];

function getFormKey(showReset: boolean, isLogin: boolean) {
  if (showReset) return "reset";
  return isLogin ? "login" : "signup";
}

function getTitle(showReset: boolean, isLogin: boolean) {
  if (showReset) return "Reset password";
  return isLogin ? "Welcome back" : "Create your account";
}

function getSubtitle(showReset: boolean, isLogin: boolean) {
  if (showReset) return "Enter your email to receive a reset link";
  return isLogin ? "Sign in to manage your presentations" : "Start creating interactive presentations";
}

function getSubmitLabel(loading: boolean, isLogin: boolean) {
  if (loading) return "Loading...";
  return isLogin ? "Sign In" : "Create Account";
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    navigate("/");
  };

  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: globalThis.location.origin,
      },
    });
    if (error) throw error;
    toast({ title: "Check your email", description: "We sent you a confirmation link to verify your account." });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await handleLogin();
      } else {
        await handleSignup();
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${globalThis.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Reset link sent", description: "Check your email for the password reset link." });
      setShowReset(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formKey = getFormKey(showReset, isLogin);
  const title = getTitle(showReset, isLogin);
  const subtitle = getSubtitle(showReset, isLogin);
  const submitLabel = getSubmitLabel(loading, isLogin);

  return (
    <div className="flex min-h-screen bg-[#080810]">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_40%,rgba(139,92,246,0.2),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#080810_100%)]" />

        <div className="relative z-10">
          <span className="text-xl font-bold tracking-tight text-white">
            Pulse<span className="accent-gradient-text">Live</span>
          </span>
        </div>

        <div className="relative z-10 space-y-10">
          <div>
            <h2 className="text-4xl font-bold text-white tracking-tight leading-tight">
              Engage your audience<br />
              <span className="accent-gradient-text">like never before</span>
            </h2>
            <p className="mt-4 text-white/50 leading-relaxed max-w-md">
              Create interactive presentations that captivate. Get real-time feedback from any device.
            </p>
          </div>

          <div className="space-y-4">
            {bullets.map((b) => (
              <div key={b.text} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl accent-surface accent-border border">
                  <b.icon className="h-4 w-4 accent-text" />
                </div>
                <span className="text-white/70 text-sm">{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-white/30">Trusted by educators, facilitators, and speakers worldwide</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <span className="text-3xl font-bold tracking-tight text-white">
              Pulse<span className="accent-gradient-text">Live</span>
            </span>
            <p className="mt-2 text-white/40 text-sm">Interactive presentations, real-time feedback</p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/5 p-8">
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-white">{title}</h1>
              <p className="mt-1 text-sm text-white/40">{subtitle}</p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={formKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {showReset ? (
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="reset-email" className="text-white/60 text-sm">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary/30 focus-visible:border-primary/50"
                      />
                    </div>
                    <Button type="submit" className="w-full accent-bg accent-bg-hover text-white border-0 accent-shadow" disabled={loading}>
                      {loading ? "Sending..." : "Send Reset Link"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <button type="button" onClick={() => setShowReset(false)} className="w-full text-sm text-white/40 hover:text-white/70 transition-colors py-1">
                      Back to sign in
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleAuth} className="space-y-4">
                    {!isLogin && (
                      <div className="space-y-1.5">
                        <Label htmlFor="displayName" className="text-white/60 text-sm">Display Name</Label>
                        <Input
                          id="displayName"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your name"
                          required={!isLogin}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary/30 focus-visible:border-primary/50"
                        />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-white/60 text-sm">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary/30 focus-visible:border-primary/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-white/60 text-sm">Password</Label>
                        {isLogin && (
                          <button type="button" onClick={() => setShowReset(true)} className="text-xs accent-text hover:text-white/70 transition-colors">
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary/30 focus-visible:border-primary/50"
                      />
                    </div>
                    <Button type="submit" className="w-full accent-bg accent-bg-hover text-white border-0 accent-shadow" disabled={loading}>
                      {submitLabel}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <p className="text-center text-sm text-white/40">
                      {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                      <button type="button" onClick={() => setIsLogin(!isLogin)} className="accent-text hover:text-white/70 transition-colors font-medium">
                        {isLogin ? "Sign up" : "Sign in"}
                      </button>
                    </p>
                  </form>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
