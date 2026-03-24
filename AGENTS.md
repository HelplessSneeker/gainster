# AGENTS.md — Gainster

Stock portfolio tracker & analysis platform. Fastify API + Next.js dashboard + SQLite + TwelveData. Evolving toward AI-agent paper trading.

## Monorepo Layout

pnpm workspaces with six packages:

```
api/                    # Fastify REST API (Zod validation, plugin architecture, cron jobs)
  package.json          # Deps: fastify v5, zod, fastify-plugin, node-cron, @gainster/db, @gainster/env, @gainster/market-data
  tsconfig.json         # Strict ESM config (nodenext)
  src/
    index.ts            # Entry point: env → db → migrate → ensureAccount → market-data → app → cron → listen
    app.ts              # buildApp() factory — registers plugins + route groups
    __tests__/
      helpers.ts        # Test utilities: in-memory DB, mock market data, test app factory
      health.test.ts    # Tests for GET /health
      watchlist.test.ts # Tests for /api/watchlist routes
      candles.test.ts   # Tests for /api/candles routes
      trades.test.ts    # Tests for /api/trades routes
      positions.test.ts # Tests for /api/positions routes
      portfolio.test.ts # Tests for /api/portfolio routes
      signals.test.ts   # Tests for /api/signals routes
    lib/
      types.ts          # Fastify declaration merging (db, marketData decorators)
      schemas.ts        # Shared Zod primitives (pagination, symbol, intervals, etc.)
      candle-mapper.ts  # Market candle → NewCandle transformer
    plugins/
      db.ts             # Decorates Fastify with db instance (fastify-plugin)
      market-data.ts    # Decorates Fastify with MarketDataProvider
      error-handler.ts  # Global setErrorHandler (ZodError→400, MarketDataError→502, etc.)
    routes/
      health.ts         # GET /health
      watchlist/        # GET/POST/PATCH/DELETE /api/watchlist, GET /api/watchlist/:id
      candles/          # GET /api/candles/intervals, GET /api/candles/:symbol, POST /api/candles/backfill
      trades/           # GET/POST /api/trades, GET /api/trades/:id (creates/updates positions atomically)
      positions/        # GET /api/positions, GET /api/positions/summary, GET /api/positions/:symbol
      portfolio/        # GET/POST /api/portfolio/snapshots, GET /api/portfolio/current
      signals/          # GET /api/signals, GET /api/signals/:id, GET /api/signals/:id/trades
    cron/
      index.ts          # Registers all cron jobs (Europe/Vienna timezone)
      market-status.ts  # isMarketOpen() — US Eastern market hours check
      candle-poll.ts    # Every 5 min during market hours: poll candles for watchlist
      portfolio-snapshot.ts  # Daily at market close: update prices + snapshot
web/                    # Next.js 16 dashboard (App Router, Tailwind v4, shadcn/ui)
  src/
    app/                # App Router routes and layouts
    components/ui/      # shadcn/ui components (generated — do not hand-edit)
    components/         # Custom app components go here (outside ui/)
    lib/utils.ts        # cn() helper for className merging
    hooks/              # Custom React hooks
packages/
  env/                  # Centralized env loading + validation (zod)
    src/
      index.ts          # Exports loadEnv() and Env type
      env.ts            # loadEnv() — loads .env, validates, returns frozen Env
      load-env.ts       # .env file loader (finds monorepo root)
      schema.ts         # Zod schema defining all env vars
  db/                   # Shared database package (Drizzle ORM + better-sqlite3)
    src/
      schema/           # Drizzle table definitions (account, watchlist, candles, ai_signals, trades, positions, portfolio_snapshots)
      queries.ts        # All query helpers (CRUD for each domain, paginated lists, aggregates)
      client.ts         # createDb() → { db, dbPath }
      connection.ts     # createConnection() — better-sqlite3 with WAL + FK
      migrate.ts        # migrate() — applies pending migrations
      index.ts          # Barrel export (schema + queries + client)
    drizzle/            # Generated migration SQL files
    scripts/
      migrate.ts        # Standalone migration runner (pnpm db:migrate)
    drizzle.config.ts   # Drizzle Kit config
  market-data/          # Standalone market data provider library
    src/
      index.ts          # Public API — re-exports types, providers, factory
      types.ts          # MarketDataProvider interface, Quote, Candle, ApiUsage
      errors.ts         # MarketDataError, ProviderApiError, RateLimitExceededError
      rate-limiter.ts   # Token-bucket rate limiter (configurable RPM + burst)
      factory.ts        # createTwelveDataProvider(config) — accepts explicit config
      providers/
        twelvedata/     # TwelveData implementation (native fetch, no SDK)
          client.ts     # TwelveDataProvider class
          mapper.ts     # Response mappers (quote, candles, api usage, error detection)
          index.ts      # Barrel re-export
    scripts/
      smoke.ts          # Smoke test — fetches a quote via the provider
  scripts/              # CLI scripts (backfill, etc.)
    src/
      backfill.ts       # Main backfill entry — uses loadEnv(), passes config explicitly
      lib/
        fetch-candles.ts   # Fetch candles from market data provider
        upsert-candles.ts  # Batch upsert candles into DB
        detect-gaps.ts     # Detect gaps in candle data
        parse-args.ts      # CLI argument parser (--symbol, --interval)
        log.ts             # Logging utility
```

## Build / Dev / Test Commands

```bash
# Root-level (runs across all packages)
pnpm dev                # Start both API and web dev servers in parallel
pnpm build              # Build all packages

# Per-package
pnpm dev:api            # Fastify dev server (tsx watch)
pnpm dev:web            # Next.js dev server
pnpm build:api          # TypeScript compile (tsc -b) → api/dist/
pnpm build:web          # next build
pnpm build:market-data  # TypeScript compile (tsc -b) → packages/market-data/dist/
pnpm smoke:market-data  # Run market-data smoke test (needs TWELVEDATA_API_KEY)
pnpm build:env          # TypeScript compile (tsc -b) → packages/env/dist/
pnpm build:db           # TypeScript compile (tsc -b) → packages/db/dist/
pnpm db:generate        # Generate Drizzle migration SQL from schema changes
pnpm db:migrate         # Apply pending migrations to the database
pnpm db:studio          # Open Drizzle Studio (interactive DB browser)
pnpm backfill           # Backfill candle data from TwelveData
pnpm backfill -- -s AAPL -i 1day  # Backfill specific symbol/interval

# Testing (vitest — API package only so far)
pnpm test                                    # Run all API tests
pnpm test:api                                # Same as above (explicit filter)
pnpm --filter @gainster/api test -- path/to/file.test.ts  # Run a single test file

# Linting (web only — ESLint + eslint-config-next)
pnpm --filter @gainster/web lint
```

**Package manager:** pnpm v10.28.2. Always `pnpm add`, never `npm install` / `yarn add`.
To add a dep to a specific package: `pnpm --filter @gainster/web add <pkg>`.

## API — TypeScript Strict Mode & Imports

All ESM packages (api, env, market-data, db, scripts) share maximally strict tsconfigs:

- **`strict: true`** — strictNullChecks, noImplicitAny, etc.
- **`noUncheckedIndexedAccess: true`** — index access returns `T | undefined`. Narrow before use.
- **`exactOptionalPropertyTypes: true`** — `foo?: string` does NOT accept explicit `undefined`.
- **`verbatimModuleSyntax: true`** — type-only imports MUST use `import type`.

All ESM (`"type": "module"`, `"module": "nodenext"`).

```typescript
// .js extension required in relative imports
import { getDb } from './db/index.js';

// Type-only imports use `import type`
import type { FastifyInstance } from 'fastify';

// Node built-ins use node: prefix
import { readFile } from 'node:fs/promises';

// WRONG — compiler errors:
import { getDb } from './db/index';       // missing .js
import { FastifyInstance } from 'fastify'; // type as value import
```

Import order: (1) node: built-ins, (2) external packages, (3) internal/relative. Blank line between groups.

## Web Imports (Next.js)

The web package uses `moduleResolution: "bundler"` — no `.js` extensions needed.
Path alias: `@/*` maps to `./src/*`.

```tsx
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
```

## Naming Conventions

| Thing              | Style            | Example                          |
|--------------------|------------------|----------------------------------|
| Files & directories| kebab-case       | `price-cache.ts`, `routes/`      |
| React components   | PascalCase file  | `PortfolioTable.tsx`             |
| Functions          | camelCase        | `fetchTimeSeries()`              |
| Variables/consts   | camelCase        | `const apiKey = ...`             |
| Types / Interfaces | PascalCase       | `type PortfolioPosition = ...`   |
| Constants (env)    | UPPER_SNAKE_CASE | `const PORT = 3000`              |
| SQL tables/columns | snake_case       | `portfolio_positions.created_at` |
| API route URLs     | kebab-case       | `/api/portfolio-positions`       |

## Fastify Patterns

Each domain is a self-contained plugin with co-located `schemas.ts`, `handlers.ts`, and `index.ts`:

```typescript
// routes/watchlist/index.ts — route registration
import type { FastifyInstance } from 'fastify';
import { listWatchlist, createWatchlist } from './handlers.js';

export default async function watchlistRoutes(fastify: FastifyInstance) {
  fastify.get('/', listWatchlist);
  fastify.post('/', createWatchlist);
}

// routes/watchlist/handlers.ts — business logic with Zod validation
import { createWatchlistSchema } from './schemas.js';

export async function createWatchlist(request: FastifyRequest, reply: FastifyReply) {
  const body = createWatchlistSchema.parse(request.body);  // throws ZodError → 400
  const item = insertWatchlistItem(request.server.db, body);
  return reply.code(201).send(item);
}
```

- **Zod for input validation** — `.parse()` in handlers, caught by global error handler (ZodError → 400).
- **`fastify-plugin`** for shared decorators (`db`, `marketData`) — breaks Fastify's encapsulation so child plugins can access them.
- Routes registered with prefix: `app.register(watchlistRoutes, { prefix: '/api/watchlist' })`.
- Access shared services via `request.server.db` and `request.server.marketData`.
- Use `async` handlers — no callbacks. Log with `fastify.log.error(err)` — never `console.log`.

## Database (`packages/db/` — Drizzle ORM + SQLite)

All database access goes through `@gainster/db`. No other package should depend on `better-sqlite3` directly.

- **Drizzle ORM** for type-safe queries: `db.select().from(watchlist).where(eq(watchlist.symbol, 'AAPL')).all()`.
- **Schema definitions** in `packages/db/src/schema/` — each table in its own file (`account.ts`, `watchlist.ts`, `candles.ts`, `ai-signals.ts`, `trades.ts`, `positions.ts`, `portfolio-snapshots.ts`), barrel-exported via `index.ts`.
- **Two subpath exports**: `@gainster/db` (client + migrations + schema) and `@gainster/db/schema` (schema-only, no db connection).
- **WAL mode + foreign keys** enabled automatically by `createConnection()`.
- **`createDb(options?)` returns `{ db, dbPath }`** — callers pass `dbPath` explicitly (from `loadEnv()` or CLI args). Default: `'gainster-db'` relative to cwd. Warns to stderr if no path provided.
- **Migrations**: generated by Drizzle Kit into `packages/db/drizzle/`. After generating, rename the SQL file to something descriptive and update `drizzle/meta/_journal.json` to match.
- **Parameterized SQL only** — never interpolate user input.
- `better-sqlite3` is synchronous — no `await` needed for Drizzle queries.
- Wrap multi-writes in transactions: `db.transaction(...)`.
- Timestamps: ISO 8601 text columns with `default sql\`(datetime('now'))\``.

## Market Data (`packages/market-data/`)

- `MarketDataProvider` interface with `getQuote()`, `getCandles()`, `getApiUsage()`.
- `TwelveDataProvider` — uses native `fetch` (no SDK). Built-in rate limiter (default 8 req/min, burst 1).
- Factory: `createTwelveDataProvider(config)` accepts explicit `{ apiKey, rpm?, burst? }` — no env coupling. Callers pass values from `loadEnv()`.
- Rate limits (free tier): **8 req/min, 800 req/day** — cache aggressively when consumed from other packages.

## Frontend (Next.js + shadcn/ui)

- **App Router** with `src/` directory. Pages in `web/src/app/`.
- **Tailwind CSS v4** — configured via `globals.css` imports, not `tailwind.config`.
- **shadcn/ui** components live in `web/src/components/ui/`. Add new ones with:
  ```bash
  pnpm dlx shadcn@latest add <component>    # run from web/ directory
  ```
  Do NOT hand-edit files in `components/ui/` — they are generated.
- Custom components go in `web/src/components/` (outside `ui/`).
- Use the `cn()` utility from `@/lib/utils` for conditional classNames.
- **Recharts** is included via the shadcn chart component for data visualization.
- Prefer Server Components by default; add `"use client"` only when needed.

## Environment Variables

All env vars live in the root `.env` file. **Always use `loadEnv()` from `@gainster/env`** — never read `process.env` directly. The env package validates all variables against a Zod schema at `packages/env/src/schema.ts` and returns a typed, frozen `Env` object. Library packages (`db`, `market-data`) accept explicit config objects; callers pass values from the `Env` object.

When adding a new env var, add it to `packages/env/src/schema.ts` first, then rebuild with `pnpm build:env`.

| Variable              | Required | Default        | Description                    |
|-----------------------|----------|----------------|--------------------------------|
| `TWELVEDATA_API_KEY`  | Yes      | —              | API key for TwelveData         |
| `TWELVEDATA_RPM`      | No       | `8`            | Requests per minute            |
| `TWELVEDATA_BURST`    | No       | `1`            | Burst concurrency              |
| `GAINSTER_DB_PATH`    | No       | `gainster-db`  | SQLite file path               |
| `API_PORT`            | No       | `3001`         | Fastify server port            |
| `INITIAL_CASH`        | No       | `100000`       | Starting paper trading cash    |

## Error Handling

- **Global error handler** (`api/src/plugins/error-handler.ts`) catches all thrown errors and maps them to consistent `{ error, statusCode, details? }` responses: `ZodError` → 400, `RateLimitExceededError` → 429, `MarketDataError` → 502, unknown → 500.
- **Zod validation** in handlers uses `.parse()` which throws on invalid input — the global handler converts it to a 400.
- **Not-found cases** use explicit `reply.code(404).send(...)` in handlers.
- External API calls: always try/catch with meaningful messages.
- Never use `any` — use `unknown` and narrow, or define proper types.

## General Principles

- **Incremental delivery** — working end-to-end before adding complexity.
- **No over-engineering** — skip abstractions until the second use case.
- **Small functions** — one responsibility per function, one concern per file.
- **`const` over `let`**; never `var`. Early returns to reduce nesting.
- **Named exports** for non-plugin modules (greppability). Exception: Fastify route plugins and Next.js page/layout defaults.
- **Don't commit** `.env`, `*.db`, `dist/`, or `.next/`.
