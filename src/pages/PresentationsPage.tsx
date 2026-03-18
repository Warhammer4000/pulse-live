import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
      const { data, error } = await supabase
        .from("presentations")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as PresentationRow[];
    },
  });

  const filtered = presentations.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: async (title: string) => {
      const { data, error } = await supabase
        .from("presentations")
        .insert({ title, user_id: user!.id })
        .select()
        .single();
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
      // Check for existing active session first
      const { data: existingSession } = await supabase
        .from("sessions")
        .select("*")
        .eq("presentation_id", presentationId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSession) {
        return existingSession;
      }

      // No active session — create a new one
      const joinCode = Math.floor(100000 + Math.random() * 900000).toString();
      const { data: slides } = await supabase
        .from("slides")
        .select("id")
        .eq("presentation_id", presentationId)
        .order("order")
        .limit(1);
      const { data, error } = await supabase
        .from("sessions")
        .insert({
          presentation_id: presentationId,
          join_code: joinCode,
          active_slide_id: slides?.[0]?.id ?? null,
        })
        .select()
        .single();
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

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">Presentations</h1>
        <p className="font-body mt-1 text-muted-foreground">Create and manage your interactive presentations</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleCreate} className="flex gap-3 flex-1">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New presentation title..."
            className="max-w-sm"
          />
          <Button type="submit" className="gradient-bg glow-button text-primary-foreground" disabled={createMutation.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </form>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search presentations..."
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Presentation className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              {search ? "No matching presentations" : "No presentations yet"}
            </p>
            <p className="font-body text-sm text-muted-foreground/70">
              {search ? "Try a different search term" : "Create your first one above"}
            </p>
          </CardContent>
        </Card>
      ) : (
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
                <Card
                  className="glass-card-hover group cursor-pointer rounded-2xl"
                  onClick={() => navigate(`/edit/${p.id}`)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg leading-tight">{p.title}</CardTitle>
                    <CardDescription className="font-body">
                      Last edited {new Date(p.updated_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="gradient-bg text-primary-foreground"
                      onClick={(e) => { e.stopPropagation(); startSession.mutate(p.id); }}
                      disabled={startSession.isPending}
                    >
                      <Play className="mr-1 h-3 w-3" /> Present
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); navigate(`/history/${p.id}`); }}
                    >
                      <BarChart3 className="mr-1 h-3 w-3" /> History
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(p.id); }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
