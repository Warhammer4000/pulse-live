import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080810] px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_40%,rgba(139,92,246,0.1),transparent)]" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative text-center"
      >
        <p className="text-sm font-medium text-violet-400 tracking-widest uppercase mb-4">404</p>
        <h1 className="text-6xl font-bold text-white tracking-tight mb-3">Page not found</h1>
        <p className="text-white/40 text-lg mb-8">
          The page at <span className="font-mono text-white/60">{location.pathname}</span> doesn't exist.
        </p>
        <Button
          className="bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-lg shadow-violet-900/40"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFound;
