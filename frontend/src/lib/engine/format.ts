const LONG_DATE = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

/** Formats an ISO date (yyyy-mm-dd) as e.g. "October 18, 2026", or returns null if it isn't a real date. */
export function formatLongDate(iso: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  // Built in UTC and formatted in UTC so the viewer's time zone can't shift the day
  const date = new Date(Date.UTC(year, month - 1, day));
  // Date.UTC rolls invalid dates over (Feb 30 becomes Mar 2) and maps years 0-99 to 19xx
  const roundTrips =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  return roundTrips ? LONG_DATE.format(date) : null;
}

/** The given moment's calendar date in the local time zone, as yyyy-mm-dd. */
export function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Formats a positive whole number with its unit, e.g. "1 year" or "3 years"; null for anything else. */
export function formatCount(
  value: string,
  unit?: { singular: string; plural: string },
): string | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  if (!unit) return value;
  return `${value} ${value === "1" ? unit.singular : unit.plural}`;
}
