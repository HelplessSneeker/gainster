# Gainster

Stock portfolio tracker and analysis platform, evolving toward AI-agent paper trading.

Built with a **Fastify** REST API, **Next.js 16** dashboard, **SQLite** database, and **TwelveData** market data integration.

## Monorepo Structure

```
api/                  — Fastify REST API (TypeScript, ESM, strict mode) — scaffolded, no source yet
web/                  — Next.js 16 dashboard (App Router, Tailwind v4, shadcn/ui)
packages/market-data/ — Market data provider library (TwelveData integration)
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

# Run the market-data smoke test
TWELVEDATA_API_KEY=your_key_here pnpm smoke:market-data

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
| `pnpm build:market-data` | Compile market-data → `packages/market-data/dist/` |
| `pnpm smoke:market-data` | Run market-data smoke test |
| `pnpm --filter @gainster/web lint` | Lint the web package |

## Tech Stack

### API (`@gainster/api`)

- [Fastify](https://fastify.dev/) v5 — HTTP framework
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — SQLite driver (WAL mode)
- TypeScript (strict mode, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`)

### Web (`@gainster/web`)

- [Next.js](https://nextjs.org/) 16 — App Router with React 19
- [Tailwind CSS](https://tailwindcss.com/) v4
- [shadcn/ui](https://ui.shadcn.com/) — component library
- [Recharts](https://recharts.org/) — data visualization

### Market Data (`@gainster/market-data`)

- [TwelveData](https://twelvedata.com/) — market data API (via native `fetch`, no SDK)
- Built-in token-bucket rate limiter (configurable RPM + burst)
- Provider interface: `getQuote()`, `getCandles()`, `getApiUsage()`

## Environment Variables

| Variable | Description |
|---|---|
| `TWELVEDATA_API_KEY` | API key for TwelveData (required by market-data) |
| `TWELVEDATA_RPM` | Requests per minute override (default 8) |
| `TWELVEDATA_BURST` | Burst concurrency override (default 1) |

## License

Private — all rights reserved.
