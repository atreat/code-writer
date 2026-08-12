---
title: Image preview first-load and pane-wide controls
---

# Image Preview First-Load and Pane-Wide Controls

## Outcome

Opening an image for the first time must leave the loading state as soon as the
asset is actually available, while keeping the existing crossfade. Preview
controls must remain usable while the pointer is anywhere in the active image
preview pane, not only over the image viewport/content region.

## Behavior

- The visible image's `load` event marks the preview ready synchronously; CSS
  performs the opacity transition. A ref/effect fallback handles an image that
  is already complete when React attaches the listener.
- A successful load requires a positive natural width and height. Failed image
  requests continue to show the existing error state.
- The zoom/reset controls become visible and pointer-enabled from pane-level
  hover or focus-within, including when the pointer leaves the image content
  for surrounding preview space or the controls themselves.
- Inactive-pane eviction, reload-version remounting, pan/zoom math, and
  trackpad gestures remain unchanged.

## Simple loop harness

1. Inspect the image element mount/load sequence and the current CSS hover
   selectors.
2. Remove the timing-sensitive ready dependency, add complete-image fallback
   handling, and move controls visibility to the pane boundary.
3. Critique first open, cached open, reload, failed asset, inactive-tab
   eviction, pane hover, control hover, focus, and drag interactions.
4. Run frontend checks/tests and a browser-shell sanity pass, then update the
   worksheet, changelog, and TODO before committing one focused change.

## Acceptance criteria

- The first image opened reaches the preview and no longer remains on
  “Loading image…” after the asset has loaded.
- Loaded images still crossfade in; errors do not falsely become ready.
- Controls remain visible and clickable across the entire preview pane and on
  keyboard focus.
- Existing image pan/zoom, reload, and memory-release behavior is preserved.
