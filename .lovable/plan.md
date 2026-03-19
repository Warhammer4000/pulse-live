

## Fix: Question Image URL Not Being Saved

### Root Cause
The `imageUrl` state is managed in `SlideEditorForm` but never passed to `onSave`. The `onSave` callback only receives `(question, options)` and `saveSlideContent` in `useSlideEditor.ts` only persists `{ question, options }` -- the `image_url` column is never included in the update.

### Fix (2 changes)

1. **`SlideEditorForm.tsx`**: Include `imageUrl` in the debounced save effect, and pass it as a third argument to `onSave`. Update the `Props` interface so `onSave` accepts `(question: string, options: unknown, imageUrl: string)`. Add `imageUrl` to the `useEffect` dependency array.

2. **`useSlideEditor.ts`**: Update `saveSlideContent` to accept and persist `image_url`:
   ```
   saveSlideContent(slide, question, options, imageUrl) {
     updateSlideMutation.mutate({
       slideId: slide.id,
       data: { question, options: JSON.stringify(options), image_url: imageUrl || null }
     });
   }
   ```

No database changes needed -- the `image_url` column already exists on the `slides` table.

