# Save and Conflict Semantics

Source-code mode has higher data-loss risk than markdown editing because code/config files often have meaningful permissions, exact whitespace, line endings, and concurrent edits from other tools.

The save pipeline must become file-kind aware before source editing ships.

## Raw Text Saves

Source files save raw text:

- Do not call `parseDocument`.
- Do not call `serializeDocument`.
- Do not split frontmatter.
- Do not infer titles from headings.
- Do not apply markdown-only document stats.

The current save engine serializes every file through markdown frontmatter and applies global trim/final-newline transforms. That is not safe for source files.

Recommended shape:

```ts
function serializeForSave(file: OpenFile): string {
  if (file.kind === "markdown") {
    return applyMarkdownFileProcessing(serializeDocument(file.markdown.frontmatter, file.content));
  }

  if (file.kind === "sourceText") {
    return applySourceFileProcessing(file.content, file.source);
  }

  throw new Error(`Cannot save ${file.kind} file`);
}
```

Default `applySourceFileProcessing` should preserve bytes as closely as a text editor can. Add source formatting options only after the basic editor is stable.

## Line Endings

Track line ending style on read:

- `lf`
- `crlf`
- `mixed`
- `none`

When saving source files, preserve the original dominant line ending. Do not normalize every file to `\n` as an incidental side effect of editor state.

Markdown can keep its existing behavior unless a separate markdown policy changes.

## File Permissions and Atomic Write

Current Rust writes use temp-file plus rename. Before source editing ships, preserve file permissions at minimum:

1. Read existing metadata before writing.
2. Write temp file in the same directory.
3. Apply original permissions to the temp file where supported.
4. Rename over the original.
5. Return updated metadata.

This matters for scripts such as `build.sh`, `deploy`, or hook files where losing the executable bit is a real regression.

Document unsupported metadata preservation on platforms where it cannot be guaranteed. Extended attributes and ownership can be a later pass, but executable permissions should be handled in v1.

## Modified-Time Preconditions

Add a backend write precondition for source files:

```rust
write_file(path, content, expected_modified_at, expected_size)
```

If the file changed on disk since it was read, return a conflict error instead of overwriting.

This should be used for markdown too if practical, but source files need it before editing is enabled.

## External Changes

Define these cases explicitly:

- Clean open file + external edit: reload from disk, increment `reloadVersion`, keep scroll/cursor best-effort.
- Dirty open file + external edit: do not overwrite local edits and do not silently replace editor content. Mark the file conflicted and show a clear banner.
- Save in flight + self-write watcher echo: continue suppressing self-write events for the writing window.
- Save in flight + external edit from another process/window: backend precondition should reject if the disk file changed before the write.
- Deleted file: keep the tab open with a missing-file state; allow Save As later if implemented, or close without saving.
- Renamed file from sidebar: use the existing path rewrite flow.
- Renamed externally: treat as deleted unless watcher can reliably identify the new path.

Do not rely only on frontend watcher timing. The backend write precondition is the final guard.

## Conflict UI

Keep v1 simple:

- Banner: "This file changed on disk."
- Actions: "Reload from Disk" and "Keep My Version".
- "Reload from Disk" replaces editor content and clears dirty/conflict state.
- "Keep My Version" keeps local content dirty and updates the expected disk version only after the user saves successfully.

Do not build a merge tool in this feature.

## Read-Only Files

Source files should open read-only when:

- They are outside the current workspace and the app is not in standalone editable mode.
- They exceed the read-only size threshold.
- Backend metadata says they are not writable.
- Classification is `tooLarge`, `binary`, or `unsupported`.

Read-only must be enforced in editor configuration and in the save action. UI-only read-only flags are not enough.

## Acceptance Criteria

- Source files save without markdown frontmatter parsing or serialization.
- Source saves preserve executable permissions on supported platforms.
- Source saves preserve line endings.
- Source saves fail with a clear conflict when disk metadata changed since read.
- Dirty source files are not silently replaced by watcher reloads.
- Unsupported, binary, and too-large files cannot enter the write path.
