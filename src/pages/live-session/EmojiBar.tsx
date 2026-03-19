import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const REACTION_EMOJIS = ["👍", "❤️", "🔥", "😂", "🎉", "👏"];

interface Props { readonly sessionId: string; }

export function EmojiBar({ sessionId }: Props) {
  const [cooldown, setCooldown] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    channelRef.current = supabase.channel(`reactions-${sessionId}`);
    channelRef.current.subscribe();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [sessionId]);

  const sendReaction = (emoji: string) => {
    if (cooldown || !channelRef.current) return;
    channelRef.current.send({ type: "broadcast", event: "reaction", payload: { emoji } });
    if (navigator.vibrate) navigator.vibrate(30);
    setCooldown(true);
    setTimeout(() => setCooldown(false), 500);
  };

  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {REACTION_EMOJIS.map((emoji) => (
        <motion.button key={emoji} whileTap={{ scale: 1.4 }}
          onClick={() => sendReaction(emoji)}
          disabled={cooldown}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full bg-white/5 border border-white/8 text-xl transition-all hover:bg-white/10",
            cooldown && "opacity-50"
          )}>
          {emoji}
        </motion.button>
      ))}
    </div>
  );
}
