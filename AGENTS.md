# AGENTS.md — Coding Agent Guide for gamelist-utils

## Project Overview

A TypeScript CLI and library for managing EmulationStation `gamelist.xml` romsets. Provides actions for copying, filtering, media management, and format conversion across various retro-gaming frontends (ES-DE, muOS, Onion/Miyoo, SimpleMenu, RetroArch).

## Tech Stack

- **Runtime**: Node.js ≥ 22 (ESM, `"type": "module"`)
- **Language**: TypeScript 5.x with strict settings (`noUncheckedIndexedAccess`, `noImplicitReturns`, etc.)
- **Testing**: Vitest with V8 coverage; tests live alongside source as `*.test.ts`
- **Linting**: ESLint 9 flat config + Prettier (see `eslint.config.mjs`)
- **CI**: GitHub Actions (`.github/workflows/lint.yml`) — lint, typecheck, test

## Repository Layout

```
src/
  cli.ts              # CLI entry point (bin)
  index.ts            # Public API re-exports
  api-types.ts        # Shared API option types
  gamelist-types.ts   # GameList/Entry/Provider types
  actions/            # One file per CLI action (backup, copy, marquee, muos, …)
  utils/              # Shared utilities
    env.ts            # .env file loading
    filter.ts         # Include/exclude game filtering
    gamelist.ts       # gamelist.xml read/write/iterate
    media.ts          # Media env var resolution & path helpers
    muos.ts           # muOS system mapping & config helpers
    onion.ts          # Miyoo/Onion gamelist conversion
    system.ts         # System name normalization
```

## Key Commands

```bash
npm run build        # Compile TypeScript to dist/
npm run lint         # ESLint + Prettier check
npm run typecheck    # tsc --noEmit
npm test             # vitest run
npm run test:coverage # vitest run --coverage
npm run check        # lint + typecheck + test (all gates)
```

## Coding Conventions

- **Imports**: Use `import type` for type-only imports. ESLint enforces `@typescript-eslint/consistent-type-imports`.
- **No explicit `any`**: Enforced by `@typescript-eslint/no-explicit-any`.
- **Index access safety**: `noUncheckedIndexedAccess` is enabled. Always guard array/object index access with `?.` or `!` (only when provably safe).
- **Media env vars**: Use `resolveMediaEnv()` from `src/utils/media.ts` instead of inline `process.env.GAMELIST_*` lookups.
- **Media paths**: Use `relativeMediaPath()` and `romBasename()` from `src/utils/media.ts` for building gamelist-relative media file paths.
- **Action structure**: Each action in `src/actions/` exports `name`, `options`, `help`, and `api`.
- **Formatting**: Prettier config is in `package.json` — single quotes, no trailing commas, 100 char width.

## Testing Guidelines

- Tests use Vitest globals (`describe`, `it`, `expect`, `vi`).
- Test files: `src/utils/<module>.test.ts` alongside the source.
- Use `fs-extra` + `os.tmpdir()` for filesystem tests; clean up in `afterEach`.
- Coverage thresholds apply to `src/utils/` (≥85% lines/statements/functions, ≥75% branches).
- Actions are not yet under coverage thresholds but should still be tested when modified.
- Run `npm test` before committing; CI will enforce all gates.

## Environment Variables

Media directory names are configurable via env vars (also loadable from `.env` files):

| Variable | Default | Description |
|---|---|---|
| `GAMELIST_MEDIA` | `media` | Base media directory |
| `GAMELIST_BOX2D` | `box2d` | 2D box art subdirectory |
| `GAMELIST_BOX3D` | `box3d` | 3D box art subdirectory |
| `GAMELIST_MIXED` | `mixed` | Mixed image subdirectory |
| `GAMELIST_SCREENSHOT` | `screenshot` | Screenshot subdirectory |
| `GAMELIST_SNAP` | `snap` | Video snap subdirectory |
| `GAMELIST_TITLE` | `title` | Title screen subdirectory |
| `GAMELIST_MARQUEE` | `wheel` | Marquee/wheel subdirectory |
| `GAMELIST_MANUAL` | `manual` | Manual/PDF subdirectory |
