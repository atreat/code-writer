---
title: Source editor tab-bar blur
---

# Source Editor Tab-Bar Blur

## Outcome

Code files should share the Markdown editor's floating-chrome treatment. When
source text scrolls beneath the tab row, the text should progressively blur at
the top edge while the tabs remain crisp and readable.

## Behavior

- Reuse the existing `ProgressiveBlur` overlay from `EditorScrollContainer` so
  the source pane uses the same 120px height, 3px backdrop blur, fade mask, and
  scrollbar-gutter alignment as Markdown.
- Use that shared 120px blur height as the source editor's scroll content inset
  so the first code line starts completely below the blur instead of appearing
  blurred on initial load.
- Keep the overlay pointer-transparent and below the existing tab chrome.
- Do not change CodeMirror selection behavior, line-number layout, or the
  Markdown editor's existing overlays.

## Simple loop harness

1. Inspect the Markdown scroll-container overlay and source-pane stacking
   context.
2. Reuse the existing overlay component in the source pane with the smallest
   possible ownership change.
3. Critique the result at source scroll top, after scrolling through code, and
   while switching between Markdown and source tabs; check that tab clicks and
   editor input remain unaffected.
4. Run frontend checks/tests and a browser-shell sanity pass, then update the
   worksheet, changelog, and TODO before committing one focused change.

## Acceptance criteria

- Source files show the same progressive top blur as Markdown.
- Tabs stay sharp and readable while code scrolls underneath.
- The blur does not intercept pointer input or alter CodeMirror scrolling.
- Markdown behavior and the existing source top inset remain unchanged.
