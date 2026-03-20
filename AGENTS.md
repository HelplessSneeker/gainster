# AGENTS.md — Gainster

Stock portfolio tracker & analysis platform. Fastify API + Next.js dashboard + SQLite + TwelveData. Evolving toward AI-agent paper trading.

## Monorepo Layout

pnpm workspaces with four packages:

```
api/                    # Fastify REST API (scaffolded, no source yet)
  package.json          # Dependencies: fastify v5, @fastify/cors, @gainster/db
  tsconfig.json         # Strict ESM config (nodenext)
web/                    # Next.js 16 dashboard (App Router, Tailwind v4, shadcn/ui)
  src/
    app/                # App Router routes and layouts
    components/ui/      # shadcn/ui components (generated — do not hand-edit)
    components/         # Custom app components go here (outside ui/)
    lib/utils.ts        # cn() helper for className merging
    hooks/              # Custom React hooks
packages/
  db/                   # Shared database package (Drizzle ORM + better-sqlite3)
    src/
      schema/           # Drizzle table definitions (watchlist, candles)
      client.ts         # createDb() — Drizzle instance with schema
      connection.ts     # createConnection() — better-sqlite3 with WAL + FK
      migrate.ts        # migrate() — applies pending migrations
      index.ts          # Barrel export
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
      factory.ts        # createTwelveDataProvider() — reads env vars
      providers/
        twelvedata/     # TwelveData implementation (native fetch, no SDK)
    scripts/
      smoke.ts          # Smoke test — fetches a quote via the provider
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
pnpm build:db           # TypeScript compile (tsc -b) → packages/db/dist/
pnpm db:generate        # Generate Drizzle migration SQL from schema changes
pnpm db:migrate         # Apply pending migrations to the database
pnpm db:studio          # Open Drizzle Studio (interactive DB browser)

# Linting (web only — ESLint + eslint-config-next)
pnpm --filter @gainster/web lint
```

No test framework yet. When added (prefer `vitest`), run a single test with:
`pnpm --filter @gainster/api test -- path/to/file.test.ts`

**Package manager:** pnpm v10.28.2. Always `pnpm add`, never `npm install` / `yarn add`.
To add a dep to a specific package: `pnpm --filter @gainster/web add <pkg>`.

## API — TypeScript Strict Mode & Imports

The API, market-data, and db tsconfigs are maximally strict:

- **`strict: true`** — strictNullChecks, noImplicitAny, etc.
- **`noUncheckedIndexedAccess: true`** — index access returns `T | undefined`. Narrow before use.
- **`exactOptionalPropertyTypes: true`** — `foo?: string` does NOT accept explicit `undefined`.
- **`verbatimModuleSyntax: true`** — type-only imports MUST use `import type`.

Both are ESM (`"type": "module"`, `"module": "nodenext"`).

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

Each route file exports a Fastify plugin:

```typescript
import type { FastifyInstance } from 'fastify';

export default async function portfolioRoutes(fastify: FastifyInstance) {
  fastify.get('/api/portfolio', {
    schema: { response: { 200: { type: 'array', items: { /* JSON Schema */ } } } },
  }, async (request, reply) => {
    // handler
  });
}
```

Register via `fastify.register(plugin)`. Always define `schema` on routes for validation/serialization. Use `async` handlers — no callbacks. Log with `fastify.log.error(err)` — never `console.log`.

## Database (`packages/db/` — Drizzle ORM + SQLite)

All database access goes through `@gainster/db`. No other package should depend on `better-sqlite3` directly.

- **Drizzle ORM** for type-safe queries: `db.select().from(watchlist).where(eq(watchlist.symbol, 'AAPL')).all()`.
- **Schema definitions** in `packages/db/src/schema/` — each table in its own file, barrel-exported via `index.ts`.
- **Two subpath exports**: `@gainster/db` (client + migrations + schema) and `@gainster/db/schema` (schema-only, no db connection).
- **WAL mode + foreign keys** enabled automatically by `createConnection()`.
- **DB path resolution**: `options.dbPath` → `GAINSTER_DB_PATH` env var → `'gainster-db'` default (file in cwd).
- **Migrations**: generated by Drizzle Kit into `packages/db/drizzle/`. After generating, rename the SQL file to something descriptive and update `drizzle/meta/_journal.json` to match.
- **Parameterized SQL only** — never interpolate user input.
- `better-sqlite3` is synchronous — no `await` needed for Drizzle queries.
- Wrap multi-writes in transactions: `db.transaction(...)`.
- Timestamps: ISO 8601 text columns with `default sql\`(datetime('now'))\``.

## Market Data (`packages/market-data/`)

- `MarketDataProvider` interface with `getQuote()`, `getCandles()`, `getApiUsage()`.
- `TwelveDataProvider` — uses native `fetch` (no SDK). Built-in rate limiter (default 8 req/min, burst 1).
- Factory: `createTwelveDataProvider()` reads `TWELVEDATA_API_KEY`, `TWELVEDATA_RPM`, `TWELVEDATA_BURST` from env.
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

| Variable              | Used by        | Description                    |
|-----------------------|----------------|--------------------------------|
| `TWELVEDATA_API_KEY`  | market-data    | API key for TwelveData         |
| `TWELVEDATA_RPM`      | market-data    | Requests per minute (default 8)|
| `TWELVEDATA_BURST`    | market-data    | Burst concurrency (default 1)  |
| `GAINSTER_DB_PATH`    | db             | SQLite file path (default `gainster-db`) |

## Error Handling

- In route handlers: `reply.code(N).send({ error })` — not raw `throw`.
- Validate at the schema level; trust validated data inside handlers.
- External API calls: always try/catch with meaningful messages.
- Never use `any` — use `unknown` and narrow, or define proper types.

## General Principles

- **Incremental delivery** — working end-to-end before adding complexity.
- **No over-engineering** — skip abstractions until the second use case.
- **Small functions** — one responsibility per function, one concern per file.
- **`const` over `let`**; never `var`. Early returns to reduce nesting.
- **Named exports** for non-plugin modules (greppability). Exception: Fastify route plugins and Next.js page/layout defaults.
- **Don't commit** `.env`, `*.db`, `dist/`, or `.next/`.
