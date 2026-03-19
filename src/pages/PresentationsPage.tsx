import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Presentation, Trash2, Play, BarChart3, Search } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type PresentationRow = Tables<"presentations">;


export default function PresentationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newTitle, setNewTitle] = useState("");
  const [search, setSearch] = useState("");

  const { data: presentations = [], isLoading } = useQuery({
    queryKey: ["presentations"],
    queryFn: async () => {
      // Close stale sessions (24h+) before loading
      await supabase.rpc("close_stale_sessions");
      const { data, error } = await supabase.from("presentations").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data as PresentationRow[];
    },
  });

  const filtered = presentations.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: async (title: string) => {
      const { data, error } = await supabase.from("presentations").insert({ title, user_id: user?.id }).select().single();
      if (error) throw error;
      await supabase.from("slides").insert({
        presentation_id: data.id,
        order: 0,
        type: "multiple_choice" as const,
        question: "Your first question?",
        options: JSON.stringify(["Option A", "Option B", "Option C"]),
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["presentations"] });
      navigate(`/edit/${data.id}`);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("presentations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["presentations"] }),
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const startSession = useMutation({
    mutationFn: async (presentationId: string) => {
      const { data: existing } = await supabase
        .from("sessions").select("*").eq("presentation_id", presentationId)
        .eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (existing) return existing;
      const joinCode = Math.floor(100000 + Math.random() * 900000).toString();
      const { data: slides } = await supabase.from("slides").select("id").eq("presentation_id", presentationId).order("order").limit(1);
      const { data, error } = await supabase.from("sessions").insert({
        presentation_id: presentationId,
        join_code: joinCode,
        active_slide_id: slides?.[0]?.id ?? null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => navigate(`/present/${data.id}`),
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newTitle || "Untitled Presentation");
    setNewTitle("");
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      );
    }
    if (filtered.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center py-16 text-center">
          <Presentation className="mb-4 h-10 w-10 text-white/20" />
          <p className="text-white/60 font-medium">{search ? "No matching presentations" : "No presentations yet"}</p>
          <p className="text-white/30 text-sm mt-1">{search ? "Try a different search term" : "Create your first one above"}</p>
        </div>
      );
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
            >
              <article className="group rounded-2xl border border-white/8 bg-white/5 hover:border-white/15 hover:bg-white/8 transition-all duration-200 flex flex-col gap-4 overflow-hidden">
                <button
                  className="flex items-start justify-between gap-2 p-6 pb-0 text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-t-2xl"
                  onClick={() => navigate(`/edit/${p.id}`)}
                  aria-label={`Edit ${p.title}`}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{p.title}</p>
                    <p className="text-xs text-white/30 mt-0.5">
                      Updated {new Date(p.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl accent-surface">
                    <Presentation className="h-4 w-4 accent-text" />
                  </div>
                </button>
                <div className="flex gap-2 px-6 pb-6">
                  <Button
                    size="sm"
                    className="accent-bg accent-bg-hover text-white border-0 shadow-sm h-8 px-3 text-xs"
                    onClick={() => startSession.mutate(p.id)}
                    disabled={startSession.isPending}
                  >
                    <Play className="mr-1 h-3 w-3" /> Present
                  </Button>
                  <Button
                    size="sm"
                    className="bg-white/8 hover:bg-white/12 text-white border border-white/10 h-8 px-3 text-xs"
                    onClick={() => navigate(`/history/${p.id}`)}
                  >
                    <BarChart3 className="mr-1 h-3 w-3" /> History
                  </Button>
                  <Button
                    size="sm"
                    className="ml-auto bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 h-8 w-8 p-0"
                    onClick={() => deleteMutation.mutate(p.id)}
                    aria-label={`Delete ${p.title}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </article>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-bold tracking-tight text-white">Presentations</h1>
        <p className="mt-1 text-sm text-white/40">Create and manage your interactive presentations</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <form onSubmit={handleCreate} className="flex gap-3 flex-1">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New presentation title..."
            className="max-w-sm bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary/30 focus-visible:border-primary/50"
          />
          <Button
            type="submit"
            className="accent-bg accent-bg-hover text-white border-0 accent-shadow shrink-0"
            disabled={createMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </form>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary/30 focus-visible:border-primary/50"
          />
        </div>
      </motion.div>

      {renderContent()}
    </div>
  );
}
