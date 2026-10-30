/* =========================================================
   Categories
   Plain strings instead of a database table: a personal
   tracker needs a short, predictable list, and new categories
   can be added here without a migration.
   ========================================================= */

export const EXPENSE_CATEGORIES = Object.freeze([
  'Groceries',
  'Rent',
  'Transport',
  'Dining',
  'Utilities',
  'Shopping',
  'Health',
  'Education',
  'Entertainment',
  'Other',
]);

export const INCOME_CATEGORIES = Object.freeze([
  'Allowance',
  'Salary',
  'Freelance',
  'Gift',
  'Refund',
  'Other',
]);

export const CATEGORIES = Object.freeze({
  expense: EXPENSE_CATEGORIES,
  income: INCOME_CATEGORIES,
});

/** Palette slots defined in css/styles.css (--chart-1 … --chart-10). */
const PALETTE = Object.freeze([
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
  '--chart-6',
  '--chart-7',
  '--chart-8',
  '--chart-9',
  '--chart-10',
]);

export function categoriesFor(type) {
  return CATEGORIES[type] || CATEGORIES.expense;
}

/**
 * A stable colour slot per category, so the same category keeps the
 * same swatch in the table, the legend and the chart.
 */
export function categoryColorVar(category) {
  const expenseIndex = EXPENSE_CATEGORIES.indexOf(category);
  if (expenseIndex !== -1) return PALETTE[expenseIndex % PALETTE.length];

  const incomeIndex = INCOME_CATEGORIES.indexOf(category);
  if (incomeIndex !== -1) return PALETTE[(incomeIndex + 4) % PALETTE.length];

  // Unknown/custom category: hash its name onto the palette.
  let hash = 0;
  for (let i = 0; i < category.length; i += 1) {
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
