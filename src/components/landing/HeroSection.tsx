import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, Users } from "lucide-react";
import { fadeUp, stagger } from "./constants";

export default function HeroSection() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6 pt-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(139,92,246,0.25),transparent)]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#080810_100%)]" />
      </div>

      <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative mx-auto max-w-5xl text-center">
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} className="mb-8 inline-flex items-center gap-2 rounded-full border accent-border accent-surface px-4 py-1.5 text-sm font-medium accent-text">
            <Zap className="h-3.5 w-3.5" />
            Real-time audience engagement
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-6xl font-bold tracking-tight sm:text-7xl lg:text-8xl leading-[1.05]">
            Make every talk
            <br />
            <span className="accent-gradient-text">
              unforgettable
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mx-auto mt-8 max-w-xl text-lg text-white/50 leading-relaxed">
            Polls, word clouds, and live Q&A — all in one place. Share a code, and watch your audience respond in real time. No downloads required.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="h-12 px-8 text-base accent-bg accent-bg-hover text-white border-0 accent-shadow transition-all duration-200"
              onClick={() => navigate("/auth")}
            >
              Start for free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 text-base border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
              onClick={() => navigate("/join")}
            >
              <Users className="mr-2 h-4 w-4" />
              Join a session
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-12 flex items-center justify-center gap-6 text-sm text-white/40">
            <span>No credit card required</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>Free forever plan</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>Setup in 30 seconds</span>
          </motion.div>
        </motion.div>

        {/* Demo card */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-20 max-w-2xl"
        >
          <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-1 shadow-2xl shadow-black/50">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
              </div>
              <div className="flex-1 mx-4 h-6 rounded-md bg-white/5 flex items-center justify-center">
                <span className="text-xs text-white/30">pulselive.app/session/482917</span>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-center text-xl font-semibold mb-6">What's your biggest challenge?</p>
              <div className="space-y-3">
                {[
                  { label: "Keeping audience engaged", pct: 78 },
                  { label: "Getting real feedback", pct: 61 },
                  { label: "Managing Q&A chaos", pct: 45 },
                ].map((opt, i) => (
                  <div key={opt.label} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg accent-surface text-xs font-mono font-bold accent-text">
                      {String.fromCodePoint(65 + i)}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-white/80">{opt.label}</span>
                        <span className="text-white/40 font-mono">{opt.pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full accent-bg"
                          initial={{ width: 0 }}
                          animate={{ width: `${opt.pct}%` }}
                          transition={{ delay: 1.4 + i * 0.15, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between text-xs text-white/30">
                <span>247 responses</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{"Live"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
