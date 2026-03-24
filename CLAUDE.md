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
pnpm build:env                    # tsc -b → packages/env/dist/
pnpm build:market-data            # tsc -b → packages/market-data/dist/
pnpm smoke:market-data            # Run market-data smoke test (needs TWELVEDATA_API_KEY)
pnpm build:db                     # tsc -b → packages/db/dist/
pnpm db:generate                  # Generate Drizzle migration SQL
pnpm db:migrate                   # Apply pending migrations
pnpm db:studio                    # Open Drizzle Studio
pnpm backfill                     # Backfill candle data from TwelveData
pnpm backfill -- -s AAPL -i 1day # Backfill specific symbol/interval
pnpm test                         # Run API tests (vitest)
pnpm test:api                     # Run API tests (vitest)
pnpm --filter @gainster/web lint  # ESLint (web only, no API linter)
```

Add dependencies with `pnpm --filter <package> add <pkg>`. Never use npm or yarn.

Add shadcn components: `pnpm dlx shadcn@latest add <component>` (run from `web/`).

Tests use **vitest** (API package only so far). Run with `pnpm test` or `pnpm test:api`.

## Architecture

pnpm monorepo with six packages:

- **`api/`** (`@gainster/api`) — Fastify v5 REST API with Zod validation and `fastify-plugin` architecture. Six route groups (`/api/watchlist`, `/api/candles`, `/api/trades`, `/api/positions`, `/api/portfolio`, `/api/signals`) plus health check. Includes `node-cron` scheduled jobs for candle polling and portfolio snapshots (timezone: `Europe/Vienna`). Dependencies: fastify, @fastify/cors, fastify-plugin, zod, node-cron, @gainster/db, @gainster/env, @gainster/market-data.
- **`web/`** (`@gainster/web`) — Next.js 16 with React 19, App Router, Tailwind v4, shadcn/ui. Server Components by default.
- **`packages/env/`** (`@gainster/env`) — Centralized environment variable loading and validation. Reads root `.env` file, validates via zod schema, and exports a typed `Env` object. Used by the API server, scripts, and smoke tests; library packages accept explicit config instead of reading env directly.
- **`packages/market-data/`** (`@gainster/market-data`) — Standalone market data provider library. TwelveData integration via native `fetch` with built-in rate limiter (default 8 req/min). `createTwelveDataProvider()` accepts an explicit config object — no env coupling.
- **`packages/db/`** (`@gainster/db`) — Shared database package. Drizzle ORM + better-sqlite3. Owns all schema definitions (account, watchlist, candles, ai_signals, trades, positions, portfolio_snapshots), migrations, and query helpers. Two subpath exports: `@gainster/db` (client + migrations + schema + queries) and `@gainster/db/schema` (schema-only, no db connection). `createDb()` returns `{ db, dbPath }`. Callers pass `dbPath` explicitly (default: `'gainster-db'`); warns if omitted.
- **`packages/scripts/`** (`@gainster/scripts`) — CLI scripts. Depends on `@gainster/db`, `@gainster/env`, `@gainster/market-data`. Currently contains the `backfill` command for seeding historical candle data.

## Critical TypeScript Constraints (ESM packages)

These cause the most common compilation errors in ESM packages (`api/`, `packages/env/`, `packages/market-data/`, `packages/db/`, `packages/scripts/`):

1. **Relative imports require `.js` extension**: `import { foo } from './bar.js'` not `'./bar'`
2. **Type imports must use `import type`**: `import type { FastifyInstance } from 'fastify'`
3. **`noUncheckedIndexedAccess`**: Array/object index access returns `T | undefined` — narrow before use
4. **`exactOptionalPropertyTypes`**: `foo?: string` does not accept explicit `undefined` as a value

The web package uses `moduleResolution: "bundler"` — no `.js` extensions needed, uses `@/*` path alias.

## Database Migrations

When generating migrations with `pnpm db:generate`, Drizzle auto-generates random names (e.g. `0001_hot_lady_deathstrike.sql`). After generating, rename the file to something descriptive (e.g. `0001_add_candles_table.sql`) and update the matching entry in `packages/db/drizzle/meta/_journal.json`.

## Environment

All env vars live in the root `.env` file. **Always use `loadEnv()` from `@gainster/env`** to access environment variables — never read `process.env` directly. The env package validates all variables against a Zod schema and returns a typed, frozen `Env` object. Library packages (`db`, `market-data`) accept explicit config objects; callers pass values from the `Env` object. If you need a new env var, add it to `packages/env/src/schema.ts` first.

Never commit `.env` files.

Env vars:
- `TWELVEDATA_API_KEY` — API key for TwelveData (required, no default)
- `TWELVEDATA_RPM` — Requests per minute (default: 8)
- `TWELVEDATA_BURST` — Burst limit (default: 1)
- `GAINSTER_DB_PATH` — SQLite database path (default: `gainster-db`)
- `API_PORT` — Fastify server port (default: 3001)
- `INITIAL_CASH` — Starting paper trading cash balance (default: 100000)

## Do Not Edit

- `web/src/components/ui/*` — shadcn/ui generated components. Regenerate with the shadcn CLI, don't hand-edit.
