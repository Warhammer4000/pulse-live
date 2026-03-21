

## Plan: Improve Quiz Timer with Presenter Controls

### Summary
Rework the quiz timer so the presenter manually starts it, options are hidden until started, the presenter can bypass/override the lock, and the timer input allows custom values beyond presets.

### Changes

**1. `useQuizTimer.ts` — Add manual start control**
- Don't auto-start the countdown on slide load. Instead, expose a `startTimer()` callback and a `started` boolean.
- When `started` is false: `timeLeft` equals `totalSeconds` (paused), options hidden.
- When `startTimer()` is called: begin the countdown interval.
- Add a `resetTimer()` to allow restarting.
- Keep the auto-lock behavior on expiry.

New return type:
```typescript
interface QuizTimerResult {
  timeLeft: number | null;
  totalSeconds: number | null;
  started: boolean;
  startTimer: () => void;
  resetTimer: () => void;
}
```

**2. `SlideStage.tsx` — Hide options until timer starts, add start button**
- Accept new props: `quizStarted`, `onStartQuizTimer`.
- When quiz slide has a timer and `quizStarted` is false: show the question but replace the answer visualization with a "Start Quiz" button for the presenter.
- Once started, show the countdown bar + quiz options/results as before.

**3. `PresenterView.tsx` — Wire up new timer controls + bypass**
- Pass `quizTimer.started` and `quizTimer.startTimer` to `SlideStage`.
- When the timer expires and voting is locked, the presenter can still manually unlock voting via the existing `toggleVotingLock` (this already works as a bypass — just ensure the unlock button is visible even after timer expiry).

**4. `PresenterTopBar.tsx` — Ensure lock/unlock toggle is always visible for quiz**
- Verify the voting lock toggle button remains accessible after timer auto-locks so the presenter can override it.

**5. `SlideContent.tsx` (participant view) — Hide quiz options until timer starts**
- Need a way for participants to know the timer has started. Use the session's `voting_locked` field:
  - When a quiz slide loads, set `voting_locked = true` initially (before timer starts).
  - When presenter clicks "Start Quiz", set `voting_locked = false` and start the timer.
  - When timer expires, set `voting_locked = true` again.
- This means participants see "Voting is locked" until the presenter starts the timer — which is the existing locked UI. No participant-side code changes needed beyond what already exists.

**6. `useQuizTimer.ts` — Auto-lock on slide entry**
- When a quiz slide with a timer becomes active and `started` is false, auto-set `voting_locked = true` on the session so participants can't answer yet.

**7. `SlideEditorForm.tsx` — Custom timer input**
- Replace the dropdown with a hybrid: show preset buttons (30s, 45s, 60s) plus a custom number input.
- Allow any value from 5 to 300 seconds.

### Flow
```text
Quiz slide loaded → voting locked, options hidden for everyone
         ↓
Presenter clicks "Start Quiz" → voting unlocked, timer counts down
         ↓
Timer expires → voting auto-locked, results shown
         ↓
Presenter can manually unlock again (bypass) if needed
```

### Files modified
- `src/hooks/presenter/useQuizTimer.ts` — add `started`, `startTimer`, `resetTimer`, auto-lock on entry
- `src/components/presenter/SlideStage.tsx` — accept new props, show start button
- `src/pages/PresenterView.tsx` — wire new timer state
- `src/pages/slide-editor/SlideEditorForm.tsx` — custom timer input with presets

