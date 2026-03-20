## Plan: Fix Build Errors and Identify Next Improvements

### Part 1: Fix Build Errors (3 issues)

**Error 1**: `plans` not exported from `constants.ts (we don't need plan as it's anti-saas remove it)`

- `PricingSection.tsx` imports `plans` from `./constants`, but `constants.ts` has no `plans` export
- Add a `plans` array to `src/components/landing/constants.ts` with Free/Pro/Team tiers (matching what PricingSection renders)

**Error 2**: Extra props passed to `SlideEditorForm` that don't exist in its `Props` interface

- `SlideEditor.tsx` passes `canDelete`, `isDuplicating`, `onDuplicate`, `onDelete` to `SlideEditorForm`, but the form's `Props` only has `slide`, `onTypeChange`, `onSave`
- Remove these 4 props from the `SlideEditorForm` usage in `SlideEditor.tsx` (lines 86-90) -- the form doesn't use them

**Error 3**: No `supabase/functions` directory

- The edge function was deleted but the empty directory is missing
- Create a `.gitkeep` file in `supabase/functions/` to keep the directory

### Part 2: Improvements to Consider Next

After fixing these build errors, here are the highest-impact improvements ranked by priority:

1. **QR code on join page** -- Currently participants must type the 6-digit code. Adding a QR scanner option on `/join` would speed up onboarding.
2. **Timer for Quiz mode** -- Quiz slides currently have no countdown timer. Adding a configurable timer (10s/20s/30s) per quiz slide with auto-lock when time runs out would make quizzes more engaging.
3. **Slide thumbnails with type icons** -- The sidebar thumbnails could show the slide type icon and a preview of the question text for faster navigation.
4. **Export improvements** -- Add PDF export for session results alongside the existing Excel/CSV export.
5. **Duplicate presentation** -- Allow users to duplicate an entire presentation (with all slides) from the presentations list.

### Technical Details

For the build fixes, the changes are:

`**src/components/landing/constants.ts**` -- Add:

```typescript
export const plans = [
  {
    name: "Free",
    price: "$0",
    period: null,
    desc: "For trying things out",
    features: ["Up to 3 presentations", "25 participants per session", "Basic slide types", "7-day history"],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/mo",
    desc: "For professionals and educators",
    features: ["Unlimited presentations", "500 participants per session", "All slide types", "Unlimited history", "Export to Excel & CSV", "Custom branding"],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Team",
    price: "$29",
    period: "/mo",
    desc: "For teams and organizations",
    features: ["Everything in Pro", "Unlimited participants", "Team collaboration", "Priority support", "SSO & admin controls"],
    cta: "Contact Sales",
    highlight: false,
  },
];
```

`**src/pages/SlideEditor.tsx**` -- Remove extra props from `SlideEditorForm`:

```tsx
<SlideEditorForm
  slide={selectedSlide}
  onTypeChange={(type: SlideType) => updateSlideType(selectedSlide, type)}
  onSave={(question: string, options: unknown, imageUrl: string) => saveSlideContent(selectedSlide, question, options, imageUrl)}
/>
```

`**supabase/functions/.gitkeep**` -- Create empty file.