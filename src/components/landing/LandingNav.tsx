import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function LandingNav() {
  const navigate = useNavigate();
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#080810]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <span className="text-lg font-bold tracking-tight">
          Pulse<span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Live</span>
        </span>
        <div className="hidden sm:flex items-center gap-6 text-sm text-white/60">
          <button onClick={() => scrollTo("features")} className="hover:text-white transition-colors">Features</button>
          <button onClick={() => scrollTo("how")} className="hover:text-white transition-colors">How it works</button>
          <button onClick={() => scrollTo("pricing")} className="hover:text-white transition-colors">Pricing</button>
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
  );
}
