# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

See `AGENTS.md` for full conventions (naming, patterns, error handling, principles). Everything below supplements it.

## Commands

```bash
pnpm dev                          # Both API + web dev servers
pnpm dev:api                      # Fastify only (tsx watch, hot reload)
pnpm dev:web                      # Next.js only
pnpm build                        # Build all packages
pnpm build:api                    # tsc -b → api/dist/
pnpm build:web                    # next build
pnpm build:market-data            # tsc -b → packages/market-data/dist/
pnpm smoke:market-data            # Run market-data smoke test (needs TWELVEDATA_API_KEY)
pnpm --filter @gainster/web lint  # ESLint (web only, no API linter)
```

Add dependencies with `pnpm --filter <package> add <pkg>`. Never use npm or yarn.

Add shadcn components: `pnpm dlx shadcn@latest add <component>` (run from `web/`).

No test framework yet. When added, prefer vitest.

## Architecture

pnpm monorepo with three packages:

- **`api/`** (`@gainster/api`) — Fastify v5 REST API (scaffolded, no source code yet). Dependencies installed: fastify, better-sqlite3, @fastify/cors.
- **`web/`** (`@gainster/web`) — Next.js 16 with React 19, App Router, Tailwind v4, shadcn/ui. Server Components by default.
- **`packages/market-data/`** (`@gainster/market-data`) — Standalone market data provider library. TwelveData integration via native `fetch` with built-in rate limiter (default 8 req/min). No external runtime dependencies.

## Critical TypeScript Constraints (API & market-data)

These cause the most common compilation errors in ESM packages (`api/`, `packages/market-data/`):

1. **Relative imports require `.js` extension**: `import { foo } from './bar.js'` not `'./bar'`
2. **Type imports must use `import type`**: `import type { FastifyInstance } from 'fastify'`
3. **`noUncheckedIndexedAccess`**: Array/object index access returns `T | undefined` — narrow before use
4. **`exactOptionalPropertyTypes`**: `foo?: string` does not accept explicit `undefined` as a value

The web package uses `moduleResolution: "bundler"` — no `.js` extensions needed, uses `@/*` path alias.

## Do Not Edit

- `web/src/components/ui/*` — shadcn/ui generated components. Regenerate with the shadcn CLI, don't hand-edit.
