# Agent Worksheet: Code Editor Implementation Documentation

## References

- TODO entry: code editor implementation docs.
- Spec: `SPECs/code-editor-implementation-docs-spec.md`
- Docs reviewed: `docs/consolidation.md`, `docs/editor.md`, `docs/react-guidelines.md`, `docs/zustand.md`, `docs/open-flow.md`, `docs/keyboard-shortcuts.md`, `docs/workflows/agent-loop.md`.
- Code reviewed: `apps/desktop/src-tauri/src/commands/fs.rs`, `apps/desktop/src-tauri/src/commands/search.rs`, `apps/desktop/src-tauri/src/commands/recents.rs`, `apps/desktop/src/stores/editor-store.ts`, `apps/desktop/src/lib/save.ts`, `apps/desktop/src/components/editor-area/editor-pane.tsx`, `apps/desktop/src/components/editor-area/page-kinds/views.tsx`, `apps/desktop/e2e/specs/smoke.spec.js`.

## Current State

- Workspace directory reads and indexing are markdown-only.
- Open file state is markdown-shaped and parses every file through frontmatter.
- Save serialization is markdown-shaped and applies global whitespace/final-newline transforms.
- File writes use temp-file rename and need permission preservation before source editing.
- Existing app structure has a good route for this feature: page-kind tab behavior plus a file-pane router.
- Existing validation tools are enough; adding Playwright would duplicate WebdriverIO/Tauri e2e coverage.

## Plan

1. Add a compact spec for the documentation task.
2. Add `docs/code-editor/` with separate docs for file model, editor surface, save/conflict behavior, performance/security, and testing/rollout.
3. Update TODO and changelog to record the completed planning work.
4. Verify the docs mention each prior review finding directly.

## Result

Created the code editor implementation guide. The docs recommend expanding the workspace file model first, keeping source editing parallel to markdown, preserving raw text safely, enforcing backend large-file/binary checks, and reusing Vite+/Rust/WebdriverIO harnesses.
