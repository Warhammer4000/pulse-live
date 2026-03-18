import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Cloud, MessageSquare, Zap } from "lucide-react";

const bullets = [
  { icon: BarChart3, text: "Real-time polls with live results" },
  { icon: Cloud, text: "Dynamic word clouds from audience input" },
  { icon: MessageSquare, text: "Open text Q&A and feedback" },
  { icon: Zap, text: "No app downloads for participants" },
];

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "We sent you a confirmation link to verify your account." });
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
        redirectTo: `${window.location.origin}/reset-password`,
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

  const formKey = showReset ? "reset" : isLogin ? "login" : "signup";

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 gradient-bg" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />

        {/* Floating orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-white/10 blur-[80px] animate-float" />
          <div className="absolute bottom-1/3 right-1/4 h-48 w-48 rounded-full bg-white/8 blur-[60px] animate-float" style={{ animationDelay: "3s" }} />
        </div>

        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white">
            Pulse<span className="text-white/70">Live</span>
          </h1>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white tracking-tight leading-tight">
              Engage your audience<br />like never before
            </h2>
            <p className="mt-4 text-lg text-white/70 font-body max-w-md">
              Create interactive presentations that captivate. Get real-time feedback from any device.
            </p>
          </div>

          <div className="space-y-4">
            {bullets.map((b) => (
              <div key={b.text} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                  <b.icon className="h-4.5 w-4.5 text-white" />
                </div>
                <span className="font-body text-white/85">{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-white/40 font-body">
            Trusted by educators, facilitators, and speakers worldwide
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <h1 className="text-3xl font-bold tracking-tight">
              Pulse<span className="gradient-text">Live</span>
            </h1>
            <p className="mt-2 text-muted-foreground font-body">
              Interactive presentations, real-time feedback
            </p>
          </div>

          <Card className="glass-card border-border/40 shadow-xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">
                {showReset ? "Reset Password" : isLogin ? "Welcome back" : "Create your account"}
              </CardTitle>
              <CardDescription className="font-body">
                {showReset
                  ? "Enter your email to receive a reset link"
                  : isLogin
                    ? "Sign in to manage your presentations"
                    : "Start creating interactive presentations"}
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                      </div>
                      <Button type="submit" className="w-full gradient-bg glow-button text-primary-foreground" disabled={loading}>
                        {loading ? "Sending..." : "Send Reset Link"}
                      </Button>
                      <Button type="button" variant="ghost" className="w-full" onClick={() => setShowReset(false)}>
                        Back to login
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleAuth} className="space-y-4">
                      {!isLogin && (
                        <div className="space-y-2">
                          <Label htmlFor="displayName">Display Name</Label>
                          <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" required={!isLogin} />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                      </div>
                      {isLogin && (
                        <button type="button" onClick={() => setShowReset(true)} className="text-sm text-primary hover:underline">
                          Forgot password?
                        </button>
                      )}
                      <Button type="submit" className="w-full gradient-bg glow-button text-primary-foreground" disabled={loading}>
                        {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
                      </Button>
                      <p className="text-center text-sm text-muted-foreground font-body">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                        <button type="button" onClick={() => setIsLogin(!isLogin)} className="font-medium text-primary hover:underline">
                          {isLogin ? "Sign up" : "Sign in"}
                        </button>
                      </p>
                    </form>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
