# ADR 003: React, Vite, Bulma, and Chart.js

## Status
Accepted

## Context
The app is an interactive local viewer with filters, charts, and a full message timeline. It should remain static-hostable.

## Decision
Use React with Vite and TypeScript for the frontend. Use Bulma for the general CSS system and Chart.js for activity and distribution charts.

## Consequences
- The app can be served locally or from GitHub Pages.
- UI state remains client-side.
- Shared TypeScript types can be reused by tests and scripts.
