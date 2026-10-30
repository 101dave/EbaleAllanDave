-- =========================================================
-- Ledger — personal expense tracker
-- Schema + Row Level Security for Supabase (PostgreSQL)
--
-- Run this once in the Supabase SQL Editor (Dashboard → SQL
-- Editor → paste → Run), or apply it with the Supabase CLI:
--   supabase db push
--
-- The script is safe to re-run: it only creates objects when
-- they do not exist and recreates policies/triggers by name.
-- =========================================================

-- ---------------------------------------------------------
-- Tables
-- ---------------------------------------------------------

create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid()
                references auth.users (id) on delete cascade,
  type        text not null
                check (type in ('income', 'expense')),
  amount      numeric(12, 2) not null
                check (amount > 0 and amount <= 999999999.99),
  category    text not null
                check (char_length(btrim(category)) between 1 and 40),
  occurred_on date not null
                check (occurred_on between date '2000-01-01' and date '2100-12-31'),
  note        text not null default ''
                check (char_length(note) <= 200),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.transactions is
  'Income and expense entries. One row per transaction, owned by auth.users.id.';

create table if not exists public.budgets (
  user_id     uuid not null default auth.uid()
                references auth.users (id) on delete cascade,
  month       date not null
                check (month = date_trunc('month', month)::date),
  amount      numeric(12, 2) not null
                check (amount >= 0 and amount <= 999999999.99),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, month)
);

comment on table public.budgets is
  'One optional monthly spending budget per user. month is always the first day of the month.';

-- Speeds up the dashboard query (user + month range, newest first).
create index if not exists transactions_user_date_idx
  on public.transactions (user_id, occurred_on desc, created_at desc);

-- ---------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

drop trigger if exists budgets_set_updated_at on public.budgets;
create trigger budgets_set_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- Row Level Security
--
-- Every policy compares the row's user_id with auth.uid(),
-- which is the id of the signed-in user in the request's JWT.
-- The anon role gets no table privileges at all, so even a
-- leaked publishable key cannot read anybody's rows.
-- ---------------------------------------------------------

alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

revoke all on table public.transactions from anon;
revoke all on table public.budgets from anon;

grant select, insert, update, delete on table public.transactions to authenticated;
grant select, insert, update, delete on table public.budgets to authenticated;

-- transactions -------------------------------------------------

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own"
  on public.transactions for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own"
  on public.transactions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own"
  on public.transactions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own"
  on public.transactions for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- budgets ------------------------------------------------------

drop policy if exists "budgets_select_own" on public.budgets;
create policy "budgets_select_own"
  on public.budgets for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "budgets_insert_own" on public.budgets;
create policy "budgets_insert_own"
  on public.budgets for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "budgets_update_own" on public.budgets;
create policy "budgets_update_own"
  on public.budgets for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "budgets_delete_own" on public.budgets;
create policy "budgets_delete_own"
  on public.budgets for delete
  to authenticated
  using ((select auth.uid()) = user_id);
