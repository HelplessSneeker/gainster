# Gainster

Stock portfolio tracker and analysis platform, evolving toward AI-agent paper trading.

Built with a **Fastify** REST API, **Next.js 16** dashboard, **SQLite** database, and **TwelveData** market data integration.

## Monorepo Structure

```
api/                  — Fastify REST API (TypeScript, ESM, Zod validation, cron jobs)
web/                  — Next.js 16 dashboard (App Router, Tailwind v4, shadcn/ui)
packages/env/         — Centralized env loading + validation (zod)
packages/db/          — Shared database package (Drizzle ORM + SQLite)
packages/market-data/ — Market data provider library (TwelveData integration)
packages/scripts/     — CLI scripts (backfill, seed)
```

Managed with **pnpm workspaces** (`pnpm v10.28.2`).

## Prerequisites

- **Node.js** >= 20
- **pnpm** 10.28.2 — install with `corepack enable && corepack prepare pnpm@10.28.2 --activate`
- A **TwelveData** API key (free tier: 8 req/min, 800 req/day) — [twelvedata.com](https://twelvedata.com/)

## Getting Started

```bash
# Install dependencies
pnpm install

# Add your API key to the root .env
echo "TWELVEDATA_API_KEY=your_key_here" > .env

# Run the market-data smoke test
pnpm smoke:market-data

# Backfill historical candle data
pnpm backfill -- --symbol AAPL --interval 1day

# Start both dev servers
pnpm dev
```

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start API + web dev servers in parallel |
| `pnpm dev:api` | Start Fastify dev server only (tsx watch) |
| `pnpm dev:web` | Start Next.js dev server only |
| `pnpm build` | Build all packages |
| `pnpm build:api` | Compile API TypeScript → `api/dist/` |
| `pnpm build:web` | Build Next.js for production |
| `pnpm build:env` | Compile env → `packages/env/dist/` |
| `pnpm build:market-data` | Compile market-data → `packages/market-data/dist/` |
| `pnpm smoke:market-data` | Run market-data smoke test |
| `pnpm build:db` | Compile db → `packages/db/dist/` |
| `pnpm db:generate` | Generate Drizzle migration SQL |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm backfill` | Backfill candle data (all active watchlist tickers, 5min) |
| `pnpm backfill -- -s AAPL -i 1day` | Backfill specific symbol/interval |
| `pnpm seed` | Seed DB with synthetic demo data (no API key needed) |
| `pnpm test` | Run API tests (vitest) |
| `pnpm test:api` | Run API tests (vitest, explicit filter) |
| `pnpm --filter @gainster/web lint` | Lint the web package |

## Tech Stack

### API (`@gainster/api`)

- [Fastify](https://fastify.dev/) v5 — HTTP framework with plugin architecture
- [Zod](https://zod.dev/) — request/response validation at route boundaries
- [node-cron](https://github.com/node-cron/node-cron) — scheduled candle polling and portfolio snapshots
- `@gainster/db`, `@gainster/env`, `@gainster/market-data` — workspace dependencies
- [Vitest](https://vitest.dev/) — unit and integration tests
- TypeScript (strict mode, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`)

### Database (`@gainster/db`)

- [Drizzle ORM](https://orm.drizzle.team/) — type-safe SQL queries and schema definitions
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — SQLite driver (WAL mode)
- Tables: `account`, `watchlist`, `candles`, `ai_signals`, `trades`, `positions`, `portfolio_snapshots`

### Web (`@gainster/web`)

- [Next.js](https://nextjs.org/) 16 — App Router with React 19
- [Tailwind CSS](https://tailwindcss.com/) v4
- [shadcn/ui](https://ui.shadcn.com/) — component library
- [Recharts](https://recharts.org/) — data visualization

### Env (`@gainster/env`)

- [Zod](https://zod.dev/) — schema validation for environment variables
- `loadEnv()` reads root `.env`, validates, returns a typed frozen `Env` object
- Library packages accept explicit config — no direct `process.env` coupling

### Market Data (`@gainster/market-data`)

- [TwelveData](https://twelvedata.com/) — market data API (via native `fetch`, no SDK)
- Built-in token-bucket rate limiter (configurable RPM + burst)
- Provider interface: `getQuote()`, `getCandles()`, `getApiUsage()`

### Scripts (`@gainster/scripts`)

- **Backfill** — seeds historical OHLCV candle data from TwelveData into SQLite
  - Flags: `--symbol` / `-s` (default: all active watchlist tickers), `--interval` / `-i` (default: `5min`)
  - Batch upsert with duplicate detection, intraday gap warnings
- **Seed** — generates synthetic demo data (watchlist, candles, trades, positions, snapshots) without requiring an API key

## Environment Variables

Store all env vars in the root `.env` file. Always use `loadEnv()` from `@gainster/env` to access them — never read `process.env` directly.

| Variable | Description |
|---|---|
| `TWELVEDATA_API_KEY` | API key for TwelveData (required for market data and backfill) |
| `TWELVEDATA_RPM` | Requests per minute override (default 8) |
| `TWELVEDATA_BURST` | Burst concurrency override (default 1) |
| `GAINSTER_DB_PATH` | SQLite file path (default `gainster-db` in cwd) |
| `API_PORT` | Fastify server port (default 3001) |
| `INITIAL_CASH` | Starting paper trading cash balance (default 100000) |
| `NEXT_PUBLIC_API_URL` | Web dashboard API base URL (default `http://localhost:3001`). Next.js build-time variable, not managed by `loadEnv()`. |

## License

Private — all rights reserved.
