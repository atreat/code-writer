---
title: Agent worksheet — image preview first-load and pane-wide controls
spec: ../image-preview-first-load-and-controls-spec.md
---

## TODO

Fix the first image preview load and keep image controls available across the
whole preview pane.

## Reviewed

- `AGENTS.md`, `docs/workflows/agent-loop.md`, `docs/workflows/agent-review.md`
- `docs/react-guidelines.md`, `docs/consolidation.md`
- `SPECs/image-preview-first-load-and-controls-spec.md`
- `components/editor-area/image-preview.tsx`
- `components/editor-area/use-image-preview.ts`
- `components/editor-area/image-preview.css`
- `components/editor-area/editor-pane.tsx` and `stores/editor-store.ts` for
  loading, activation, and reload-version sequencing
- User references `Screenshot 2026-08-12 at 11.53.38 AM.png` and
  `Screenshot 2026-08-12 at 12.07.30 PM.png`

## Findings and plan

- The current ready transition waits for `requestAnimationFrame` after the
  image load event. This adds a timing dependency to the first render and has
  no `complete/naturalWidth` fallback when WebKit has already completed the
  asset before the listener path is observed.
- Use one shared completion helper for the load event and a ref/effect complete
  check after mount and reload reset. Set ready synchronously after validating
  natural dimensions; the existing CSS opacity transition remains the
  crossfade.
- Current controls are revealed only by `.image-preview-viewport:hover` and
  focus selectors. Add pane-level hover/focus-within selectors so controls
  remain visible and pointer-enabled throughout the preview pane.

## Results

- Removed the requestAnimationFrame dependency from the ready transition. A
  shared dimension-validated completion helper now serves the image load event,
  while a post-mount/post-reload `complete` check handles cached images and the
  effect-order race that could reset a successful first load back to loading.
- Moved control visibility/pointer activation to `.image-preview-pane:hover`
  and `:focus-within`, so the controls stay usable across the full pane rather
  than only while the viewport is hovered.
- Validation: `vp check` passed with 0 errors and the two existing warnings;
  `vp test` passed (487 tests). The browser shell rendered from the already
  running local Vite server; full file-tab interaction remains unavailable
  without the Tauri bridge.
