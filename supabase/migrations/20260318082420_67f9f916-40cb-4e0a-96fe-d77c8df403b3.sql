
-- Replace the overly permissive insert policy with a more targeted one
DROP POLICY "Anyone can insert responses" ON public.responses;

CREATE POLICY "Anyone can insert responses to active unlocked sessions" ON public.responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE id = session_id AND is_active = true AND voting_locked = false
    )
  );
