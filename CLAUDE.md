# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

See `AGENTS.md` for full conventions (naming, patterns, error handling, principles). Everything below supplements it.

## Commands

```bash
pnpm dev                          # Both API + web dev servers
pnpm dev:api                      # Fastify only (tsx watch, hot reload)
pnpm dev:web                      # Next.js only
pnpm build                        # Build all
pnpm build:api                    # tsc -b → api/dist/
pnpm build:web                    # next build
pnpm --filter @gainster/web lint  # ESLint (web only, no API linter)
```

Add dependencies with `pnpm --filter @gainster/api add <pkg>` or `pnpm --filter @gainster/web add <pkg>`. Never use npm or yarn.

Add shadcn components: `pnpm dlx shadcn@latest add <component>` (run from `web/`).

No test framework yet. When added, prefer vitest.

## Architecture

pnpm monorepo with two packages:

- **`api/`** (`@gainster/api`) — Fastify v5 REST API. TypeScript ESM with maximally strict tsconfig. SQLite via better-sqlite3 (synchronous, WAL mode). TwelveData for market data (free tier: 8 req/min, 800 req/day — cache aggressively in SQLite).
- **`web/`** (`@gainster/web`) — Next.js 16 with React 19, App Router, Tailwind v4, shadcn/ui. Server Components by default.

## Critical TypeScript Constraints (API)

These cause the most common compilation errors:

1. **Relative imports require `.js` extension**: `import { foo } from './bar.js'` not `'./bar'`
2. **Type imports must use `import type`**: `import type { FastifyInstance } from 'fastify'`
3. **`noUncheckedIndexedAccess`**: Array/object index access returns `T | undefined` — narrow before use
4. **`exactOptionalPropertyTypes`**: `foo?: string` does not accept explicit `undefined` as a value

The web package uses `moduleResolution: "bundler"` — no `.js` extensions needed, uses `@/*` path alias.

## Do Not Edit

- `web/src/components/ui/*` — shadcn/ui generated components. Regenerate with the shadcn CLI, don't hand-edit.
