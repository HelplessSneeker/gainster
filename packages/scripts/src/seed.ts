import {
  createDb,
  migrate,
  eq,
  ensureAccount,
  insertWatchlistItem,
  upsertCandles,
  upsertPosition,
  insertTrade,
  insertPortfolioSnapshot,
  aiSignals,
  trades,
  positions,
  portfolioSnapshots,
} from '@gainster/db';
import type { NewCandle, NewAiSignal, NewTrade } from '@gainster/db';
import { loadEnv } from '@gainster/env';
import * as log from './lib/log.js';

// ── Config ────────────────────────────────────────────────────────────
const TICKERS = [
  { symbol: 'AAPL', exchange: 'NASDAQ', displayName: 'Apple Inc.', basePrice: 178 },
  { symbol: 'TSLA', exchange: 'NASDAQ', displayName: 'Tesla Inc.', basePrice: 245 },
  { symbol: 'NVDA', exchange: 'NASDAQ', displayName: 'NVIDIA Corp.', basePrice: 880 },
  { symbol: 'MSFT', exchange: 'NASDAQ', displayName: 'Microsoft Corp.', basePrice: 415 },
  { symbol: 'AMZN', exchange: 'NASDAQ', displayName: 'Amazon.com Inc.', basePrice: 185 },
] as const;

const INTERVAL = '5min';

// ── Helpers ───────────────────────────────────────────────────────────

function tradingDays(count: number): Date[] {
  const days: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (days.length < count) {
    d.setDate(d.getDate() - 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) days.push(new Date(d));
  }
  return days.reverse();
}

let rngState = 42;
function rand(): number {
  rngState = (rngState * 1664525 + 1013904223) & 0x7fffffff;
  return rngState / 0x7fffffff;
}

function randBetween(lo: number, hi: number): number {
  return lo + rand() * (hi - lo);
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)]!;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Build a datetime string directly from date components (avoids UTC shift). */
function formatDatetime(d: Date, h: number, m: number): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

/** Format a Date to YYYY-MM-DD. */
function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ── Candle generator ─────────────────────────────────────────────────

function generateCandles(
  symbol: string,
  basePrice: number,
  days: Date[],
): NewCandle[] {
  const rows: NewCandle[] = [];
  let price = basePrice;

  for (const day of days) {
    for (let bar = 0; bar < 78; bar++) {
      const minuteOfDay = 9 * 60 + 30 + bar * 5;
      const h = Math.floor(minuteOfDay / 60);
      const m = minuteOfDay % 60;

      const drift = (rand() - 0.48) * basePrice * 0.002;
      const open = round2(price);
      price = round2(price + drift);
      const close = round2(price);
      const high = round2(Math.max(open, close) + rand() * basePrice * 0.001);
      const low = round2(Math.min(open, close) - rand() * basePrice * 0.001);
      const volume = Math.floor(randBetween(50_000, 500_000));

      rows.push({
        symbol,
        interval: INTERVAL,
        datetime: formatDatetime(day, h, m),
        open,
        high,
        low,
        close,
        volume,
      });
    }
  }
  return rows;
}

// ── Signal reasoning templates ───────────────────────────────────────

const BUY_REASONS = [
  'RSI oversold at 28, MACD histogram turning positive with bullish divergence.',
  'Price testing 50-day SMA support with increasing volume, expecting bounce.',
  'Bullish engulfing pattern on 5min chart, stochastic crossing above 20.',
  'Earnings beat expectations, breakout above resistance with strong volume.',
  'Golden cross forming on short-term EMAs, momentum indicators aligning.',
] as const;

const SELL_REASONS = [
  'RSI overbought at 74, bearish divergence on MACD, volume declining.',
  'Double top formation at resistance, stochastic crossing below 80.',
  'Price rejected at upper Bollinger Band, shooting star candle pattern.',
  'Sector rotation out of tech, breaking below 20-day EMA with volume.',
  'Profit target reached, trailing stop triggered near session highs.',
] as const;

const HOLD_REASONS = [
  'Consolidating in tight range, waiting for breakout confirmation.',
  'Mixed signals: RSI neutral, MACD flat, volume below average.',
] as const;

const MODEL_CONFIGS = [
  { source: 'claude', name: 'claude-3-5-sonnet-20241022' },
  { source: 'claude', name: 'claude-3-opus-20240229' },
  { source: 'ollama', name: 'llama3.1:70b' },
  { source: 'ollama', name: 'mistral-nemo:12b' },
] as const;

const MANUAL_NOTES = [
  'Swing trade entry',
  'Scaling into position',
  'Taking partial profits',
  'Stop loss hit',
  'Rebalancing portfolio',
  null,
] as const;

// ── Main ─────────────────────────────────────────────────────────────

const env = loadEnv();
const { db, dbPath } = createDb({ dbPath: env.GAINSTER_DB_PATH });
migrate(db);
log.info(`Database: ${dbPath}`);

// Clear existing seed data (makes seed idempotent)
db.transaction((tx) => {
  tx.delete(trades).run();
  tx.delete(aiSignals).run();
  tx.delete(positions).run();
  tx.delete(portfolioSnapshots).run();
});
log.info('Cleared existing seed data');

// Account
ensureAccount(db, env.INITIAL_CASH);
log.success('Account ensured');

// Watchlist
for (const t of TICKERS) {
  try {
    insertWatchlistItem(db, {
      symbol: t.symbol,
      exchange: t.exchange,
      displayName: t.displayName,
    });
    log.success(`Watchlist: added ${t.symbol}`);
  } catch {
    log.warn(`Watchlist: ${t.symbol} already exists, skipping`);
  }
}

// Candles — 10 trading days × 78 bars × 5 symbols ≈ 3,900 rows
const days = tradingDays(10);
log.info(
  `Generating 5min candles for ${days.length} trading days (${formatDate(days[0]!)} → ${formatDate(days[days.length - 1]!)})`,
);

for (const t of TICKERS) {
  const rows = generateCandles(t.symbol, t.basePrice, days);
  const result = upsertCandles(db, rows);
  log.success(`${t.symbol}: ${result.inserted} candles inserted, ${result.skipped} skipped`);
}

// AI Signals — ~40 signals, some will be acted on via trades
interface SignalRecord {
  id: number;
  symbol: string;
  signal: string;
}

const signalRecords: SignalRecord[] = [];

db.transaction((tx) => {
  for (let i = 0; i < 40; i++) {
    const ticker = pick(TICKERS);
    const model = pick(MODEL_CONFIGS);
    const r = rand();
    const signalType = r < 0.45 ? 'BUY' : r < 0.75 ? 'SELL' : 'HOLD';
    const confidence = round2(randBetween(0.45, 0.97));
    const reasoning =
      signalType === 'BUY'
        ? pick(BUY_REASONS)
        : signalType === 'SELL'
          ? pick(SELL_REASONS)
          : pick(HOLD_REASONS);

    const day = pick(days);
    const minuteOfDay = 9 * 60 + 30 + Math.floor(rand() * 78) * 5;
    const h = Math.floor(minuteOfDay / 60);
    const m = minuteOfDay % 60;

    const indicators = JSON.stringify({
      rsi: round2(randBetween(20, 80)),
      macd: round2(randBetween(-2, 2)),
      macdSignal: round2(randBetween(-1.5, 1.5)),
      sma20: round2(ticker.basePrice * randBetween(0.97, 1.03)),
      sma50: round2(ticker.basePrice * randBetween(0.95, 1.05)),
      volume: Math.floor(randBetween(100_000, 1_000_000)),
    });

    const values: NewAiSignal = {
      symbol: ticker.symbol,
      modelSource: model.source,
      modelName: model.name,
      signal: signalType,
      confidence,
      reasoning,
      promptHash: `seed-${i.toString(16).padStart(4, '0')}`,
      indicatorsSnapshot: indicators,
      createdAt: formatDatetime(day, h, m),
      actedOn: false,
    };

    const [inserted] = tx.insert(aiSignals).values(values).returning().all();
    signalRecords.push({
      id: inserted!.id,
      symbol: ticker.symbol,
      signal: signalType,
    });
  }
});

log.success(`AI signals: inserted ${signalRecords.length}`);

// Trades — ~30 total: 12 manual + 18 AI-sourced
const allTrades: NewTrade[] = [];

// Manual trades
for (let i = 0; i < 12; i++) {
  const ticker = pick(TICKERS);
  const side = rand() < 0.55 ? 'BUY' : 'SELL';
  const day = pick(days);
  const minuteOfDay = 9 * 60 + 30 + Math.floor(rand() * 78) * 5;
  const h = Math.floor(minuteOfDay / 60);
  const m = minuteOfDay % 60;

  allTrades.push({
    symbol: ticker.symbol,
    side,
    quantity: Math.floor(randBetween(5, 50)),
    price: round2(ticker.basePrice * randBetween(0.97, 1.03)),
    executedAt: formatDatetime(day, h, m),
    signalSource: 'manual',
    notes: pick(MANUAL_NOTES),
  });
}

// AI-sourced trades linked to signals
const actableSignals = signalRecords.filter((s) => s.signal !== 'HOLD');
const aiTradeCount = Math.min(18, actableSignals.length);

for (let i = 0; i < aiTradeCount; i++) {
  const sig = actableSignals[i]!;
  const ticker = TICKERS.find((t) => t.symbol === sig.symbol)!;
  const day = pick(days);
  const minuteOfDay = 9 * 60 + 30 + Math.floor(rand() * 78) * 5;
  const h = Math.floor(minuteOfDay / 60);
  const m = minuteOfDay % 60;

  allTrades.push({
    symbol: sig.symbol,
    side: sig.signal === 'BUY' ? 'BUY' : 'SELL',
    quantity: Math.floor(randBetween(10, 100)),
    price: round2(ticker.basePrice * randBetween(0.97, 1.03)),
    executedAt: formatDatetime(day, h, m),
    signalId: sig.id,
    signalSource: 'ai',
    notes: null,
  });

  // Mark signal as acted on
  db.update(aiSignals).set({ actedOn: true }).where(eq(aiSignals.id, sig.id)).run();
}

for (const trade of allTrades) {
  insertTrade(db, trade);
}
log.success(`Trades: inserted ${allTrades.length} (${12} manual, ${aiTradeCount} AI-sourced)`);

// Positions — derive from net trade activity
const netPositions = new Map<string, { qty: number; totalCost: number }>();
for (const t of allTrades) {
  const existing = netPositions.get(t.symbol) ?? { qty: 0, totalCost: 0 };
  if (t.side === 'BUY') {
    existing.qty += t.quantity;
    existing.totalCost += t.quantity * t.price;
  } else {
    const sellQty = Math.min(t.quantity, existing.qty);
    if (existing.qty > 0) {
      const avgCost = existing.totalCost / existing.qty;
      existing.totalCost -= sellQty * avgCost;
    }
    existing.qty = Math.max(0, existing.qty - t.quantity);
  }
  netPositions.set(t.symbol, existing);
}

let posCount = 0;
for (const [symbol, pos] of netPositions) {
  if (pos.qty <= 0) continue;
  const ticker = TICKERS.find((t) => t.symbol === symbol)!;
  const avgEntry = round2(pos.totalCost / pos.qty);
  const currentPrice = round2(ticker.basePrice * randBetween(0.98, 1.02));
  const unrealizedPnl = round2((currentPrice - avgEntry) * pos.qty);
  upsertPosition(db, {
    symbol,
    quantity: pos.qty,
    avgEntryPrice: avgEntry,
    currentPrice,
    unrealizedPnl,
  });
  posCount++;
}
log.success(`Positions: upserted ${posCount}`);

// Portfolio snapshots — one per trading day
for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
  const day = days[dayIndex]!;
  const invested = round2(randBetween(20_000, 60_000));
  const cash = round2(env.INITIAL_CASH - invested + randBetween(-2000, 5000));
  const unrealized = round2(randBetween(-3000, 5000));
  const realized = round2(dayIndex * randBetween(50, 200));

  insertPortfolioSnapshot(db, {
    timestamp: formatDatetime(day, 16, 0),
    totalValue: round2(cash + invested + unrealized),
    cash,
    invested,
    unrealizedPnl: unrealized,
    realizedPnl: realized,
  });
}
log.success(`Portfolio snapshots: inserted ${days.length}`);

// Summary
console.log('\n--- Seed Summary ---');
log.info(`Watchlist: ${TICKERS.length} tickers`);
log.info(`Candles: ~${TICKERS.length * days.length * 78} rows (${TICKERS.length} x ${days.length} days x 78 bars)`);
log.info(`AI Signals: ${signalRecords.length} (${aiTradeCount} acted on)`);
log.info(`Trades: ${allTrades.length} (12 manual + ${aiTradeCount} AI-sourced)`);
log.info(`Positions: ${posCount} open`);
log.info(`Portfolio snapshots: ${days.length}`);
log.success('Seed complete');
