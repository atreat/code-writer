# Testing and Rollout

Use the harnesses already in the repo. Do not add Playwright or another e2e stack for this feature.

Existing tools:

- `vp check` for formatting, linting, and TypeScript checks.
- `vp test` for frontend unit tests.
- Rust tests in `apps/desktop/src-tauri`.
- WebdriverIO/Tauri e2e tests in `apps/desktop/e2e`.

## Phase 0: Spike

Goal: choose the source editor library with evidence.

Tests/evidence:

- Development and production Tauri build can load one source file.
- Markdown-only session does not load source editor chunk.
- Supported language samples render with usable highlighting.
- Keyboard shortcuts do not collide with Writer globals.
- Bundle/chunk output is inspected and recorded in the worksheet.

Exit criteria:

- CodeMirror is accepted, or Monaco has a documented reason to justify its cost.
- Worker/CSP behavior is proven if Monaco is selected.

## Phase 1: File Model

Goal: workspace recognizes source-text files without opening them.

Rust tests:

- `read_directory_impl` returns markdown and allowlisted source-text files.
- Ignored dependency/build directories stay hidden.
- Dotfile allowlist shows `.gitignore` and `.env.example` but not arbitrary hidden junk.
- `index_workspace_impl` indexes markdown and source-text files.
- Directory visibility is based on visible entries, not markdown only.
- Recents accept source-text files and reject unsupported/binary paths.

Frontend tests:

- Sidebar renders source entries.
- Context menu availability follows `kind`, not `is_markdown`.
- Command palette returns source-text files from fuzzy search.
- Pinned files can include source-text files.

## Phase 2: Raw Text Open State

Goal: source files can load without markdown parsing.

Tests:

- Opening a `.yaml` file beginning with `---` preserves the exact text as source content.
- Opening a markdown file still strips/manages frontmatter exactly as before.
- Source file state does not expose markdown title/date/stat behavior as if valid.
- Existing markdown store tests still pass unchanged.

## Phase 3: Source Editor Pane

Goal: source-text tabs render the parallel editor surface.

Frontend tests:

- Markdown files mount `MarkdownEditorPane`.
- Source-text files mount `SourceEditorPane`.
- Unsupported/binary/too-large files mount a non-editor state.
- Source pane does not render `FrontmatterPanel`, `SectionRail`, or `DocumentFooter`.
- Source footer renders language, line/column, size, and read-only/save state.

E2E smoke:

- Create temp workspace with `README.md`, `Cargo.toml`, `src/main.rs`, `.gitignore`.
- Open workspace.
- Verify markdown file opens in markdown editor.
- Verify source file opens in source editor.
- Make a small edit to source file and verify host filesystem bytes.

## Phase 4: Save and Conflict Safety

Rust tests:

- `write_file` preserves executable bit.
- `write_file` rejects stale `expected_modified_at`/size.
- Too-large and binary files never write through text save path.

Frontend tests:

- Source save sends raw text, not markdown serialization.
- Source save preserves CRLF when loaded from a CRLF file.
- Dirty source file plus watcher external change enters conflict state, not reload.
- Clean source file plus watcher external change reloads.
- Conflict actions "Reload from Disk" and "Keep My Version" update state correctly.

## Phase 5: Performance Gates

Validation:

- Inspect built chunks to prove source editor is not in initial bundle.
- Measure markdown-only cold start against the pre-feature baseline.
- Measure first source-file open.
- Open a large file above threshold and verify the app remains responsive.
- Open a binary file and verify it does not enter the editor.

CI can enforce bundle/chunk checks with a small script that fails when the source editor package appears in the initial chunk.

## Rollout

Recommended rollout order:

1. Hidden/internal setting to enable source-file visibility.
2. Source-file tree/search support read-only.
3. Source editor editable for files under threshold.
4. Conflict handling enabled.
5. Remove hidden flag after validation.

Avoid shipping editable source files before conflict handling and raw save semantics are complete.

## Review Personas

Use these review personas from `docs/workflows/agent-review.md`:

- Systems Architect for file model and ownership boundaries.
- Rust/Tauri Expert for indexing, read/write, watcher, and metadata behavior.
- React/Frontend Expert for pane routing and lazy loading.
- Zustand/State Expert for typed open-file state and conflict flags.
- Editor Expert for CodeMirror/Monaco lifecycle and shortcut interactions.
- QA Engineer for coverage and e2e scope.
- UX Expert for unsupported/too-large/conflict/read-only states.

## Completion Checklist

- Workspace file model is explicit and kind-based.
- Source files are visible only when allowlisted or explicitly forced.
- Markdown editor behavior is unchanged.
- Source editor is parallel and lazy-loaded.
- Source save is raw, permission-preserving, line-ending-preserving, and conflict-aware.
- Large/binary/unsupported files have typed UI states.
- Existing harnesses cover the feature; no duplicate e2e tool was added.
- Performance gates prove Writer remains lightweight.
