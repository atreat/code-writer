---
title: Source editor top inset and image loading lifecycle
---

# Source Editor Top Inset and Image Loading Lifecycle

## Outcome

Make source-code tabs and image-preview tabs feel native to the floating Writer
tab chrome. Source line 1 must start below the tab row when the CodeMirror
scroll position is at the top. Image previews must keep the loading message
until the visible image has loaded, crossfade that image into place, and avoid
retaining decoded image resources forever when many file tabs are opened.

## Behavior

- The source editor uses the same 56px geometry as the tab row (`32px` control
  height plus `12px` block padding on both sides) as scrollable top content
  inset. Line numbers and source text move together, and CodeMirror's
  scroll-into-view behavior respects the inset.
- An image preview renders one visible image element. The loading state ends
  from that element's `load` event, not from a hidden duplicate preloader. The
  loaded image fades in while the loading message is removed.
- Image panes that are no longer active keep their decoded asset for a short
  grace period, then release the image element and preview dimensions. Making
  the tab active again starts a fresh load. Reloads and unmounts cancel pending
  eviction or fade callbacks.

## Simple loop harness

1. Inspect the source editor, floating tab geometry, image preview state, and
   existing image math tests.
2. Implement the source inset and visible-image loading lifecycle with local
   hook ownership; do not add a global image byte cache or copy image bytes
   through IPC.
3. Critique top-of-file positioning, tab switching, image load/error/reload,
   crossfade timing, quick tab switching, and delayed resource release.
4. Run frontend checks/tests and a browser shell sanity pass, then update the
   worksheet, changelog, and TODO before committing one focused change.

## Acceptance criteria

- At source-editor scroll top, line 1 and its gutter are fully below the tab
  row with comfortable breathing room; scrolling remains normal thereafter.
- The first image load visibly transitions from “Loading image…” to the image,
  and the loading message cannot remain after the visible image fires `load`.
- Broken and externally reloaded images still show the existing error/loading
  states correctly.
- Inactive image panes release their image element after the configured delay,
  while quick tab switches do not cause unnecessary reloads.
