

# Fix Audience Join + Add QR Code & Shareable Link

## Issues Found

### 1. 406 Error: Slides RLS blocks audience access
The `slides` table only has SELECT policies for authenticated presentation owners. When an unauthenticated audience member hits `/live/:code`, the query to fetch the active slide fails with 406 because there's no RLS policy allowing public read access to slides in active sessions.

### 2. Missing QR code on presenter view
### 3. Join link should include the code for easy sharing

---

## Changes

### A. Database Migration: Add public SELECT policy for slides in active sessions

```sql
CREATE POLICY "Anyone can view slides of active sessions"
ON public.slides FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.is_active = true
    AND sessions.presentation_id = slides.presentation_id
  )
);
```

### B. Presenter View: Add QR code + shareable link

- Install/use a QR code library (e.g., `qrcode.react`)
- Generate QR code pointing to `{origin}/join/{session.join_code}`
- Display the full shareable link (`{origin}/join/{join_code}`) instead of just `{origin}/join`
- Show QR code next to the join code in the footer bar

### C. Files to edit

1. **Database migration** -- new RLS policy on `slides`
2. **src/pages/PresenterView.tsx** -- add QR code component, update join URL to include code
3. **package.json** -- add `qrcode.react` dependency

