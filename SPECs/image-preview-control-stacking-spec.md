# Image preview control stacking

## Outcome

Image preview controls must be reachable in the normal desktop layout. The
control dock must not sit underneath the floating editor tab chrome or depend
on hovering a covered portion of the preview pane.

## Behavior

- Place the control dock below the full shared editor drag/chrome band.
- Keep the existing pane-wide hover and focus-visible behavior so the dock
  remains shown while the pointer moves between the image, controls, and the
  rest of the preview pane.
- Preserve the existing zoom, fit, keyboard, trackpad, and visual styling
  behavior.

## Acceptance

- Moving the pointer from the image onto the control dock does not hide it.
- Every control button is clickable without passing through the tab bar.
- The controls remain in the expected upper-right position relative to the
  preview content, below the tab chrome.
- `vp check`, `vp test`, and the browser harness pass.

## Loop

Inspect the app-level tab overlay and preview stacking context, make the
smallest placement change, critique pointer and focus transitions, then verify
the rendered shell and frontend checks before committing.
