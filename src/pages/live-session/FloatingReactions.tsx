import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { FloatingEmoji } from "./types";

interface Props { readonly sessionId: string; }

export function FloatingReactions({ sessionId }: Props) {
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);

  const removeEmoji = (id: string) => {
    setEmojis((prev) => prev.filter((x) => x.id !== id));
  };

  const addEmoji = (payload: { emoji: string }) => {
    const e: FloatingEmoji = { id: crypto.randomUUID(), emoji: payload.emoji, x: 20 + Math.random() * 60 };
    setEmojis((prev) => [...prev.slice(-20), e]);
    setTimeout(() => removeEmoji(e.id), 2500);
  };

  useEffect(() => {
    const channel = supabase.channel(`reactions-${sessionId}`)
      .on("broadcast", { event: "reaction" }, ({ payload }) => addEmoji(payload))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {emojis.map((e) => (
          <motion.div key={e.id}
            initial={{ opacity: 1, y: "100vh", x: `${e.x}vw`, scale: 1 }}
            animate={{ opacity: 0, y: "-10vh", scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
            className="absolute text-3xl">
            {e.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
