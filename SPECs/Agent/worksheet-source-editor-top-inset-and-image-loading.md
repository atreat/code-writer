---
title: Agent worksheet — source editor top inset and image loading lifecycle
spec: ../source-editor-top-inset-and-image-loading-spec.md
---

## TODO

Keep source code below the floating tab bar and fix image preview loading and
inactive resource retention in the existing editor panes.

## Reviewed

- `AGENTS.md`, `docs/workflows/agent-loop.md`, `docs/workflows/agent-review.md`
- `docs/react-guidelines.md`, `docs/consolidation.md`
- `SPECs/source-editor-top-inset-and-image-loading-spec.md`
- `apps/desktop/src/App.css` and `components/app-layout.tsx` for tab geometry
- `components/editor-area/source-editor.css` and `use-source-editor.ts`
- `components/editor-area/image-preview.tsx`, `use-image-preview.ts`,
  `image-preview.css`, and `image-preview-logic.ts`
- `apps/desktop/tests/image-preview.test.ts`

## Findings and plan

- The tab row is `32px` high with `12px` block padding, so its 56px chrome
  geometry is the correct source-editor scroll inset.
- Source CodeMirror content currently has only 24px top padding and the
  source pane sits beneath an absolutely positioned tab row.
- Image previews keep every file pane mounted. A hidden 1px image currently
  changes the hook to `ready` before the visible stage image loads, and there
  is no lifecycle that releases inactive image elements.
- Replace the hidden preloader with one staged image whose `load` event drives
  the ready state and whose opacity transitions into view. Add a local,
  inactive-pane eviction timer with cleanup; keep the asset protocol URL and
  existing reload-version behavior unchanged.

## Results

- Added a 56px CodeMirror scroll top inset derived from the existing tab-row
  variables, with matching scroll-padding so source line 1 and the gutter stay
  below the floating tabs at scroll top.
- Replaced the hidden duplicate image preloader with one staged image. Its
  actual load event schedules the ready state on the next animation frame so
  the image can crossfade in and the loading message cannot remain stale.
- Added a local 60-second inactive-pane eviction timer. It cancels on quick
  tab return and clears the image dimensions/transform when it fires; reload
  and unmount paths also cancel pending fade callbacks.
- Validation: `vp check` passed with 0 errors and the two existing warnings;
  `vp test` passed (487 tests); focused image tests passed (7 tests);
  `cargo fmt --check` passed; `cargo test --lib -- --skip
test_delete_entry_moves_to_trash` passed (130 tests); and `cargo clippy
--lib` completed with the existing 11 warnings. The unfiltered Rust test
  suite still hits the known Finder-only trash test in this headless session.
  The browser shell rendered, but full file-tab interaction was unavailable
  without the Tauri bridge and therefore logged expected `__TAURI__` errors.
