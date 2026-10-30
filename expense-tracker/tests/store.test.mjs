import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createDemoStore,
  DEMO_STORAGE_KEY,
  StoreError,
} from '../js/store.js';
import { buildDemoData } from '../js/demo-data.js';
import { currentMonthKey, monthRange, shiftMonthKey } from '../js/format.js';

class MemoryStorage {
  constructor() {
    this.map = new Map();
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    this.map.set(key, String(value));
  }
  removeItem(key) {
    this.map.delete(key);
  }
}

const SEED = {
  transactions: [
    {
      id: 't1',
      type: 'expense',
      amount: 100,
      category: 'Groceries',
      date: '2026-10-05',
      note: 'Market',
      createdAt: '2026-10-05T09:00:00.000Z',
    },
    {
      id: 't2',
      type: 'income',
      amount: 500,
      category: 'Allowance',
      date: '2026-10-01',
      note: '',
      createdAt: '2026-10-01T08:00:00.000Z',
    },
    {
      id: 't3',
      type: 'expense',
      amount: 50,
      category: 'Transport',
      date: '2026-09-30',
      note: 'Fare',
      createdAt: '2026-09-30T10:00:00.000Z',
    },
  ],
  budgets: { '2026-10': 1000 },
};

const makeStore = (storage = new MemoryStorage()) =>
  createDemoStore({ storage, seed: SEED });

test('demo store lists only the requested month, newest first', async () => {
  const store = makeStore();
  const list = await store.listTransactions('2026-10');

  assert.equal(store.mode, 'demo');
  assert.deepEqual(list.map((tx) => tx.id), ['t1', 't2']);
  assert.equal(list[0].amount, 100);
});

test('demo store creates, updates and deletes transactions', async () => {
  const storage = new MemoryStorage();
  const store = makeStore(storage);

  const created = await store.createTransaction({
    type: 'income',
    amount: 250.5,
    category: 'Gift',
    date: '2026-10-12',
    note: '  Birthday  ',
  });

  assert.ok(created.id);
  assert.equal(created.note, 'Birthday');
  assert.equal((await store.listTransactions('2026-10')).length, 3);

  const updated = await store.updateTransaction(created.id, {
    type: 'income',
    amount: 300,
    category: 'Freelance',
    date: '2026-10-13',
    note: 'Small fix',
  });

  assert.equal(updated.amount, 300);
  assert.equal(updated.category, 'Freelance');
  assert.equal((await store.listTransactions('2026-10')).length, 3);

  await store.deleteTransaction(created.id);
  assert.equal((await store.listTransactions('2026-10')).length, 2);
  await assert.rejects(() => store.deleteTransaction(created.id), StoreError);

  // A fresh store sees the persisted state, not the seed.
  const reopened = makeStore(storage);
  assert.equal((await reopened.listTransactions('2026-10')).length, 2);
  assert.ok(storage.getItem(DEMO_STORAGE_KEY));
});

test('demo store rejects invalid transactions', async () => {
  const store = makeStore();

  await assert.rejects(
    () => store.createTransaction({ type: 'expense', amount: 0, category: 'Other', date: '2026-10-01' }),
    /greater than zero/
  );
  await assert.rejects(
    () => store.createTransaction({ type: 'expense', amount: 10, category: '', date: '2026-10-01' }),
    /Choose a category/
  );
  await assert.rejects(
    () => store.createTransaction({ type: 'expense', amount: 10, category: 'Other', date: '2026-02-30' }),
    /valid date/
  );
  await assert.rejects(
    () =>
      store.createTransaction({
        type: 'expense',
        amount: 10,
        category: 'Other',
        date: '2026-10-01',
        note: 'x'.repeat(201),
      }),
    /under 200/
  );
});

test('budgets can be set, read, replaced and removed', async () => {
  const store = makeStore();

  assert.equal(await store.getBudget('2026-10'), 1000);
  assert.equal(await store.getBudget('2026-08'), null);

  await store.setBudget('2026-10', 1800.25);
  assert.equal(await store.getBudget('2026-10'), 1800.25);

  await store.clearBudget('2026-10');
  assert.equal(await store.getBudget('2026-10'), null);
});

test('reset restores the original sample data', async () => {
  const store = makeStore();
  await store.deleteTransaction('t1');
  await store.clearBudget('2026-10');

  store.reset();

  assert.equal((await store.listTransactions('2026-10')).length, 2);
  assert.equal(await store.getBudget('2026-10'), 1000);
});

test('demo data covers this month and the two before it', () => {
  const now = new Date(2026, 9, 30); // 30 Oct 2026, local time
  const data = buildDemoData(now);
  const current = currentMonthKey(now);

  assert.equal(data.budgets[current], 16000);
  assert.equal(data.budgets[shiftMonthKey(current, -1)], 15000);
  assert.equal(data.budgets[shiftMonthKey(current, -2)], undefined);

  for (const monthKey of [current, shiftMonthKey(current, -1), shiftMonthKey(current, -2)]) {
    const { start, end } = monthRange(monthKey);
    const entries = data.transactions.filter((tx) => tx.date.slice(0, 7) === monthKey);
    assert.ok(entries.length > 0, `expected sample data for ${monthKey}`);
    entries.forEach((tx) => {
      assert.ok(tx.date >= start && tx.date <= end);
      assert.ok(tx.amount > 0);
      assert.ok(['income', 'expense'].includes(tx.type));
      assert.ok(tx.category.length > 0);
    });
  }

  // Demo data never includes dates after today.
  assert.ok(data.transactions.every((tx) => tx.date <= '2026-10-30'));
});

test('blocked storage does not break in-memory demo use', async () => {
  const store = createDemoStore({
    seed: SEED,
    storage: {
      getItem() {
        return null;
      },
      setItem() {
        throw new Error('QuotaExceededError');
      },
    },
  });

  await assert.rejects(
    () =>
      store.createTransaction({
        type: 'expense',
        amount: 10,
        category: 'Other',
        date: '2026-10-02',
      }),
    /could not be saved/i
  );
});
