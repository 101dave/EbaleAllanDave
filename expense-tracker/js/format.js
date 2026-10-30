/* =========================================================
   Formatting and date helpers
   Kept free of DOM/Supabase imports so they can be unit
   tested in Node.
   ========================================================= */

import { CURRENCY, LOCALE } from './config.js';

const money = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  currencyDisplay: 'narrowSymbol',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const moneyCompact = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  currencyDisplay: 'narrowSymbol',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const wholeNumber = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

/** "₱1,240.50" (no decimals for whole amounts). */
export function formatCurrency(value) {
  const number = Number(value);
  return money.format(Number.isFinite(number) ? number : 0);
}

/** "₱10.9K" — used in the middle of the donut chart. */
export function formatCompactCurrency(value) {
  const number = Number(value);
  return moneyCompact.format(Number.isFinite(number) ? number : 0);
}

/** The active currency symbol, e.g. "₱". */
export function currencySymbol() {
  const parts = money.formatToParts(0);
  const part = parts.find((item) => item.type === 'currency');
  return part ? part.value : CURRENCY;
}

/** "62%" — rounded to a whole number. */
export function formatPercent(value) {
  const number = Number(value);
  return `${wholeNumber.format(Number.isFinite(number) ? number : 0)}%`;
}

/* ---------- Dates (UTC-safe: date-only strings never shift a day) ---------- */

/** Local calendar date as YYYY-MM-DD. */
export function todayISO(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Local month as YYYY-MM. */
export function currentMonthKey(date = new Date()) {
  return todayISO(date).slice(0, 7);
}

export function isValidMonthKey(value) {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function isValidISODate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

/** Move a YYYY-MM key by a number of months (negative moves back). */
export function shiftMonthKey(key, delta) {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** First and last date of a month, as YYYY-MM-DD. */
export function monthRange(key) {
  const [year, month] = key.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    start: `${key}-01`,
    end: `${key}-${String(lastDay).padStart(2, '0')}`,
  };
}

/** The YYYY-MM a date belongs to. */
export function monthOfDate(isoDate) {
  return String(isoDate).slice(0, 7);
}

function dateFromISO(isoDate) {
  return new Date(`${isoDate}T00:00:00Z`);
}

/** "October 2026" */
export function formatMonth(key, options = {}) {
  const date = new Date(`${key}-01T00:00:00Z`);
  return new Intl.DateTimeFormat(LOCALE, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
    ...options,
  }).format(date);
}

/** "Oct 2026" */
export function formatMonthShort(key) {
  return formatMonth(key, { month: 'short' });
}

/** "Oct 3" */
export function formatDay(isoDate) {
  return new Intl.DateTimeFormat(LOCALE, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(dateFromISO(isoDate));
}

/** "Sat" */
export function formatWeekday(isoDate) {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(dateFromISO(isoDate));
}

/** "Oct 3, 2026" */
export function formatDateLong(isoDate) {
  return new Intl.DateTimeFormat(LOCALE, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(dateFromISO(isoDate));
}

/* ---------- Input helpers ---------- */

/**
 * Turn raw input into a positive amount with at most two decimals.
 * Returns { value } on success, { error } on failure.
 */
export function parseAmount(raw) {
  let cleaned = String(raw ?? '').trim();
  cleaned = cleaned.replace(/[\s,]/g, '');

  // Reject signs and accounting parentheses before stripping a currency prefix,
  // otherwise "-5" would quietly become 5.
  if (/[-+()]/.test(cleaned)) {
    return { error: 'Use numbers only, with up to two decimals.' };
  }

  cleaned = cleaned.replace(/^[^\d.]+/, '');

  if (!cleaned) return { error: 'Enter an amount.' };
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return { error: 'Use numbers only, with up to two decimals.' };
  }

  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) {
    return { error: 'Amount must be greater than zero.' };
  }
  if (value > 999999999.99) {
    return { error: 'That amount is too large.' };
  }

  return { value: Math.round(value * 100) / 100 };
}

/** Format a stored number for an editable input. */
export function amountForInput(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '';
  return Number.isInteger(number) ? String(number) : number.toFixed(2);
}

export function plural(count, singular, pluralForm) {
  return count === 1 ? singular : pluralForm || `${singular}s`;
}
