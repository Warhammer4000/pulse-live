import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { BarChart3, Cloud, MessageSquare, Zap, Users, ArrowRight, Check, Play } from "lucide-react";
import { useRef } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const features = [
  {
    icon: BarChart3,
    title: "Live Polls",
    description: "Multiple-choice questions with animated results your audience watches update in real time.",
    color: "from-violet-500/20 to-purple-500/10",
    iconColor: "text-violet-400",
  },
  {
    icon: Cloud,
    title: "Word Clouds",
    description: "Collect words and phrases that form beautiful, dynamic clouds as responses pour in.",
    color: "from-cyan-500/20 to-blue-500/10",
    iconColor: "text-cyan-400",
  },
  {
    icon: MessageSquare,
    title: "Open Q&A",
    description: "Free-form responses displayed in a live scrolling feed everyone in the room can see.",
    color: "from-emerald-500/20 to-teal-500/10",
    iconColor: "text-emerald-400",
  },
];

const steps = [
  { n: "01", title: "Build your slides", desc: "Add polls, word clouds, or open text questions in seconds." },
  { n: "02", title: "Share a code", desc: "One 6-digit code or QR scan — no app download needed." },
  { n: "03", title: "Watch it live", desc: "Responses flow in real time on your presenter screen." },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    desc: "Perfect for trying it out",
    features: ["3 presentations", "Unlimited participants", "All interaction types", "Basic analytics"],
    cta: "Get started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/mo",
    desc: "For regular presenters",
    features: ["Unlimited presentations", "Unlimited participants", "All interaction types", "Advanced analytics", "Custom branding", "Export responses"],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Team",
    price: "$39",
    period: "/mo",
    desc: "For organizations",
    features: ["Everything in Pro", "5 team members", "Shared workspace", "Priority support", "SSO / SAML", "API access"],
    cta: "Contact sales",
    highlight: false,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-[#080810] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#080810]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-lg font-bold tracking-tight">
            Pulse<span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Live</span>
          </span>
          <div className="hidden sm:flex items-center gap-6 text-sm text-white/60">
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Features</button>
            <button onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">How it works</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Pricing</button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => navigate("/join")}>
              Join Session
            </Button>
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-lg shadow-violet-900/40" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6 pt-16">
        {/* Background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(139,92,246,0.25),transparent)]" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
          {/* Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#080810_100%)]" />
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative mx-auto max-w-5xl text-center"
        >
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-300">
              <Zap className="h-3.5 w-3.5" />
              Real-time audience engagement
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-6xl font-bold tracking-tight sm:text-7xl lg:text-8xl leading-[1.05]">
              Make every talk
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                unforgettable
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mx-auto mt-8 max-w-xl text-lg text-white/50 leading-relaxed">
              Polls, word clouds, and live Q&A — all in one place. Share a code, and watch your audience respond in real time. No downloads required.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="h-12 px-8 text-base bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-xl shadow-violet-900/50 transition-all duration-200"
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

            {/* Social proof */}
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
              {/* Window chrome */}
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
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-xs font-mono font-bold text-violet-300">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-white/80">{opt.label}</span>
                          <span className="text-white/40 font-mono">{opt.pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
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
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-32">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-sm font-medium text-violet-400 mb-3 tracking-widest uppercase">Features</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-bold tracking-tight sm:text-5xl">
              Three ways to engage,{" "}
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">zero friction</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-white/50 max-w-lg mx-auto">
              No app downloads for your audience. Just a code or a scan.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid gap-5 sm:grid-cols-3"
          >
            {features.map((f) => (
              <motion.div key={f.title} variants={fadeUp}>
                <div className="group relative rounded-2xl border border-white/8 bg-white/3 p-8 hover:border-white/15 hover:bg-white/5 transition-all duration-300 overflow-hidden h-full">
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative">
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                      <f.icon className={`h-5 w-5 ${f.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{f.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-6 py-32 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(139,92,246,0.06),transparent)]" />
        <div className="relative mx-auto max-w-5xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-20"
          >
            <motion.p variants={fadeUp} className="text-sm font-medium text-violet-400 mb-3 tracking-widest uppercase">How it works</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-bold tracking-tight sm:text-5xl">
              Live in under{" "}
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">a minute</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid gap-12 sm:grid-cols-3 relative"
          >
            {/* Connector line */}
            <div className="hidden sm:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

            {steps.map((s, i) => (
              <motion.div key={s.n} variants={fadeUp} className="text-center relative">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10 mb-6">
                  <span className="font-mono text-lg font-bold text-violet-400">{s.n}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-32">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-sm font-medium text-violet-400 mb-3 tracking-widest uppercase">Pricing</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-bold tracking-tight sm:text-5xl">
              Simple,{" "}
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">transparent</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid gap-5 sm:grid-cols-3 items-start"
          >
            {plans.map((plan) => (
              <motion.div key={plan.name} variants={fadeUp}>
                <div className={`relative rounded-2xl p-8 h-full flex flex-col ${
                  plan.highlight
                    ? "border border-violet-500/50 bg-gradient-to-b from-violet-500/15 to-violet-500/5 shadow-xl shadow-violet-900/20"
                    : "border border-white/8 bg-white/3"
                }`}>
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-violet-600 text-xs font-semibold text-white">
                      Most popular
                    </div>
                  )}
                  <div className="mb-6">
                    <p className="text-sm font-medium text-white/60 mb-1">{plan.name}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period && <span className="text-white/40 text-sm">{plan.period}</span>}
                    </div>
                    <p className="text-sm text-white/40 mt-1">{plan.desc}</p>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2.5 text-sm text-white/70">
                        <Check className="h-4 w-4 text-violet-400 shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      plan.highlight
                        ? "bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-lg shadow-violet-900/40"
                        : "bg-white/8 hover:bg-white/12 text-white border border-white/10"
                    }`}
                    onClick={() => navigate("/auth")}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-32">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="relative rounded-3xl border border-violet-500/20 bg-gradient-to-b from-violet-500/10 to-transparent p-12 sm:p-20 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(139,92,246,0.15),transparent)]" />
            <motion.h2 variants={fadeUp} className="relative text-4xl font-bold tracking-tight sm:text-5xl">
              Ready to engage your audience?
            </motion.h2>
            <motion.p variants={fadeUp} className="relative mt-4 text-white/50 text-lg max-w-md mx-auto">
              Start free. No credit card. Your first 3 presentations are on us.
            </motion.p>
            <motion.div variants={fadeUp} className="relative mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="h-12 px-10 text-base bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-xl shadow-violet-900/50"
                onClick={() => navigate("/auth")}
              >
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="h-12 px-8 text-base text-white/60 hover:text-white hover:bg-white/8"
                onClick={() => navigate("/join")}
              >
                <Play className="mr-2 h-4 w-4" />
                Join a session
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm font-semibold">
            Pulse<span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Live</span>
          </span>
          <p className="text-sm text-white/30">
            © {new Date().getFullYear()} PulseLive. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-white/30">
            <button className="hover:text-white/60 transition-colors">Privacy</button>
            <button className="hover:text-white/60 transition-colors">Terms</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
