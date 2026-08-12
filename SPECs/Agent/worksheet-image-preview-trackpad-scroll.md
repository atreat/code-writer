---
title: Agent worksheet — image preview trackpad scrolling
spec: ../image-preview-editor-spec.md
---

## TODO

Image preview trackpad scrolling in `TODOS.md`, extending the completed image
preview without changing its file/state architecture.

## Reviewed

- `AGENTS.md`, `docs/workflows/agent-loop.md`, `docs/workflows/agent-review.md`
- `docs/react-guidelines.md`, `docs/consolidation.md`
- `SPECs/image-preview-editor-spec.md`
- `apps/desktop/src/components/editor-area/use-image-preview.ts`
- `apps/desktop/src/components/editor-area/image-preview-logic.ts`
- `apps/desktop/src/components/editor-area/image-preview.tsx`
- `apps/desktop/src/components/editor-area/image-preview.css`
- `apps/desktop/tests/image-preview.test.ts`

## Plan

1. Add pure image-pan bounds/math helpers based on natural image size, zoom,
   and viewport size.
2. Route pointer drag, keyboard arrows, two-finger wheel scrolling, and
   pointer-anchored zoom through the same clamped transform path. Keep
   modifier-wheel/pinch zoom separate from ordinary scroll.
3. Add regression tests for overflow bounds, scroll direction, and no-op pan
   at fit scale; update the image spec, changelog, and TODO.
4. Critique the interaction for trackpad scroll, pinch, drag, keyboard, image
   edges, resize, and control focus. Run browser sanity and full validation.

## Risks and decisions

- Wheel deltas use native scroll semantics (`pan -= delta`) so two-finger
  scrolling feels like moving a large canvas. Modifier wheel remains zoom.
- Pan clamping prevents the image from being dragged into blank space and also
  makes fit-scale scroll a no-op.
- The browser harness can inspect the rendered shell but cannot synthesize a
  real macOS trackpad pinch inside a plain Vite page without the Tauri bridge;
  a real macOS pass remains the final hardware check.

## Results

- Added shared pan bounds and clamping math. Pointer drag, keyboard arrows,
  two-finger wheel scrolling, zoom anchoring, and viewport resize now respect
  the image's actual overflow; zero-overflow axes normalize to centered `0`.
- Ordinary wheel deltas pan with native scroll semantics (`pan -= delta`),
  while modifier-wheel and WebKit gesture events remain zoom paths. Added
  `overscroll-behavior: contain` to keep the canvas interaction self-contained.
- Validation: `vp check` (0 errors, 2 existing warnings), `vp test` (487
  passed), focused image tests (7 passed), `cargo fmt --check`, `cargo clippy`
  (0 errors, existing warnings), and Rust library tests (130 passed with the
  known Finder-only trash test skipped). The browser shell check passed, but a
  real Tauri/macOS trackpad pass is still needed for hardware gesture feel.
- Fresh-context frontend/UX and QA reviewers were launched but did not return
  within the bounded window and were stopped; local critique completed with no
  unresolved P0/P1 findings.
