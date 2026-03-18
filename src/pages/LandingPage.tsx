import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BarChart3, Cloud, MessageSquare, Zap, Users, ArrowRight, Star } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Real-time Polls",
    description: "Launch multiple-choice questions and watch results animate live as your audience votes.",
  },
  {
    icon: Cloud,
    title: "Word Clouds",
    description: "Collect words and phrases that form beautiful, dynamic word clouds in real time.",
  },
  {
    icon: MessageSquare,
    title: "Open Text",
    description: "Gather free-form responses displayed in a scrolling feed everyone can see.",
  },
];

const testimonials = [
  { name: "Sarah K.", role: "Conference Organizer", text: "PulseLive transformed our annual summit. 98% audience engagement rate!" },
  { name: "Mark T.", role: "University Professor", text: "My students actually participate now. The word clouds are a hit every lecture." },
  { name: "Lisa R.", role: "Workshop Facilitator", text: "Setup takes 30 seconds. The QR code join flow is genius." },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-xl font-bold tracking-tight">
            Pulse<span className="gradient-text">Live</span>
          </span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/join")}>
              Join Session
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button size="sm" className="gradient-bg glow-button text-primary-foreground" onClick={() => navigate("/auth")}>
              Get Started Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 py-24 lg:py-36">
        {/* Background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/8 blur-[120px] animate-pulse-glow" />
          <div className="absolute top-20 right-1/4 h-[300px] w-[400px] rounded-full bg-primary-glow/6 blur-[100px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Zap className="h-3.5 w-3.5" />
              Real-time audience engagement
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Make every presentation{" "}
              <span className="gradient-text">interactive</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="font-body mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Create polls, word clouds, and open Q&A in seconds. Share a code, 
              and watch your audience respond in real time. No app downloads required.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="gradient-bg glow-button h-13 px-8 text-base text-primary-foreground"
                onClick={() => navigate("/auth")}
              >
                Start for Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-13 px-8 text-base"
                onClick={() => navigate("/join")}
              >
                <Users className="mr-2 h-4 w-4" />
                Join a Session
              </Button>
            </motion.div>

            {/* Demo preview mockup */}
            <motion.div
              variants={fadeUp}
              className="mx-auto mt-16 max-w-3xl"
            >
              <div className="glass-card rounded-2xl p-1.5">
                <div className="rounded-xl bg-card p-6 sm:p-10">
                  <p className="mb-6 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
                    What's your favorite feature?
                  </p>
                  <div className="mx-auto max-w-md space-y-3">
                    {["Real-time Polls", "Word Clouds", "Open Text Q&A"].map((opt, i) => (
                      <motion.div
                        key={opt}
                        className="relative flex items-center gap-4 rounded-xl border border-border/60 bg-background p-4"
                        initial={{ width: "100%" }}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-mono font-bold text-primary-foreground">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="flex-1 font-medium">{opt}</span>
                        <div className="h-2 flex-1 max-w-[120px] rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full rounded-full gradient-bg"
                            initial={{ width: 0 }}
                            animate={{ width: `${[72, 85, 55][i]}%` }}
                            transition={{ delay: 1.2 + i * 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                        <span className="w-8 text-right text-sm font-mono text-muted-foreground">
                          {[72, 85, 55][i]}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center"
          >
            <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need for{" "}
              <span className="gradient-text">engaging presentations</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="font-body mx-auto mt-4 max-w-xl text-muted-foreground">
              Three powerful interaction types that work seamlessly on any device. No downloads, no sign-ups for your audience.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mt-16 grid gap-6 sm:grid-cols-3"
          >
            {features.map((f) => (
              <motion.div key={f.title} variants={fadeUp}>
                <div className="glass-card-hover group rounded-2xl p-8">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold">{f.title}</h3>
                  <p className="font-body mt-2 text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-24 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center"
          >
            <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight sm:text-4xl">
              Live in <span className="gradient-text">3 steps</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mt-16 grid gap-8 sm:grid-cols-3"
          >
            {[
              { step: "01", title: "Create", desc: "Build your interactive slides with polls, word clouds, or open text." },
              { step: "02", title: "Share", desc: "Start a session and share the 6-digit code or QR code." },
              { step: "03", title: "Engage", desc: "Watch responses flow in real time as your audience participates." },
            ].map((s) => (
              <motion.div key={s.step} variants={fadeUp} className="text-center">
                <span className="font-mono text-4xl font-bold gradient-text">{s.step}</span>
                <h3 className="mt-3 text-xl font-semibold">{s.title}</h3>
                <p className="font-body mt-2 text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp} className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Loved by <span className="gradient-text">presenters everywhere</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mt-16 grid gap-6 sm:grid-cols-3"
          >
            {testimonials.map((t) => (
              <motion.div key={t.name} variants={fadeUp}>
                <div className="glass-card rounded-2xl p-6 h-full">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="font-body text-foreground leading-relaxed">"{t.text}"</p>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="glass-card rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 to-primary-glow/5" />
            <motion.h2 variants={fadeUp} className="relative text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to engage your audience?
            </motion.h2>
            <motion.p variants={fadeUp} className="font-body relative mt-4 text-muted-foreground text-lg">
              Start creating interactive presentations in seconds. Free forever for up to 3 presentations.
            </motion.p>
            <motion.div variants={fadeUp} className="relative mt-8">
              <Button
                size="lg"
                className="gradient-bg glow-button h-13 px-10 text-base text-primary-foreground"
                onClick={() => navigate("/auth")}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm font-semibold">
            Pulse<span className="gradient-text">Live</span>
          </span>
          <p className="font-body text-sm text-muted-foreground">
            © {new Date().getFullYear()} PulseLive. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
