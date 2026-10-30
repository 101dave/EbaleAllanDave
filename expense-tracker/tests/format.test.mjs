import test from 'node:test';
import assert from 'node:assert/strict';

import {
  amountForInput,
  currentMonthKey,
  formatDay,
  formatMonth,
  formatPercent,
  isValidISODate,
  isValidMonthKey,
  monthOfDate,
  monthRange,
  parseAmount,
  shiftMonthKey,
  todayISO,
} from '../js/format.js';

test('monthRange handles 31-day, 30-day and February months', () => {
  assert.deepEqual(monthRange('2026-10'), { start: '2026-10-01', end: '2026-10-31' });
  assert.deepEqual(monthRange('2026-09'), { start: '2026-09-01', end: '2026-09-30' });
  assert.deepEqual(monthRange('2024-02'), { start: '2024-02-01', end: '2024-02-29' });
  assert.deepEqual(monthRange('2026-02'), { start: '2026-02-01', end: '2026-02-28' });
});

test('month keys shift across year boundaries', () => {
  assert.equal(shiftMonthKey('2026-01', -1), '2025-12');
  assert.equal(shiftMonthKey('2026-12', 1), '2027-01');
  assert.equal(shiftMonthKey('2026-10', -3), '2026-07');
});

test('month keys and dates are validated strictly', () => {
  assert.equal(isValidMonthKey('2026-10'), true);
  assert.equal(isValidMonthKey('2026-13'), false);
  assert.equal(isValidMonthKey('2026-1'), false);
  assert.equal(isValidISODate('2026-10-31'), true);
  assert.equal(isValidISODate('2026-02-30'), false);
  assert.equal(isValidISODate('2026-2-3'), false);
  assert.equal(monthOfDate('2026-10-31'), '2026-10');
});

test('local date helpers produce zero-padded values', () => {
  const sample = new Date(2026, 0, 5, 23, 30);
  assert.equal(todayISO(sample), '2026-01-05');
  assert.equal(currentMonthKey(sample), '2026-01');
});

test('dates format without a timezone day shift', () => {
  assert.equal(formatDay('2026-10-01'), 'Oct 1');
  assert.equal(formatMonth('2026-10'), 'October 2026');
});

test('parseAmount accepts plain amounts and rejects bad input', () => {
  assert.deepEqual(parseAmount('1,240.50'), { value: 1240.5 });
  assert.deepEqual(parseAmount('₱320'), { value: 320 });
  assert.equal(parseAmount('0').error, 'Amount must be greater than zero.');
  assert.equal(parseAmount('').error, 'Enter an amount.');
  assert.equal(parseAmount('12.345').error, 'Use numbers only, with up to two decimals.');
  assert.equal(parseAmount('-5').error, 'Use numbers only, with up to two decimals.');
  assert.equal(parseAmount('1000000000').error, 'That amount is too large.');
});

test('amountForInput keeps decimals only when needed', () => {
  assert.equal(amountForInput(1200), '1200');
  assert.equal(amountForInput(1200.5), '1200.50');
});

test('percent formatting rounds to a whole number', () => {
  assert.equal(formatPercent(72.6), '73%');
  assert.equal(formatPercent(0), '0%');
});
