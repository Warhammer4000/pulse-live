

## Fix: Emoji Reactions Not Showing on Presenter View

### Root Cause
Channel name mismatch between participant and presenter:
- Participant sends on: `reactions-{sessionId}`
- Presenter listens on: `presenter-reactions-{sessionId}`

### Fix
Update `src/components/presenter/FloatingReactions.tsx` to subscribe to `reactions-${sessionId}` instead of `presenter-reactions-${sessionId}`.

One-line change in the `useEffect` — change the channel name to match what participants broadcast on.

