import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github } from "lucide-react";
import { fadeUp, stagger } from "./constants";

export default function CtaSection() {
  const navigate = useNavigate();

  return (
    <section className="px-6 py-32">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="relative rounded-3xl border border-violet-500/30 bg-violet-500/10 p-12 sm:p-20 text-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(139,92,246,0.15),transparent)]" />
          <motion.p variants={fadeUp} className="relative text-sm font-medium text-violet-400 tracking-widest uppercase mb-4">
            Get started today
          </motion.p>
          <motion.h2 variants={fadeUp} className="relative text-4xl font-bold tracking-tight sm:text-5xl">
            Own your stack.
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Engage your audience.
            </span>
          </motion.h2>
          <motion.p variants={fadeUp} className="relative mt-4 text-white/50 text-lg max-w-md mx-auto">
            Fork it, deploy it, use it forever. No subscriptions, no limits, no middleman.
          </motion.p>
          <motion.div variants={fadeUp} className="relative mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="h-12 px-10 text-base bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-lg shadow-violet-900/40"
              onClick={() => navigate("/auth")}
            >
              Try the live demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <a href="https://github.com/Warhammer4000/pulse-live" target="_blank" rel="noopener noreferrer">
              <Button
                variant="ghost"
                size="lg"
                className="h-12 px-8 text-base text-white/60 hover:text-white hover:bg-white/8"
              >
                <Github className="mr-2 h-4 w-4" />
                Fork on GitHub
              </Button>
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
