# Code Editor Implementation Guide

This directory owns the plan for adding lightweight source-code viewing and editing to Writer.

The feature is not "make Writer an IDE." It is:

- Recognize useful non-markdown text files in a workspace.
- Open those files in a parallel source editor surface.
- Keep markdown editing on the existing ProseMark/CodeMirror path.
- Preserve Writer's fast startup, responsive sidebar, and local-first save semantics.

The highest-leverage work is the workspace file model. The editor component is downstream of that model. If Writer cannot classify, index, route, and safely persist non-markdown files, adding Monaco or any other editor only creates data-loss and performance risk.

## Documents

- [workspace-file-model.md](./workspace-file-model.md) - backend and frontend file classification, sidebar/search/recents impact, and supported file policy.
- [editor-surface.md](./editor-surface.md) - parallel source editor architecture, routing, chrome, shortcuts, and editor-library decision.
- [save-and-conflicts.md](./save-and-conflicts.md) - raw text persistence, file metadata preservation, dirty state, and external-change conflict handling.
- [performance-and-security.md](./performance-and-security.md) - large files, binary detection, lazy loading, CSP/workers, and non-network behavior.
- [testing-and-rollout.md](./testing-and-rollout.md) - existing harnesses to reuse, acceptance gates, rollout phases, and regression checks.

## Implementation Order

1. Add an explicit workspace file model for markdown, source text, unsupported files, large files, and binary files.
2. Expand sidebar/search/recents to understand the new model without loading file contents.
3. Split the open file state into markdown-specific and raw-text-safe data.
4. Add a parallel source editor page body for source-text files.
5. Harden save/conflict behavior for raw text files.
6. Add large-file and unsupported-file UI states.
7. Run a gated editor-library spike before pulling in Monaco.

## Non-Negotiables

- Markdown behavior must remain unchanged unless a change is explicitly required by the file model.
- Source files save as raw text. Do not parse them as markdown, do not serialize them through frontmatter, and do not apply note-oriented transforms by default.
- The source editor is optimized for reading and small tweaks. No LSP, terminal, debugger, refactoring, Git gutter, or cross-file replace in this phase.
- Keep Monaco out of the initial bundle if Monaco is chosen. Prefer the existing CodeMirror dependency if it satisfies the target language coverage and interaction requirements.
- Do not add a second e2e stack. Use the existing Vite+ unit tests, Rust tests, and WebdriverIO/Tauri e2e harness.
