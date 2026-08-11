---
title: Image preview editor
---

# Image Preview Editor

## Outcome

Open supported image files anywhere Writer can open a workspace file and show
them in a read-only image preview tab. The preview should feel like a natural
member of the existing editor family: translucent Writer surfaces, quiet
controls that reveal on hover/focus, keyboard accessibility, and the same
direct manipulation used by the mermaid canvas.

## Supported formats

The first pass supports the common formats that the WebView can render without
decoding in Rust: PNG, JPEG/JPG, GIF, WebP, SVG, BMP, TIFF/TIF, and AVIF. The
Rust classifier owns this list so directory indexing, watcher visibility,
drag/drop, CLI opens, and file-dialog filtering all share one definition at
the boundaries where possible. The frontend only consumes the serialized
`image` kind.

Images are not text-editable and are not passed through UTF-8 or binary-sample
validation. The backend returns file metadata through the existing
`FileContent` shape with an empty content string; the frontend resolves the
absolute path through Tauri's asset protocol for the actual image bytes. This
avoids copying large images through JSON IPC and preserves the existing
text-file size/binary safeguards.

## Architecture

1. Add `image` to `WorkspaceEntryKind` in Rust and TypeScript. Extend the
   classifier and visible-entry/index behavior. Update the open-target resolver,
   native file association, and open-file dialog so images work from the
   sidebar, recents, command search, drag/drop, Finder, and standalone compact
   windows.
2. Make `read_file_impl` return metadata for classified images without reading
   them as text. Keep `write_file` and editor save paths text-only. Add the
   image case to reload handling so an external image replacement remounts the
   asset URL and refreshes its metadata without creating a fake text conflict.
3. Add a lazy `ImagePreviewPane` under `components/editor-area/`. It should
   use `convertFileSrc`/the existing local-image URL helper, remount on
   `reloadVersion`, and render a clear broken-image state if the asset cannot
   load.
4. Give the preview a bounded viewport and centered image stage. Controls:
   fit/reset, zoom out, zoom in, and a readable percentage. The stage supports
   left-button pointer drag panning, modifier-wheel zoom, macOS trackpad pinch
   zoom (WebKit's synthetic `Ctrl`-wheel path, with native gesture events as a
   defensive fallback), and keyboard arrows/`+`/`-`/`0` when the viewport is
   focused. Zoom should be anchored at the pointer for wheel/pinch and at the
   viewport center for toolbar/keyboard commands.
5. Keep zoom/pan local to the mounted tab, clamp zoom to a predictable range,
   fit once the image and viewport are measured, and preserve the image's
   intrinsic aspect ratio. Controls remain discoverable on focus and expose
   `aria-label`/tooltips; the viewport uses `touch-action: none` while dragging
   so pan does not fight browser gestures.
6. Let the existing file footer show image bytes/read-only status without
   inventing document statistics. The sidebar and context menus must treat
   images as openable files, including rename, duplicate, delete, pin, and
   reveal actions.

## Simple loop harness

Run the feature as four short loops, stopping after each loop to inspect the
diff and its behavior before adding more surface area:

### Loop 1 — file plumbing

- Write Rust classifier/index/open-target tests for image extensions and
  metadata-only reads.
- Add the shared `image` kind and update all openability gates.
- Run focused Rust tests and TypeScript checks.
- Critique: verify no image path reaches UTF-8 validation or save scheduling,
  and no existing text kind changed behavior.

### Loop 2 — preview interaction

- Add the asset URL helper, lazy pane, viewport/stage, fit math, controls,
  pointer pan, modifier-wheel zoom, pinch handling, and keyboard bindings.
- Add pure interaction-math tests for fit, zoom anchoring, and clamping.
- Critique the pane at initial load, very wide/tall images, tiny images, and
  broken assets; fix layout or focus issues before integration polish.

### Loop 3 — app integration

- Wire external watcher reloads, `reloadVersion`, footer treatment, picker and
  file-association opens, sidebar context menus, recents, and standalone mode.
- Add frontend store/IPC coverage for image hydration and reload behavior plus
  Rust coverage for directory/index visibility.
- Critique user journeys: sidebar double-click, command search, drag/drop,
  Finder open, rename/delete while open, and switching between image/text tabs.

### Loop 4 — completion review

- Review the isolated diff as Frontend/State/Systems/UX/QA personas: state
  ownership, listener cleanup, asset security, accessibility, and regression
  coverage.
- Fix all actionable findings, update the changelog and owning docs, and run
  `vp check`, `vp test`, `cargo test`, and `cargo fmt --check` (no Xcode build).
- Manually verify on macOS with a real trackpad: pinch in/out, drag after
  pinch, reset, keyboard zoom, tab switching, and an externally replaced image.

## Acceptance criteria

- Supported images appear in the workspace tree and open in the normal or
  compact file tab through every existing open path.
- The image is centered and fit on first display, keeps its aspect ratio, and
  can be zoomed with controls, keyboard, modifier-wheel, and macOS pinch.
- A zoomed image can be panned by dragging; zooming around the pointer does not
  cause the image to jump unexpectedly; reset returns to fit and centered pan.
- The pane remains read-only, does not schedule text saves, and shows a useful
  error state for an unreadable asset.
- External image changes refresh the displayed asset, and rename/delete/update
  flows do not leave stale open-file or sidebar references.
- Focusable controls have accessible names, controls remain visible on keyboard
  focus, and the feature passes the focused automated checks plus a real macOS
  trackpad pass.
