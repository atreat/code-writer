---
title: Audio/video media preview
---

# Audio/video media preview

## Outcome

Open common local audio and video files anywhere Writer can open a supported
workspace file. Show them in read-only media tabs with a quiet Writer surface
around the platform/WebKit media controls. Playback, pause, seeking, volume,
and video fullscreen should remain native controls wherever WebKit provides
them instead of being recreated as a second control system.

## Supported formats

Discovery and open flows recognize these common extensions case-insensitively:

- Audio: AAC, AIFF/AIF, FLAC, M4A, MP3, OGG/OGA, OPUS, and WAV.
- Video: AVI, M4V, MKV, MOV, MP4, OGV, and WebM.

The file kind describes the media family, not a promise that every codec or
container is available in the current macOS/WebKit runtime. If the native
element cannot decode a recognized file, the tab stays open and shows a clear
unavailable-preview state. No transcoding or byte-copy IPC is introduced.

## Architecture

1. Add `audio` and `video` to the shared workspace entry kind. Extend the Rust
   classifier, index, watcher visibility, open-target resolver, native file
   associations, and frontend file-picker filters. Keep the TypeScript media
   extension registries as the frontend source for fallback classification and
   dialog filters; keep Rust as the filesystem classifier owner.
2. Treat media like images at the IPC boundary. `read_file` returns metadata,
   an empty content string, `line_ending: none`, and read-only status without
   trying UTF-8 or binary validation. Existing text write paths must reject
   media through the existing read-only/content guards.
3. Generalize the local asset URL helper and add a lazy `MediaPreviewPane`.
   Audio renders a compact Writer card containing a native `<audio controls>`
   element. Video renders a centered, aspect-preserving native
   `<video controls playsInline>` stage with fullscreen available through the
   system control strip.
4. Use `preload="metadata"`, no autoplay, and pause the element whenever its
   tab becomes inactive. On external replacement, append `reloadVersion` to
   the asset URL and remount the media element so the browser drops stale
   decoder state. Keep local loading/error state separate from file content.
5. Preserve the visual language established by the image preview: the
   translucent Writer card, filename/type/byte metadata, bounded viewport,
   accessible region label, loading state, and a useful decode-error message.
   Do not obscure the native controls with custom playback buttons.

## Simple loop harness

### Loop 1 — media file plumbing

- Add the two workspace kinds and shared frontend extension registries.
- Update Rust classification, metadata-only reads, indexing, direct opens,
  native associations, picker filters, and all openability gates.
- Add Rust tests for every extension family and metadata reads containing
  deliberately non-UTF-8 bytes.
- Critique: no media path may enter text decoding, save scheduling, or a
  markdown/source editor; existing image/text behavior must remain unchanged.

### Loop 2 — native playback surface

- Generalize the asset URL helper and add the lazy media pane and themed CSS.
- Use native audio/video controls, aspect-preserving video layout, metadata,
  loading/error states, no autoplay, and inactive-tab pause behavior.
- Add focused component logic tests where practical and store hydration tests
  for audio/video read-only files.
- Critique the first-load, tab-switch, broken-codec, very wide/tall video,
  audio-only, and external-reload states before adding polish.

### Loop 3 — integration and regression coverage

- Wire watcher reloads, `reloadVersion`, footer labels, recents/search,
  sidebar context menus, drag/drop, Finder open, standalone mode, and picker
  filters through the new kinds.
- Extend open-target, index, directory, IPC, and store tests for both families.
- Critique file rename/delete while open and switching between text, image,
  audio, and video tabs.

### Loop 4 — completion review

- Review the diff as Frontend, State, Rust/Tauri, Systems, UX, and QA
  personas, focusing on native-control ownership, listener cleanup, asset
  security, accessibility, and regression coverage.
- Run `vp check`, `vp test`, `cargo fmt --check`, `cargo test`, and `cargo
clippy`; use the browser harness for a visual sanity check.
- Manually verify on macOS with representative MP3, WAV, M4A, MP4, MOV, and
  WebM files when available: play/pause, seek, volume, fullscreen, tab switch,
  external replacement, and a codec-error case.

## Acceptance criteria

- Common audio and video files appear in the workspace tree and open through
  sidebar, search, recents, drag/drop, Finder, picker, and standalone paths.
- Audio and video tabs are read-only, do not schedule text saves, and load
  through asset URLs without copying media bytes through JSON IPC.
- Native controls provide playback, pause, seek, volume, and video fullscreen
  where WebKit supports them; media does not autoplay and pauses on tab switch.
- Video preserves its intrinsic aspect ratio in a bounded Writer surface, and
  audio has a clear compact playback card that remains usable at narrow widths.
- Loading, external replacement, missing files, and unsupported codecs produce
  clear states rather than a blank pane or a stale decoder.
- Accessible names identify each preview and native control semantics remain
  intact. Focused automated validation passes, with any codec/device gaps
  documented for the manual macOS pass.
