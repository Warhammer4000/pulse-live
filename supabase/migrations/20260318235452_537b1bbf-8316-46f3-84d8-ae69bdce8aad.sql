
CREATE OR REPLACE FUNCTION public.close_stale_sessions()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE sessions
  SET is_active = false
  WHERE is_active = true
    AND created_at < now() - interval '24 hours';
$$;
