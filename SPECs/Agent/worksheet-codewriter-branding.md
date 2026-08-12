# CodeWriter Branding Worksheet

## Task

TODO entry: `CodeWriter branding`.

Spec: [`SPECs/codewriter-branding-spec.md`](../codewriter-branding-spec.md)

## Reviewed

- `TODOS.md`, `docs/workflows/agent-loop.md`, and `AGENTS.md`.
- Tauri product metadata, native menus, updater dialogs, CLI launcher, shell
  command installation, window titles, website metadata, release script, E2E
  configuration, README files, and open/release documentation.
- Existing Writer references in CSS variables, Rust modules, IPC event names,
  environment variables, workspace paths, package names, and repository URLs;
  these are fork-sensitive implementation identifiers and remain unchanged.

## Plan

- Change display branding and the Tauri product name to CodeWriter.
- Update macOS app launch targets and generated bundle/artifact references.
- Keep the `writer` CLI and all fork-sensitive identifiers for compatibility.
- Update user-facing docs and changelog, then validate frontend and Rust code.

## Implementation

- Set the Tauri `productName` to `CodeWriter` and updated the desktop window
  title, native app menu, updater dialogs, CLI help/errors, and capabilities
  description.
- Updated macOS CLI launch and shell-install documentation to target
  `CodeWriter.app` while retaining the installed `writer` command.
- Updated website metadata, release artifact URLs, E2E bundle paths, README and
  release/open-flow documentation, theme defaults, and the changelog.
- Preserved `com.writer-computer`, `writer_cli.rs`, `writer` IPC/user-event
  names, `WRITER_*` compatibility variables, `.writer`, theme folder paths, and
  source repository URLs.

## Results

- `vp check` passed; it reported two existing warnings in E2E JavaScript files.
- `vp test` passed: 30 files, 490 tests.
- `cargo fmt --check` passed.
- `cargo test writer_cli` passed: 14 tests.
- Full `cargo test` ran 130 tests before one unrelated Finder trash test failed
  because the sandbox cannot access the macOS Finder scripting service.
