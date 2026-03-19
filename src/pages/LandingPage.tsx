import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import PricingSection from "@/components/landing/PricingSection";
import CtaSection from "@/components/landing/CtaSection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080810] text-white overflow-x-hidden">
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <CtaSection />

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm font-semibold">
            Pulse<span className="accent-gradient-text">Live</span>
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
