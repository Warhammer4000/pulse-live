import { motion } from "framer-motion";
import { fadeUp, stagger } from "./constants";
import { ExternalLink, Database, Globe, Terminal } from "lucide-react";

const tiers = [
  {
    icon: Database,
    name: "Supabase",
    tier: "Free tier",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    perks: ["500 MB database", "Unlimited auth users", "Real-time subscriptions", "2 GB file storage"],
    url: "https://supabase.com/pricing",
  },
  {
    icon: Globe,
    name: "Netlify",
    tier: "Free tier",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    perks: ["100 GB bandwidth/mo", "Unlimited deploys", "Custom domain + HTTPS", "Serverless functions"],
    url: "https://www.netlify.com/pricing",
  },
];

const steps = [
  {
    n: "01",
    title: "Clone the repo",
    code: "git clone https://github.com/Warhammer4000/pulse-live.git\ncd pulse-live",
  },
  {
    n: "02",
    title: "Run the deploy script",
    code: "# Windows\ndeploy.bat\n\n# Mac / Linux\nchmod +x deploy.sh && ./deploy.sh",
  },
  {
    n: "03",
    title: "Follow the prompts",
    code: "# The script handles:\n# • Supabase setup & migrations\n# • Netlify deployment\n# • Environment variables",
  },
];

export default function SelfHostSection() {
  return (
    <section id="deploy" className="px-6 py-32 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(139,92,246,0.06),transparent)]" />
      <div className="relative mx-auto max-w-6xl">

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.p variants={fadeUp} className="text-sm font-medium text-violet-400 mb-3 tracking-widest uppercase">Self-host</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl font-bold tracking-tight sm:text-5xl">
            Your instance.{" "}
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Your data. $0.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-white/50 max-w-lg mx-auto">
            No subscriptions. No per-seat pricing. Clone the repo, run one script, and you're live — the deploy assistant handles everything else.
          </motion.p>
        </motion.div>

        {/* 3-step deploy */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="grid gap-5 sm:grid-cols-3 mb-16"
        >
          {steps.map((s) => (
            <motion.div key={s.n} variants={fadeUp}>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 h-full flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 shrink-0">
                    <span className="font-mono text-xs font-bold text-violet-400">{s.n}</span>
                  </div>
                  <p className="text-white font-semibold text-sm">{s.title}</p>
                </div>
                <div className="rounded-lg bg-black/40 border border-white/5 px-4 py-3 flex-1">
                  <pre className="text-xs text-white/50 font-mono whitespace-pre-wrap">{s.code}</pre>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Node.js note */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4 flex items-center gap-3"
        >
          <Terminal className="h-4 w-4 text-white/30 shrink-0" />
          <p className="text-sm text-white/40">
            You'll need <span className="text-white/60">Node.js</span> installed. The script will offer to install the Supabase and Netlify CLIs automatically if they're missing.
          </p>
        </motion.div>

        {/* Free tier cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="grid gap-5 sm:grid-cols-2"
        >
          {tiers.map((t) => (
            <motion.div key={t.name} variants={fadeUp}>
              <a href={t.url} target="_blank" rel="noopener noreferrer" className="block group">
                <div className={`rounded-2xl border ${t.border} bg-white/[0.03] p-6 hover:bg-white/5 transition-all duration-300 h-full`}>
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.bg}`}>
                        <t.icon className={`h-5 w-5 ${t.color}`} />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{t.name}</p>
                        <span className={`text-xs font-medium ${t.color}`}>{t.tier}</span>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-white/20 group-hover:text-white/50 transition-colors" />
                  </div>
                  <ul className="space-y-2">
                    {t.perks.map((p) => (
                      <li key={p} className="flex items-center gap-2.5 text-sm text-white/50">
                        <span className={`w-1.5 h-1.5 rounded-full ${t.bg} shrink-0`} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </a>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
