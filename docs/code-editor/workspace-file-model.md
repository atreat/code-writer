# Workspace File Model

The current workspace model is markdown-first:

- `read_directory_impl` only returns `.md` files and directories containing markdown.
- `index_workspace_impl` only indexes `.md` files for search and recents.
- `DirEntry` only exposes `is_markdown`, not a general file kind.
- Global recents reject non-markdown files.
- Hidden files are skipped before display, so `.gitignore` and other dotfiles cannot appear in the tree.

Source-code mode must start by making this model explicit instead of layering editor routing on top of markdown-only assumptions.

## Target Types

Add a single owned classification vocabulary shared by Rust and TypeScript.

Recommended shape:

```rust
pub enum WorkspaceEntryKind {
    Directory,
    Markdown,
    SourceText,
    Unsupported,
    TooLarge,
    Binary,
}
```

TypeScript should derive from the serialized Rust shape or mirror it with tests that assert the wire shape. Avoid another boolean like `is_source`; the next file type will turn that into multiple inconsistent branches.

## Supported Source Text

Do not route "everything else" into a code editor. Use an explicit allowlist for source-text files:

- Code: `ts`, `tsx`, `js`, `jsx`, `rs`, `py`, `sh`, `bash`, `zsh`, `html`, `css`, `scss`
- Data/config: `json`, `jsonc`, `yaml`, `yml`, `toml`, `xml`, `env`
- Common names without extensions: `Dockerfile`, `Makefile`, `Justfile`, `Procfile`, `.gitignore`, `.gitattributes`, `.env`, `.env.example`

Unsupported files can still be visible if they are useful in context, but clicking them should show a small unsupported-file pane, not attempt to read them as text.

## Directory Visibility

Replace `dirs_with_markdown` with a more general index-derived set such as `dirs_with_visible_entries`.

Rules:

- A directory is visible when it contains at least one visible markdown or source-text file, or a visible child directory.
- Ignored directories stay hidden.
- `node_modules`, `.git`, build outputs, and vendored dependency directories remain excluded as safety defaults.
- Hidden files stay hidden by default, except allowlisted dotfiles like `.gitignore`, `.gitattributes`, and `.env*` when source-code mode is enabled.

This prevents engineering workspaces from exploding into unreadable dependency trees while still showing the files users actually expect to inspect.

## Sidebar Entries

`DirEntry` should become file-kind aware:

```ts
type WorkspaceEntryKind =
  | "directory"
  | "markdown"
  | "sourceText"
  | "unsupported"
  | "tooLarge"
  | "binary";

interface DirEntry {
  name: string;
  path: string;
  kind: WorkspaceEntryKind;
  modified_at: number;
  title: string | null;
  language: string | null;
  size_bytes: number | null;
}
```

Keep `title` markdown-only for now. Source files use filename labels. Add language-specific icons only after classification is stable; a generic code-file icon is enough for v1.

## Search and Recents

Fuzzy file search should index markdown and source-text paths. It should not index unsupported, binary, or too-large files unless there is a deliberate "show all files" filter later.

Workspace recents and global recents should accept source-text files. They should preserve existing markdown titles where available and use filenames for source files.

Do not add a second recents system. Extend the existing recents storage and display model with `kind` and optional `language`.

## Open Dialogs and File Associations

Update file picking in `src/lib/tauri.ts` so direct open is not markdown-only. Use one "Text files" group for markdown plus supported source files, and optionally an "All files" group only if unsupported-file handling is implemented.

Do not add OS file associations for every source extension in the first pass. That would make Writer appear as a general code editor. Keep OS-level associations focused on markdown until source editing proves stable.

## Acceptance Criteria

- Workspace tree can show markdown and allowlisted source-text files.
- Ignored dependency/build directories remain hidden.
- `.gitignore` can appear when it is an allowlisted source-text file.
- Command palette finds source-text files by path.
- Pinned files, recents, rename, move, delete, and reveal-in-sidebar work for source-text files without markdown-only branches.
- Unsupported and binary files do not enter the editor save pipeline.
