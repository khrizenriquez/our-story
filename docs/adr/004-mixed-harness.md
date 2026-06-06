# ADR 004: Mixed harness

## Status
Accepted

## Context
Tests need to run safely without private data, while the local machine should still verify that the real target chat can be exported.

## Decision
Use synthetic fixtures for deterministic CI tests and a local harness that reads private config from `.env.local`. The local harness validates counts and metadata without printing message text.

## Consequences
- CI can run without WhatsApp or `wacrawl`.
- Local validation confirms the configured chat exists.
- Privacy behavior is testable.
