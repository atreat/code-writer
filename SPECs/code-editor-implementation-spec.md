# Code Editor Implementation

## Goal

Ship lightweight source-code viewing and editing using the existing CodeMirror stack, without changing markdown editing behavior or positioning Writer as a full IDE.

## Scope

- Extend the workspace file model from markdown-only to kind-aware entries for directories, markdown files, and allowlisted source-text files.
- Surface source files in the sidebar, recents, command palette search, direct open paths, watcher index, and file metadata APIs.
- Route markdown files to the existing ProseMark/CodeMirror editor and source-text files to a separate lazy-loaded CodeMirror source editor.
- Save source files as raw text, preserving original CRLF line endings, file permissions, and backend disk metadata preconditions.
- Reject unsupported, binary, and oversized direct reads before loading content into an editable text editor.

## Non-Goals

- Monaco.
- LSP, IntelliSense beyond syntax packages, terminals, debugging, Git gutter, or cross-file replace.
- Rendering unsupported/binary/too-large files in a custom preview pane.

## Validation

- `vp check`
- `vp test`
- `vp build` from `apps/desktop`
- `cargo fmt --manifest-path apps/desktop/src-tauri/Cargo.toml -- --check`
- `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml`
