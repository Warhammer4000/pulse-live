import { motion } from "framer-motion";
import { fadeUp, stagger, features } from "./constants";

export default function FeaturesSection() {
  return (
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
            Six ways to engage,{" "}
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">zero friction</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-white/50 max-w-lg mx-auto">
            No app downloads for your audience. Just a code or a scan. All interaction types included — no paywalls.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={fadeUp}>
              <div className="group relative rounded-2xl border border-white/8 bg-white/[0.03] p-8 hover:border-white/15 hover:bg-white/5 transition-all duration-300 overflow-hidden h-full">
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                    <f.icon className={`h-5 w-5 ${f.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{f.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{f.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* No paywall callout */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
              <span className="text-emerald-400 text-lg">✓</span>
            </span>
            <div>
              <p className="text-white font-medium text-sm">All features, always free</p>
              <p className="text-white/40 text-xs mt-0.5">Every interaction type is available on your self-hosted instance. No tiers, no upgrades, no surprises.</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1 font-medium">
            Open source
          </span>
        </motion.div>
      </div>
    </section>
  );
}
