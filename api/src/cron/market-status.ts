// Does not account for US market holidays — cron jobs will no-op via stale/empty data.
const easternFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hour: 'numeric',
  minute: 'numeric',
  weekday: 'short',
  hour12: false,
});

export function isMarketOpen(now: Date = new Date()): boolean {
  const parts = easternFormat.formatToParts(now);

  const weekday = parts.find((p) => p.type === 'weekday')?.value;
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);

  if (weekday === 'Sat' || weekday === 'Sun') return false;

  const timeInMinutes = hour * 60 + minute;
  return timeInMinutes >= 570 && timeInMinutes < 960; // 9:30 - 16:00
}
