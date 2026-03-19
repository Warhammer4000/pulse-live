import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import SelfHostSection from "@/components/landing/SelfHostSection";
import CtaSection from "@/components/landing/CtaSection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080810] text-white overflow-x-hidden">
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SelfHostSection />
      <CtaSection />

      <footer className="border-t border-white/5 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm font-semibold">
            Pulse<span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Live</span>
          </span>
          <p className="text-sm text-white/30">
            Open source. MIT licensed. No strings attached.
          </p>
          <div className="flex gap-6 text-sm text-white/30">
            <a href="https://github.com/Warhammer4000/pulse-live" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">GitHub</a>
            <button className="hover:text-white/60 transition-colors">Privacy</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
