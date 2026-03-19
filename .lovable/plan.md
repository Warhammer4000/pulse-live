

## Plan: Expand Slide Types and Add Image Support

### Current State
3 slide types exist: `multiple_choice`, `word_cloud`, `open_text`. Options are stored as a JSONB `options` column (string arrays for MC). No image support anywhere.

### What Changes

**1. Database Migration**
- Add 4 new values to the `slide_type` enum: `rating_scale`, `quiz`, `ranking`, `poll`
- Add a nullable `image_url` text column to the `slides` table (for question-level images)
- Evolve the `options` JSONB format: for MC/Quiz/Ranking, store objects `{ text: string, image_url?: string }` instead of plain strings. Existing plain-string arrays will still be handled via a parser fallback.

**2. New Slide Types**

| Type | Editor UI | Participant UI | Visualization |
|------|-----------|----------------|---------------|
| **Rating Scale** | Configure min/max (1-5 or 1-10) via dropdown | Tap a star/number | Average + distribution histogram |
| **Quiz** | Same as MC + mark correct answer toggle | Same as MC (timed) | Bar chart + correct answer highlight |
| **Ranking** | Define items to rank (like MC options) | Drag-to-reorder list | Aggregated rank scores bar chart |
| **Poll** | Pre-set options (Yes/No/Maybe) - no editing needed | Tap one of 2-3 buttons | Donut/pie chart |

**3. Image Support for Multiple Choice and Quiz**
- In `SlideEditorForm`, add an optional image URL input per option (collapsible, shows thumbnail preview)
- Add a question-level image URL input that shows above the question text
- Render images in: editor preview, participant live session view, and presenter view
- Images loaded from external URLs (imgur, etc.) with `object-fit: cover` and lazy loading

**4. Files to Create/Modify**

- **Migration SQL**: Alter enum, add `image_url` column
- **`src/pages/slide-editor/types.ts`**: Add new types to `TYPE_ICONS` and `TYPE_LABELS`
- **`src/pages/slide-editor/SlideEditorForm.tsx`**: Add editor sections for all 4 new types + image URL inputs for MC/Quiz options and question-level image
- **`src/pages/slide-editor/useSlideEditor.ts`**: Handle new types in save/create logic
- **`src/pages/live-session/SlideContent.tsx`**: Add participant UI for rating, quiz, ranking, poll
- **`src/components/presenter/SlideStage.tsx`**: Add presenter visualizations for new types
- **New visualization components**:
  - `src/components/visualizations/RatingViz.tsx` - star distribution + average
  - `src/components/visualizations/QuizViz.tsx` - bar chart with correct answer highlighted
  - `src/components/visualizations/RankingViz.tsx` - aggregated ranking scores
  - `src/components/visualizations/PollViz.tsx` - donut/pie chart
- **`src/pages/session-history/SlideViz.tsx`**: Support new types in history view

**5. Data Format Conventions**
- **Rating**: `options` stores `{ min: 1, max: 5 }` or `{ min: 1, max: 10 }`. Response `value` is the number as string.
- **Quiz**: `options` stores `[{ text: "...", image_url?: "...", is_correct: true/false }, ...]`. Response `value` is the selected text.
- **Ranking**: `options` stores `["Item A", "Item B", ...]`. Response `value` is JSON-stringified ordered array.
- **Poll**: `options` stores `["Yes", "No"]` or `["Yes", "No", "Maybe"]`. Response `value` is the selected label.
- **MC with images**: `options` evolves to `[{ text: "...", image_url?: "..." }, ...]` with backward-compat parsing for plain strings.

### Technical Notes
- The `parseOptions` helper used across files will be updated to handle both `string[]` and `{ text, image_url?, is_correct? }[]` formats with a unified type
- Backward compatibility: existing slides with plain string options continue to work via the parser fallback
- No new tables needed -- everything fits in the existing `slides.options` JSONB and `responses.value` text columns
- Quiz mode does not include a timer or leaderboard in this iteration -- just correct answer marking and highlighting

