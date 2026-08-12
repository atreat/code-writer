# Worksheet: image preview control stacking

## Task

Follow-up to the image preview first-load and pane-wide controls task. Linked
spec: [`SPECs/image-preview-control-stacking-spec.md`](../image-preview-control-stacking-spec.md).

## Reviewed

- `apps/desktop/src/components/app-layout.tsx`
- `apps/desktop/src/components/editor-area/image-preview.tsx`
- `apps/desktop/src/components/editor-area/image-preview.css`
- `docs/workflows/agent-loop.md`
- `docs/workflows/agent-review.md`

## Finding and plan

The app-level editor tabs are an absolute `z-40` overlay, while the active
image pane is a `z-10` stacking context. The controls cannot paint or receive
pointer input above that sibling overlay. The app also has a 72px window drag
region, so the dock is placed below the full `--chrome-drag-height` boundary
with the existing 12px breathing room. The pane-wide hover and focus selectors
remain in place.

## Review and validation

- UX review found the initial 68px placement still overlapped the 72px window
  drag region; the placement was corrected to `var(--chrome-drag-height) +
12px`.
- React/frontend review found no lifecycle, zoom, or pan regressions.
- Existing tests cover image transform logic, but this repository has no
  browser-level assertion for CSS stacking or pointer transitions. The local
  browser harness can render the launcher shell, but cannot open a workspace
  image without the Tauri bridge; this remains a manual desktop verification
  point.
