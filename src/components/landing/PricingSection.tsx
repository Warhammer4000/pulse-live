import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { fadeUp, stagger, plans } from "./constants";

export default function PricingSection() {
  const navigate = useNavigate();

  return (
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
  );
}
