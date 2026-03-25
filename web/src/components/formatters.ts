const currencyFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const numberFmt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

export function formatCurrency(value: number): string {
  return currencyFmt.format(value)
}

export function formatSignedCurrency(value: number): string {
  if (value > 0) return `+${currencyFmt.format(value)}`
  return currencyFmt.format(value)
}

const numberFmt0 = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const fmtCache = new Map<number, Intl.NumberFormat>([
  [0, numberFmt0],
  [2, numberFmt],
])

function getNumberFmt(decimals: number): Intl.NumberFormat {
  let fmt = fmtCache.get(decimals)
  if (!fmt) {
    fmt = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    fmtCache.set(decimals, fmt)
  }
  return fmt
}

export function formatNumber(value: number, decimals?: number): string {
  if (decimals !== undefined) {
    return getNumberFmt(decimals).format(value)
  }
  return numberFmt.format(value)
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(2)}%`
}

export function formatChange(open: number, close: number): string {
  const change = close - open
  const pct = open !== 0 ? (change / open) * 100 : 0
  const sign = pct >= 0 ? "+" : ""
  return `${sign}${pct.toFixed(2)}%`
}

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso))
}
