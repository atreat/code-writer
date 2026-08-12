# Image preview zoom input

## Outcome

The image preview zoom percentage is an editable text field so users can make
precise zoom adjustments in addition to using the fit, minus, plus, keyboard,
wheel, and trackpad controls.

## Behavior

- Display the current zoom as a percentage value with a visible `%` suffix.
- Allow decimal percentage values for micro-adjustments.
- Commit a typed value on blur or Enter, preserving the current image center
  while clamping the requested zoom to the existing 25%–400% bounds.
- Accept an optional `%` suffix in pasted or typed text.
- Restore the current zoom value when the input is empty or non-numeric.
- Escape cancels the edit and restores the current zoom value.
- Keep the input inside the existing control hit area so editing it does not
  start image panning or trigger viewport keyboard shortcuts.

## Acceptance

- A user can replace the displayed value with a decimal percentage and commit
  it without reopening the image.
- Values below 25% and above 400% resolve to the existing bounds.
- Invalid input does not change the image transform.
- Existing plus/minus, fit, pan, wheel, pinch, and keyboard behavior remains
  unchanged.
- The field has an accessible label and works with keyboard focus.

## Loop

Inspect the current transform ownership, add a pure exact-zoom helper and
tests, implement the input commit lifecycle, critique interaction states, then
run frontend checks and browser shell verification before committing.
