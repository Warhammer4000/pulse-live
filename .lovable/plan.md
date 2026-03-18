

## Plan: Replace Edge Function with Database RPC

### What changes
Replace the scheduled edge function with a simple database function that closes stale sessions. Call it when sessions are loaded rather than on a timer.

### Steps

1. **Create a database function** `close_stale_sessions` that updates `sessions` set `is_active = false` where `is_active = true` and `created_at < now() - interval '24 hours'`

2. **Delete the edge function** `supabase/functions/auto-close-sessions/index.ts`

3. **Remove the cron job** via migration: `select cron.unschedule('auto-close-inactive-sessions')`

4. **Call the RPC on session load** — in `PresentationsPage.tsx` and `Dashboard.tsx`, invoke `supabase.rpc('close_stale_sessions')` before querying for active sessions (fire-and-forget)

5. **Fix the build error** — the `err` type issue goes away since the edge function is deleted

### Technical notes
- The RPC function uses `SECURITY DEFINER` so it can update any session regardless of RLS
- No scheduled jobs needed — stale sessions get cleaned up naturally when users interact with the app
- Simpler infrastructure, fewer moving parts

