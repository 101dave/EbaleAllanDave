/* =========================================================
   Sample data for demo mode
   Generated relative to "today" so the demo always has a
   current month, a previous month, and a quieter month before
   that (the last one has no budget, to show that empty state).
   All names and amounts are fictional.
   ========================================================= */

import { currentMonthKey, shiftMonthKey } from './format.js';

const CURRENT = [
  { type: 'income', category: 'Allowance', amount: 9000, day: 1, note: 'Monthly allowance' },
  { type: 'income', category: 'Freelance', amount: 3500, day: 6, note: 'Landing page revision' },
  { type: 'expense', category: 'Rent', amount: 3500, day: 2, note: 'Room rent' },
  { type: 'expense', category: 'Groceries', amount: 1240, day: 4, note: 'Weekly grocery run' },
  { type: 'expense', category: 'Transport', amount: 240, day: 5, note: 'Jeep and bus fare' },
  { type: 'expense', category: 'Dining', amount: 320, day: 7, note: 'Lunch with classmates' },
  { type: 'expense', category: 'Utilities', amount: 1450, day: 8, note: 'Electric bill' },
  { type: 'expense', category: 'Utilities', amount: 1199, day: 9, note: 'Home internet' },
  { type: 'expense', category: 'Groceries', amount: 860, day: 11, note: 'Fruits and pantry refill' },
  { type: 'expense', category: 'Transport', amount: 160, day: 12, note: 'Fare to campus' },
  { type: 'expense', category: 'Dining', amount: 420, day: 14, note: 'Weekend dinner' },
  { type: 'expense', category: 'Shopping', amount: 890, day: 15, note: 'Running shoes' },
  { type: 'expense', category: 'Health', amount: 420, day: 16, note: 'Vitamins' },
  { type: 'expense', category: 'Entertainment', amount: 250, day: 18, note: 'Movie rental' },
  { type: 'expense', category: 'Education', amount: 750, day: 19, note: 'Reference book' },
];

const LAST = [
  { type: 'income', category: 'Allowance', amount: 9000, day: 1, note: 'Monthly allowance' },
  { type: 'income', category: 'Freelance', amount: 1800, day: 12, note: 'Poster layout' },
  { type: 'expense', category: 'Rent', amount: 3500, day: 2, note: 'Room rent' },
  { type: 'expense', category: 'Groceries', amount: 2100, day: 3, note: 'Pantry restock' },
  { type: 'expense', category: 'Transport', amount: 380, day: 6, note: 'Fares for the week' },
  { type: 'expense', category: 'Dining', amount: 690, day: 9, note: 'Birthday dinner' },
  { type: 'expense', category: 'Utilities', amount: 1320, day: 10, note: 'Electric and water' },
  { type: 'expense', category: 'Shopping', amount: 1450, day: 17, note: 'Desk lamp and cables' },
  { type: 'expense', category: 'Health', amount: 300, day: 21, note: 'Pharmacy' },
  { type: 'expense', category: 'Entertainment', amount: 420, day: 24, note: 'Concert ticket' },
];

const OLDER = [
  { type: 'income', category: 'Allowance', amount: 9000, day: 1, note: 'Monthly allowance' },
  { type: 'expense', category: 'Rent', amount: 3500, day: 2, note: 'Room rent' },
  { type: 'expense', category: 'Groceries', amount: 1980, day: 5, note: 'Groceries for two weeks' },
  { type: 'expense', category: 'Transport', amount: 290, day: 8, note: 'Fares' },
  { type: 'expense', category: 'Dining', amount: 520, day: 13, note: 'Study session snacks' },
  { type: 'expense', category: 'Utilities', amount: 1410, day: 15, note: 'Electric bill' },
  { type: 'expense', category: 'Other', amount: 600, day: 22, note: 'Printing and school fees' },
];

function pad(value) {
  return String(value).padStart(2, '0');
}

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildEntries(entries, monthKey, maxDay) {
  return entries.map((entry, index) => {
    const day = Math.max(1, Math.min(entry.day, maxDay));
    const date = `${monthKey}-${pad(day)}`;
    // Spread created_at so ordering inside a day is stable and newest-first.
    const hour = 8 + (index % 12);
    const minute = (index * 7) % 60;
    return {
      id: makeId(),
      type: entry.type,
      amount: entry.amount,
      category: entry.category,
      date,
      note: entry.note,
      createdAt: `${date}T${pad(hour)}:${pad(minute)}:00.000Z`,
    };
  });
}

/**
 * Build a fresh demo dataset.
 * @param {Date} now
 * @returns {{ transactions: Array, budgets: Record<string, number> }}
 */
export function buildDemoData(now = new Date()) {
  const current = currentMonthKey(now);
  const last = shiftMonthKey(current, -1);
  const older = shiftMonthKey(current, -2);
  const today = now.getDate();

  return {
    transactions: [
      ...buildEntries(CURRENT, current, today),
      ...buildEntries(LAST, last, 28),
      ...buildEntries(OLDER, older, 28),
    ],
    budgets: {
      [current]: 16000,
      [last]: 15000,
    },
  };
}
