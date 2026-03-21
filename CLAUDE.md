# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
pnpm build:db                     # tsc -b → packages/db/dist/
pnpm db:generate                  # Generate Drizzle migration SQL
pnpm db:migrate                   # Apply pending migrations
pnpm db:studio                    # Open Drizzle Studio
pnpm backfill                     # Backfill candle data from TwelveData
pnpm backfill -- -s AAPL -i 1day # Backfill specific symbol/interval
pnpm --filter @gainster/web lint  # ESLint (web only, no API linter)
```

Add dependencies with `pnpm --filter <package> add <pkg>`. Never use npm or yarn.

Add shadcn components: `pnpm dlx shadcn@latest add <component>` (run from `web/`).

No test framework yet. When added, prefer vitest.

## Architecture

pnpm monorepo with five packages:

- **`api/`** (`@gainster/api`) — Fastify v5 REST API (scaffolded, no source code yet). Dependencies installed: fastify, @fastify/cors, @gainster/db.
- **`web/`** (`@gainster/web`) — Next.js 16 with React 19, App Router, Tailwind v4, shadcn/ui. Server Components by default.
- **`packages/market-data/`** (`@gainster/market-data`) — Standalone market data provider library. TwelveData integration via native `fetch` with built-in rate limiter (default 8 req/min). No external runtime dependencies.
- **`packages/db/`** (`@gainster/db`) — Shared database package. Drizzle ORM + better-sqlite3. Owns all schema definitions, migrations, and query helpers. Two subpath exports: `@gainster/db` (client + migrations + schema + queries) and `@gainster/db/schema` (schema-only, no db connection). DB path: `GAINSTER_DB_PATH` env var or `gainster-db` default.
- **`packages/scripts/`** (`@gainster/scripts`) — CLI scripts. Depends on `@gainster/db` + `@gainster/market-data`. Currently contains the `backfill` command for seeding historical candle data.

## Critical TypeScript Constraints (ESM packages)

These cause the most common compilation errors in ESM packages (`api/`, `packages/market-data/`, `packages/db/`, `packages/scripts/`):

1. **Relative imports require `.js` extension**: `import { foo } from './bar.js'` not `'./bar'`
2. **Type imports must use `import type`**: `import type { FastifyInstance } from 'fastify'`
3. **`noUncheckedIndexedAccess`**: Array/object index access returns `T | undefined` — narrow before use
4. **`exactOptionalPropertyTypes`**: `foo?: string` does not accept explicit `undefined` as a value

The web package uses `moduleResolution: "bundler"` — no `.js` extensions needed, uses `@/*` path alias.

## Database Migrations

When generating migrations with `pnpm db:generate`, Drizzle auto-generates random names (e.g. `0001_hot_lady_deathstrike.sql`). After generating, rename the file to something descriptive (e.g. `0001_add_candles_table.sql`) and update the matching entry in `packages/db/drizzle/meta/_journal.json`.

## Environment

All env vars live in the root `.env` file. Scripts load it automatically (root first, package-local fallback). Never commit `.env` files.

## Do Not Edit

- `web/src/components/ui/*` — shadcn/ui generated components. Regenerate with the shadcn CLI, don't hand-edit.
