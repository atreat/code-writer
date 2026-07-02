# Code Editor Implementation Documentation Spec

## Goal

Create a clear implementation guide for adding lightweight source-code viewing and editing to Writer without turning the app into an IDE or regressing markdown performance.

## Scope

- Document the workspace file-model expansion needed to recognize source-text files.
- Document a parallel source editor surface that keeps the markdown editor unchanged.
- Address save safety, conflict behavior, large files, binary files, CSP/workers, and testing.
- Prefer existing project foundations and harnesses over duplicate tooling.

## Deliverables

- `docs/code-editor/README.md`
- `docs/code-editor/workspace-file-model.md`
- `docs/code-editor/editor-surface.md`
- `docs/code-editor/save-and-conflicts.md`
- `docs/code-editor/performance-and-security.md`
- `docs/code-editor/testing-and-rollout.md`

## Non-Goals

- Implement source-code editing.
- Add Monaco or any editor dependency.
- Change workspace behavior.
- Add a new test harness.

## Acceptance Criteria

- Each critical finding from the source-code-mode spec review is represented as implementation guidance.
- The docs recommend an implementation order that prioritizes workspace recognition and save safety before editor UI.
- The docs explicitly preserve Writer's lightweight, responsive markdown-first path.
- The docs identify existing files and systems the implementation should extend.
