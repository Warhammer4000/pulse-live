CREATE POLICY "Anyone can view slides of active sessions"
ON public.slides FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.is_active = true
    AND sessions.presentation_id = slides.presentation_id
  )
);