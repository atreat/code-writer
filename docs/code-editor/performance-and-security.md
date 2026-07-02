# Performance and Security

The feature succeeds only if Writer stays lightweight. The common path is still opening markdown notes quickly.

## Startup Cost

Source-code support must not add heavy work to startup:

- No Monaco or source-language bundle in the initial markdown-only chunk.
- No file-content reads during workspace indexing.
- No synchronous recursive scans on the frontend.
- No new startup IPC waterfall.

Use the existing restore/open flow and extend the metadata returned by existing commands where possible.

## Large Files

Large-file policy belongs in Rust before `read_to_string`.

Recommended thresholds:

- Up to 5 MB: editable source text.
- 5 MB to 50 MB: editable only after warning or open read-only by default.
- Over 50 MB: read-only metadata pane or streamed preview later; do not load into the full editor.

Exact thresholds can change after testing, but the guard must be backend-enforced before reading.

Return a typed response:

```ts
type ReadFileResult =
  | { kind: "text"; content: string; metadata: FileMetadata }
  | { kind: "tooLarge"; metadata: FileMetadata; reason: string }
  | { kind: "binary"; metadata: FileMetadata; reason: string }
  | { kind: "unsupported"; metadata: FileMetadata; reason: string };
```

Do not throw generic IO errors for expected too-large/binary cases.

## Binary Detection

Use a small prefix read before full text decode:

- Detect NUL bytes.
- Validate UTF-8 for the sampled prefix and full file before opening editable.
- Treat UTF-16 and other encodings as unsupported in v1 unless explicit decoding is added.

Do not display lossy-decoded content in an editable source editor.

## Workspace Indexing

Index metadata only:

- path
- name
- relative path
- kind
- language
- modified time
- size

Do not read file contents to determine source type. Extension/name classification is enough for v1.

Keep the existing ignore behavior. Add more safety skips if needed for common dependency/build trees.

## Editor Lazy Loading

If CodeMirror source mode is chosen, lazy-load language packages and the source editor pane. If Monaco is chosen, lazy-load all Monaco code and workers.

Acceptance:

- Opening only markdown files does not fetch or execute the source editor chunk.
- First source-file open loads exactly the needed editor surface and language support.
- A second source-file open reuses the loaded editor code.

## Monaco Requirements If Chosen

Monaco is allowed only after the spike proves it is worth the cost.

Requirements:

- Bundle from local npm dependencies only.
- No CDN loader.
- No automatic network fetches.
- Disable TypeScript automatic type acquisition and any feature that fetches dependencies.
- Configure workers explicitly for Vite/Tauri production builds.
- Validate production Tauri CSP and worker behavior early.
- Keep Monaco out of the initial bundle and inspect the built chunks in CI.

If these cannot be met cleanly, use CodeMirror.

## CSP

Current Tauri CSP is restrictive and should stay that way. Do not loosen it broadly to make an editor library work.

Allowed direction:

- Add only the worker/script directives required by the chosen local bundle.
- Keep `default-src 'self'`.
- Do not allow arbitrary remote script sources.
- Keep asset protocol scope under review; source editing should not require expanding file access.

## Security Model

Opening a source file must never execute it.

Do not add:

- terminal execution
- preview execution for HTML/JS
- package install hooks
- LSP process spawning
- automatic dependency/type downloads
- remote schema fetching without explicit opt-in

Syntax highlighting and static validation are acceptable. Network-backed enrichment is out of scope.

## Telemetry and Logging

This app does not need product telemetry for v1. Add dev logs or local diagnostics only where useful:

- source editor chunk load time
- read-file classification reason for too-large/binary/unsupported
- large-file threshold hits
- worker initialization failures

Keep logs quiet in production unless they represent user-visible errors.

## Acceptance Criteria

- Markdown-only startup remains within the existing cold-start budget.
- Source editor code is lazy-loaded.
- Large/binary files are rejected or opened read-only before full text decode.
- Monaco, if used, works in a production Tauri build under CSP with no CDN/network dependency.
- No feature introduced by source-code mode executes user code.
