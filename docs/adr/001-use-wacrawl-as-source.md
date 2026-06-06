# ADR 001: Use wacrawl as the primary source

## Status
Accepted

## Context
WhatsApp Desktop stores messages in private SQLite tables whose names and meanings can change. `wacrawl` snapshots those databases read-only and imports the useful chat data into its own normalized SQLite archive.

## Decision
The project reads from `~/.wacrawl/wacrawl.db` after running `wacrawl sync --copy-media`. Direct reads from `ChatStorage.sqlite` are reserved for manual diagnostics, not app export.

## Consequences
- The exporter depends on the `wacrawl` CLI.
- The data contract uses stable tables such as `chats` and `messages`.
- The app never touches WhatsApp's container directly.
