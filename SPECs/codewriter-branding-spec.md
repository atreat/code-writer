# CodeWriter Branding Spec

## Goal

Rename the fork's user-facing application from Writer to CodeWriter so it is
distinct from the upstream Writer project.

## Requirements

- The macOS application bundle, native menu, updater dialogs, window titles,
  web page metadata, and user-facing documentation use CodeWriter.
- macOS open/launch behavior targets the CodeWriter application bundle.
- Preserve the fork-compatible update surface: repository URLs, bundle
  identifier, workspace `.writer` directory, source filenames/modules, internal
  CSS variables, user-event names, and the existing `writer` shell command.
- Release and E2E documentation must match the CodeWriter bundle and artifact
  names without changing the E2E identifier namespace.

## Validation

- Search for remaining Writer references and classify them as intentional
  internal compatibility names or stale user-facing branding.
- Run `vp check`, `vp test`, `cargo test`, and `cargo fmt --check`.
