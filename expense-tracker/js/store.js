/* =========================================================
   Data access
   Two interchangeable stores with the same small interface:

     mode
     listTransactions(monthKey) -> Transaction[]
     createTransaction(input)   -> Transaction
     updateTransaction(id, input) -> Transaction
     deleteTransaction(id)      -> void
     getBudget(monthKey)        -> number | null
     setBudget(monthKey, amount)
     clearBudget(monthKey)

   createSupabaseStore talks to Postgres through PostgREST.
   createDemoStore keeps the same data in localStorage, so the
   whole UI can be explored without an account.
   ========================================================= */

import { isValidISODate, monthRange } from './format.js';
import { buildDemoData } from './demo-data.js';

export const DEMO_STORAGE_KEY = 'ledger.demo.v2';

const TRANSACTION_COLUMNS = 'id, type, amount, category, occurred_on, note, created_at';

export class StoreError extends Error {
  constructor(message, { code = null, status = null, cause = null } = {}) {
    super(message);
    this.name = 'StoreError';
    this.code = code;
    this.status = status;
    this.cause = cause;
    this.isAuthError =
      status === 401 ||
      code === 'PGRST301' ||
      code === 'PGRST303' ||
      /jwt expired|invalid claim|not authenticated/i.test(message);
  }
}

function normalizeInput(input = {}) {
  const type = input.type === 'income' ? 'income' : 'expense';
  const amount = Number(input.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new StoreError('Enter an amount greater than zero.');
  }
  if (amount > 999999999.99) {
    throw new StoreError('That amount is too large.');
  }

  const category = String(input.category ?? '').trim();
  if (!category) throw new StoreError('Choose a category.');
  if (category.length > 40) throw new StoreError('Keep the category under 40 characters.');

  const date = String(input.date ?? '');
  if (!isValidISODate(date)) throw new StoreError('Choose a valid date.');

  const note = String(input.note ?? '').trim();
  if (note.length > 200) throw new StoreError('Keep the note under 200 characters.');

  return {
    type,
    amount: Math.round(amount * 100) / 100,
    category,
    date,
    note,
  };
}

function fromRow(row) {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    category: row.category,
    date: row.occurred_on,
    note: row.note || '',
    createdAt: row.created_at || '',
  };
}

function toRow(input) {
  const normalized = normalizeInput(input);
  return {
    type: normalized.type,
    amount: normalized.amount,
    category: normalized.category,
    occurred_on: normalized.date,
    note: normalized.note,
  };
}

function sortTransactions(list) {
  return list.slice().sort((a, b) => {
    const byDate = String(b.date).localeCompare(String(a.date));
    if (byDate !== 0) return byDate;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
}

function describeDatabaseError(error) {
  if (!error) return 'Something went wrong. Please try again.';

  if (
    error.status === 401 ||
    error.code === 'PGRST301' ||
    error.code === 'PGRST303' ||
    /jwt expired|invalid claim|not authenticated/i.test(error.message || '')
  ) {
    return 'Your session has expired. Please log in again.';
  }

  if (error.status === 403 || error.code === '42501') {
    return 'You do not have permission to change that entry.';
  }

  if (/failed to fetch|networkerror|load failed|fetch failed/i.test(error.message || '')) {
    return 'Could not reach the server. Check your connection and try again.';
  }

  if (error.code === 'PGRST116') {
    return 'That entry no longer exists.';
  }

  return error.message || 'Something went wrong. Please try again.';
}

function raise(error, fallback) {
  throw new StoreError(describeDatabaseError(error) || fallback, {
    code: error?.code ?? null,
    status: error?.status ?? null,
    cause: error,
  });
}

/* =========================================================
   Supabase store
   ========================================================= */

export function createSupabaseStore(client, userId) {
  if (!client) throw new Error('A Supabase client is required.');
  if (!userId) throw new Error('A signed-in user is required.');

  return {
    mode: 'remote',

    async listTransactions(monthKey) {
      const { start, end } = monthRange(monthKey);
      const { data, error } = await client
        .from('transactions')
        .select(TRANSACTION_COLUMNS)
        .gte('occurred_on', start)
        .lte('occurred_on', end)
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) raise(error, 'Could not load your transactions.');
      return (data || []).map(fromRow);
    },

    async createTransaction(input) {
      const { data, error } = await client
        .from('transactions')
        .insert(toRow(input))
        .select(TRANSACTION_COLUMNS)
        .single();

      if (error) raise(error, 'Could not save that transaction.');
      return fromRow(data);
    },

    async updateTransaction(id, input) {
      const { data, error } = await client
        .from('transactions')
        .update(toRow(input))
        .eq('id', id)
        .select(TRANSACTION_COLUMNS)
        .maybeSingle();

      if (error) raise(error, 'Could not update that transaction.');
      if (!data) throw new StoreError('That transaction no longer exists.');
      return fromRow(data);
    },

    async deleteTransaction(id) {
      const { error, count } = await client
        .from('transactions')
        .delete({ count: 'exact' })
        .eq('id', id);

      if (error) raise(error, 'Could not delete that transaction.');
      if (count === 0) throw new StoreError('That transaction no longer exists.');
    },

    async getBudget(monthKey) {
      const { data, error } = await client
        .from('budgets')
        .select('amount')
        .eq('month', `${monthKey}-01`)
        .maybeSingle();

      if (error) raise(error, 'Could not load your budget.');
      return data ? Number(data.amount) : null;
    },

    async setBudget(monthKey, amount) {
      const { error } = await client.from('budgets').upsert(
        {
          // RLS also verifies this matches auth.uid().
          user_id: userId,
          month: `${monthKey}-01`,
          amount: Math.round(Number(amount) * 100) / 100,
        },
        { onConflict: 'user_id,month' }
      );

      if (error) raise(error, 'Could not save your budget.');
    },

    async clearBudget(monthKey) {
      const { error } = await client
        .from('budgets')
        .delete()
        .eq('month', `${monthKey}-01`);

      if (error) raise(error, 'Could not remove your budget.');
    },
  };
}

/* =========================================================
   Demo store (localStorage)
   ========================================================= */

function defaultStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isValidState(value) {
  return (
    value &&
    Array.isArray(value.transactions) &&
    value.budgets &&
    typeof value.budgets === 'object' &&
    !Array.isArray(value.budgets)
  );
}

export function createDemoStore({ storage, now = new Date(), seed } = {}) {
  const storageRef = storage === undefined ? defaultStorage() : storage;
  const initialState = seed ? clone(seed) : buildDemoData(now);

  function read() {
    if (!storageRef) return null;
    try {
      const raw = storageRef.getItem(DEMO_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return isValidState(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  let state = read() || clone(initialState);

  function persist() {
    if (!storageRef) return;
    try {
      storageRef.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
    } catch {
      throw new StoreError(
        'Demo data could not be saved in this browser. Private mode may block storage.'
      );
    }
  }

  // Best-effort initial save; the demo still works in memory if storage is blocked.
  try {
    persist();
  } catch {
    /* ignored on purpose */
  }

  return {
    mode: 'demo',

    async listTransactions(monthKey) {
      return sortTransactions(state.transactions.filter((tx) => tx.date.slice(0, 7) === monthKey));
    },

    async createTransaction(input) {
      const normalized = normalizeInput(input);
      const date = normalized.date;
      const transaction = {
        id:
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        ...normalized,
        createdAt: new Date().toISOString(),
      };
      state.transactions.push(transaction);
      try {
        persist();
      } catch (error) {
        state.transactions.pop();
        throw error;
      }
      return { ...transaction, date };
    },

    async updateTransaction(id, input) {
      const index = state.transactions.findIndex((tx) => tx.id === id);
      if (index === -1) throw new StoreError('That transaction no longer exists.');

      const normalized = normalizeInput(input);
      const previous = state.transactions[index];
      state.transactions[index] = {
        ...previous,
        ...normalized,
      };
      try {
        persist();
      } catch (error) {
        state.transactions[index] = previous;
        throw error;
      }
      return { ...state.transactions[index] };
    },

    async deleteTransaction(id) {
      const next = state.transactions.filter((tx) => tx.id !== id);
      if (next.length === state.transactions.length) {
        throw new StoreError('That transaction no longer exists.');
      }
      const previous = state.transactions;
      state.transactions = next;
      try {
        persist();
      } catch (error) {
        state.transactions = previous;
        throw error;
      }
    },

    async getBudget(monthKey) {
      const amount = state.budgets[monthKey];
      return typeof amount === 'number' ? amount : null;
    },

    async setBudget(monthKey, amount) {
      const number = Number(amount);
      if (!Number.isFinite(number) || number <= 0) {
        throw new StoreError('Enter a budget greater than zero.');
      }
      const hadBudget = Object.prototype.hasOwnProperty.call(state.budgets, monthKey);
      const previous = state.budgets[monthKey];
      state.budgets[monthKey] = Math.round(number * 100) / 100;
      try {
        persist();
      } catch (error) {
        if (hadBudget) state.budgets[monthKey] = previous;
        else delete state.budgets[monthKey];
        throw error;
      }
    },

    async clearBudget(monthKey) {
      const hadBudget = Object.prototype.hasOwnProperty.call(state.budgets, monthKey);
      const previous = state.budgets[monthKey];
      delete state.budgets[monthKey];
      try {
        persist();
      } catch (error) {
        if (hadBudget) state.budgets[monthKey] = previous;
        throw error;
      }
    },

    /** Restore the original sample data (used by "Reset sample data"). */
    reset() {
      const previous = state;
      state = seed ? clone(seed) : buildDemoData(new Date());
      try {
        persist();
      } catch (error) {
        state = previous;
        throw error;
      }
    },

    /** Read-only snapshot, handy for tests and debugging. */
    snapshot() {
      return clone(state);
    },
  };
}
