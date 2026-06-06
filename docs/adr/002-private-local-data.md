# ADR 002: Keep real chat data local

## Status
Accepted

## Context
The timeline includes private messages and media. GitHub Pages is useful for serving the app, but committing the exported chat would expose sensitive data.

## Decision
GitHub Pages builds publish only code and demo data. Real exports live under gitignored paths: `public/data/` and `public/private-media/`.

## Consequences
- `npm run build` works without private data.
- `npm run dev` can show the real local export when it exists.
- Privacy checks fail if private artifacts are tracked or staged.
