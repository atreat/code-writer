# Worksheet: image preview zoom input

## Task

Make the image preview percentage an editable field for precise zoom changes.
Linked spec: [`SPECs/image-preview-zoom-input-spec.md`](../image-preview-zoom-input-spec.md).

## Reviewed

- `apps/desktop/src/components/editor-area/image-preview.tsx`
- `apps/desktop/src/components/editor-area/use-image-preview.ts`
- `apps/desktop/src/components/editor-area/image-preview-logic.ts`
- `apps/desktop/tests/image-preview.test.ts`
- `apps/desktop/src/components/editor-area/image-preview.css`
- `TODOS.md`

## Plan

- Add a pure exact-zoom transform helper that reuses the existing anchor and
  clamp logic.
- Expose exact zoom setting from the image preview hook while preserving the
  image center and bounded pan.
- Replace the static percentage label with a keyboard-accessible text input,
  committing on blur/Enter and restoring the value for invalid/cancelled edits.
- Add focused transform tests and validate the frontend/browser shell.

## Result

Implemented an editable decimal zoom field with optional `%` suffix parsing,
existing 25%–400% bounds, center-preserving exact zoom updates, and accessible
keyboard focus. Invalid/empty edits restore the current value; Escape cancels;
fit/zoom buttons commit an active draft first; and wheel/pinch events over the
field do not affect the image.

Independent UX and React/QA reviews found P1 issues in the initial draft
around empty input, Escape blur ordering, and controls/gesture interaction.
All findings were fixed before handoff. The review also identified component
interaction coverage as a gap; the pure parser and transform paths now have
focused tests, while the Tauri-only image-pane interaction remains a desktop
manual verification point.

Validation:

- `vp check`: 0 errors, 2 existing warnings.
- `vp test`: 30 files and 490 tests passed.
- Browser harness rendered the launcher shell successfully; it cannot mount a
  workspace image without the Tauri bridge.
