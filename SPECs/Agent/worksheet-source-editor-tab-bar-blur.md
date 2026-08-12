---
title: Agent worksheet — source editor tab-bar blur
spec: ../source-editor-tab-bar-blur-spec.md
---

## TODO

Add the Markdown editor's progressive top blur to source-code panes so the
floating tabs remain readable over scrolling code.

## Reviewed

- `AGENTS.md`, `docs/workflows/agent-loop.md`, `docs/workflows/agent-review.md`
- `docs/react-guidelines.md`, `docs/consolidation.md`
- `SPECs/source-editor-tab-bar-blur-spec.md`
- `components/editor-area/editor-scroll-container.tsx`
- `components/editor-area/source-editor.tsx` and `source-editor.css`
- `components/editor-area/editor-pane.tsx`, `editor-area/index.tsx`, and
  `app-layout.tsx` for pane and tab stacking
- User references `blur-on-md.png` and `no-blur-on-code.png`

## Findings and plan

- Markdown already owns a 120px top `ProgressiveBlur` overlay inside
  `EditorScrollContainer`.
- Source files bypass that wrapper and mount CodeMirror directly, so they have
  no top blur even though the tab row is shared and positioned above both
  panes.
- Export the existing overlay and mount one top instance inside
  `SourceEditorPane`; preserve its pointer transparency and z-index so tabs
  remain above the blur. Use the shared overlay height as the source inset so
  line 1 starts below the entire blur field.

## Results

- Exported and reused the existing `ProgressiveBlur` component in
  `SourceEditorPane`, preserving the Markdown overlay's 120px fade, 3px blur,
  scrollbar-gutter alignment, pointer transparency, and z-index behavior.
- Promoted the 120px progressive-blur height to a shared CSS token and used it
  for both the overlay and the source editor's top scroll inset. CodeMirror
  scroll behavior remains unchanged, but source line 1 now starts below the
  full blur field.
- Validation: `vp check` passed with 0 errors and the two existing warnings;
  `vp test` passed (487 tests). The browser shell rendered normally; full file
  tab interaction remains unavailable in plain Vite because the Tauri bridge is
  absent, producing the expected startup/listener errors.
