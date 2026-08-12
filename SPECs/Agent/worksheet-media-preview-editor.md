---
title: Agent worksheet — audio/video media preview
spec: ../media-preview-editor-spec.md
---

## TODO

Audio/video media preview in `TODOS.md`. An unrelated reveal-in-sidebar task
was already in In Progress; its files are untouched.

## Reviewed

- `AGENTS.md`, `docs/workflows/agent-loop.md`, `docs/workflows/agent-review.md`
- `docs/consolidation.md`, `docs/react-guidelines.md`, `docs/zustand.md`
- Existing image preview: `image-preview.tsx`, `image-preview.css`,
  `image-src-resolver.ts`, and image transform tests
- File model and hydration: `types/fs.ts`, `editor-store.ts`, `use-tabs.ts`,
  `use-file-watcher.ts`, `editor-pane.tsx`, `document-footer.tsx`
- File boundaries: Rust `commands/fs.rs`, `commands/search.rs`,
  `open_target.rs`, `tauri.conf.json`, and frontend `lib/tauri.ts`
- Existing Rust, IPC, and store tests for image and supported-file behavior

## Plan

1. Add `audio` and `video` kinds plus one extension registry per media family;
   derive frontend picker/openability checks from those registries.
2. Extend Rust classification and metadata-only read handling, then update
   associations and tests for discovery, indexing, direct opens, and binary
   safety.
3. Generalize local asset resolution and add a lazy native-control media pane;
   style audio/video surfaces to match the existing image preview.
4. Add store/watcher/footer/editor-pane integration, pause inactive media, and
   test metadata hydration, reload remounts, and read-only behavior.
5. Run isolated review personas, fix actionable findings, use the browser
   harness, run full validation, update changelog/TODO, and commit once.

## Risks and decisions

- Extension recognition is broader than guaranteed codec support. The native
  element owns decode capability and the UI must report a clear error.
- Native controls are the intentional source of truth for playback behavior;
  custom controls would diverge from macOS conventions and fullscreen support.
- Media must be paused when its tab becomes inactive so hidden tabs cannot keep
  playing unexpectedly.
- Rust tests may require a dependency download; the environment-specific Finder
  trash test is known to need a GUI session and should remain explicitly noted.

## Results

- Added audio/video kinds and common-format registries across Rust
  classification, indexing, direct-open, native associations, picker filters,
  watcher reloads, and frontend hydration.
- Added lazy native WebKit audio/video preview surfaces with metadata-only IPC,
  no autoplay, inactive-tab pause, codec-aware error states, and read-only
  backend write protection for image/audio/video.
- Local critique fixed the media write boundary and generalized the asset URL
  helper/watch comments. The independent review workers were launched with
  fresh context but did not return within the bounded window and were stopped.
- Validation: `vp check` (0 errors, 2 existing warnings), `vp test` (484
  passed), `cargo fmt --check`, `cargo clippy` (0 errors, existing warnings),
  and `cargo test --lib -- --skip test_delete_entry_moves_to_trash` (130
  passed). The skipped test requires Finder/GUI access in this headless
  environment.
