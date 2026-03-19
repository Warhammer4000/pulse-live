

## Fix: Image URL Still Not Persisted

### Root Cause
In `src/pages/SlideEditor.tsx` line 78, the `onSave` callback only forwards `question` and `options` to `saveSlideContent`, ignoring the third `imageUrl` argument that `SlideEditorForm` now passes:

```tsx
// Current (broken)
onSave={(question: string, options: unknown) => saveSlideContent(selectedSlide, question, options)}
```

### Fix
Update line 78 in `src/pages/SlideEditor.tsx` to include the `imageUrl` parameter:

```tsx
onSave={(question: string, options: unknown, imageUrl: string) => saveSlideContent(selectedSlide, question, options, imageUrl)}
```

Single line change. No other files need modification -- `saveSlideContent` already accepts and persists `imageUrl`, and the form already sends it.

