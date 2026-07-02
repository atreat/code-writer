# Editor Surface

Source-code mode should be a parallel editor surface, not a replacement for the markdown editor.

The current page-kind registry is the right foundation:

- `file` locations already route tab behavior through `page-kinds`.
- `page-kinds/views.tsx` maps file tabs to `EditorPane`.
- `EditorPane` currently assumes every file is markdown and renders `FrontmatterPanel`, `ProseMarkEditor`, `SectionRail`, markdown search overview, and document stats.

Keep tab/session/history behavior shared. Split only the tab body and file-specific chrome.

## Routing

Use the file model from [workspace-file-model.md](./workspace-file-model.md) to decide the editor surface.

Recommended shape:

```ts
type FileEditorMode = "markdown" | "sourceText" | "unsupported" | "tooLarge" | "binary";
```

`EditorPane` can become a thin router:

```tsx
function EditorPane({ path, isActive }: EditorPaneProps) {
  const mode = useFileEditorMode(path);

  if (mode === "markdown") return <MarkdownEditorPane path={path} isActive={isActive} />;
  if (mode === "sourceText") return <SourceEditorPane path={path} isActive={isActive} />;
  return <FileUnavailablePane path={path} mode={mode} />;
}
```

Do not duplicate tab ownership, history, session restore, path rewrite, or close behavior. Those already belong to the page-kind/tab layer.

## Source Editor State

The source editor needs raw text state, not markdown document state.

Minimum per-file state:

- `path`
- `kind`
- `language`
- `content`
- `diskContent`
- `isDirty`
- `isLoading`
- `isReadOnly`
- `saveError`
- `reloadVersion`
- `scrollPos`
- `cursorPos`
- `modifiedAt`
- `sizeBytes`
- `lineEnding`

Markdown-only state such as `frontmatter`, `displayDate`, and document stats should not be required for source files. Either split the store into typed variants or nest markdown-specific fields under a markdown payload. Do not keep optional markdown fields on every source file and hope call sites remember which ones are valid.

## Editor Library Decision

Use CodeMirror 6 for the initial source editor.

Reasoning:

- Writer already ships CodeMirror.
- The feature is mostly reading with light edits.
- CodeMirror has language packages and extension points that match the app's existing editor lifecycle.
- Monaco has higher bundle and worker/CSP risk, especially inside Tauri.

The validation spike should prove CodeMirror source mode covers:

- TypeScript/JavaScript, Rust, Python, JSON, YAML, TOML, HTML, CSS/SCSS, shell, Dockerfile, Makefile.
- Syntax highlighting quality.
- Line numbers, folding, bracket matching, comments, basic search.
- Lazy-load cost.
- Tauri production build behavior.
- Cold-start impact.

Do not add Monaco in the first implementation. Revisit Monaco only if the CodeMirror implementation fails a concrete reading/editing requirement that cannot be solved with CodeMirror extensions. If Monaco is ever chosen later, it must be loaded locally, lazily, and without CDN fallback.

## Source Pane Chrome

Source editor pane should be utilitarian:

- Full-height editor inside the existing tab body.
- Line numbers visible.
- Current-line highlight subtle.
- Read-only banner only when needed.
- Footer should show source-relevant metadata: line/column, language, file size, read-only state, and save error.
- No frontmatter panel.
- No section rail.
- No markdown heading navigation.
- No document word/paragraph stats.

Keep source editor styling tied to Writer theme tokens. Do not add a separate design system.

## Shortcuts

Use the existing global shortcut owner in `use-keyboard-shortcuts.ts`:

- Cmd+P, Cmd+O, tab switching, close tab, and sidebar commands stay global.
- Editor-local shortcuts belong to the editor extension configuration.
- Source editor must be detected as an editable target so global Alt+Arrow navigation does not hijack cursor movement.

Source mode should support:

- Cmd+F in-file find.
- Cmd+G / Cmd+Shift+G next/previous match.
- Cmd+/ line comment if the chosen editor supports it for the language.
- Cmd+Shift+P should remain reserved for Writer's command palette. Disable or avoid Monaco's command palette if Monaco is used.

Update `docs/keyboard-shortcuts.md` when behavior is implemented.

## Force Open

"Force-open in source mode" should be an explicit tab/path override, not a global mutation of file classification.

Examples:

- Context menu: "Open as Source"
- Command palette action for the active file: "Reopen as Source"
- Optional persisted per-workspace override later

Do not make force-open the only way to support extensionless files. Common extensionless filenames belong in the classifier.

## Acceptance Criteria

- Markdown tabs render the existing markdown pane unchanged.
- Source-text tabs render the source pane and never mount markdown frontmatter/section/stat UI.
- Tab restore, back/forward, close, rename/move/delete path rewrites, and reveal-in-sidebar continue through the existing page-kind model.
- CodeMirror is used for the first source editor implementation.
- Source editor code is lazy-loaded and absent from markdown-only startup.
