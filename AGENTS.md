# AGENTS.md — Gainster

Stock portfolio tracker & analysis platform. Fastify API + Next.js dashboard + SQLite + TwelveData. Evolving toward AI-agent paper trading.

## Monorepo Layout

pnpm workspaces with two packages:

```
api/                    # Fastify REST API (TypeScript, ESM)
  src/
    index.ts            # Entry point — Fastify server bootstrap
    routes/             # Fastify route plugins (one file per resource)
    services/           # Business logic & external API wrappers
    db/                 # Database init, queries, migrations
    types/              # Shared TypeScript type definitions
    utils/              # Pure helper functions
  dist/                 # Compiled output (gitignored)
  .env                  # API secrets (gitignored)
web/                    # Next.js 16 dashboard (App Router, Tailwind v4, shadcn/ui)
  src/
    app/                # App Router routes and layouts
    components/ui/      # shadcn/ui components (generated — do not hand-edit)
    components/         # Custom app components go here (outside ui/)
    lib/utils.ts        # cn() helper for className merging
    hooks/              # Custom React hooks
```

## Build / Dev / Test Commands

```bash
# Root-level (runs across all packages)
pnpm dev                # Start both API and web dev servers in parallel
pnpm build              # Build all packages

# Per-package
pnpm dev:api            # Fastify dev server (tsx watch)
pnpm dev:web            # Next.js dev server (port 3000)
pnpm build:api          # TypeScript compile (tsc -b) → api/dist/
pnpm build:web          # next build

# Linting (web only — ESLint + eslint-config-next)
pnpm --filter @gainster/web lint
```

No test framework yet. When added (prefer `vitest`), run a single test with:
`pnpm --filter @gainster/api test -- path/to/file.test.ts`

**Package manager:** pnpm v10.28.2. Always `pnpm add`, never `npm install` / `yarn add`.
To add a dep to a specific package: `pnpm --filter @gainster/web add <pkg>`.

## API — TypeScript Strict Mode & Imports

The API tsconfig (`api/tsconfig.json`) is maximally strict:

- **`strict: true`** — strictNullChecks, noImplicitAny, etc.
- **`noUncheckedIndexedAccess: true`** — index access returns `T | undefined`. Narrow before use.
- **`exactOptionalPropertyTypes: true`** — `foo?: string` does NOT accept explicit `undefined`.
- **`verbatimModuleSyntax: true`** — type-only imports MUST use `import type`.

The API is ESM (`"type": "module"`, `"module": "nodenext"`).

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

## Database (SQLite via better-sqlite3)

- **WAL mode**: `db.pragma('journal_mode = WAL')` on connection.
- **Parameterized SQL only** — never interpolate user input.
- `better-sqlite3` is synchronous — no `await` needed.
- Wrap multi-writes in transactions: `db.transaction(...)()`.
- Timestamps: ISO 8601 strings or Unix epoch integers.

## TwelveData API (`api/src/services/twelvedata.ts`)

- Rate limits: **8 req/min, 800 req/day** (free tier). Cache in SQLite with TTL.
- Always try/catch — never let TwelveData errors crash the server.

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

Secrets in `api/.env` (gitignored):

| Variable            | Description                |
|---------------------|----------------------------|
| `TWELVEDATA_API_KEY`| API key for TwelveData     |
| `PORT`              | Server port (default 3000) |
| `DATABASE_PATH`     | SQLite file path (optional)|

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
