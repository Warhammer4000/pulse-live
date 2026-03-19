import { motion } from "framer-motion";
import { fadeUp, stagger, steps } from "./constants";

export default function HowItWorksSection() {
  return (
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
          <motion.p variants={fadeUp} className="text-sm font-medium accent-text mb-3 tracking-widest uppercase">How it works</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl font-bold tracking-tight sm:text-5xl">
            Live in under{" "}
            <span className="accent-gradient-text">a minute</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="grid gap-12 sm:grid-cols-3 relative"
        >
          <div className="hidden sm:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          {steps.map((s) => (
            <motion.div key={s.n} variants={fadeUp} className="text-center relative">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl accent-border border accent-surface mb-6">
                <span className="font-mono text-lg font-bold accent-text">{s.n}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
