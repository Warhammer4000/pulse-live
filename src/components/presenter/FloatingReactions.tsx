import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface FloatingEmoji { id: string; emoji: string; x: number; }

interface Props { sessionId: string; }

export function FloatingReactions({ sessionId }: Readonly<Props>) {
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel(`reactions-${sessionId}`)
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        const e: FloatingEmoji = { id: crypto.randomUUID(), emoji: payload.emoji, x: 5 + Math.random() * 15 };
        setEmojis((prev) => [...prev.slice(-30), e]);
        setTimeout(() => setEmojis((prev) => prev.filter((x) => x.id !== e.id)), 3000);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {emojis.map((e) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 1, y: "80vh", x: `${e.x}vw`, scale: 0.8 }}
            animate={{ opacity: 0, y: "10vh", scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="absolute text-2xl"
          >
            {e.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
