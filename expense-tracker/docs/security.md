# Security notes

This document describes what protects a user's rows, what was verified against the live database, and the risks that remain. It is the companion to [`sql/schema.sql`](../sql/schema.sql) and [`architecture.md`](architecture.md).

## Assets and trust boundaries

| Asset | Where it lives | Who may see it |
| --- | --- | --- |
| Transactions and budgets | Supabase Postgres, `public.transactions` / `public.budgets` | the owning user only, enforced by RLS |
| Session access/refresh tokens | browser `localStorage` under `ledger.auth` | that browser origin |
| Supabase URL + publishable key | `js/config.js`, shipped to every visitor | public by design |
| Service-role/secret key | nowhere in this repository | server-side only |
| Demo transactions | browser `localStorage` under `ledger.demo.v2` | that browser only |

The only trust boundary that matters for row data is inside Postgres. The client cannot be trusted to filter by user, so it does not get the choice: policies compare the row's `user_id` with `auth.uid()` from the verified JWT.

## Schema protections

- `transactions.user_id` and `budgets.user_id` are `not null`, default to `auth.uid()`, and reference `auth.users(id) on delete cascade` — deleting an account removes its financial rows.
- `type` is restricted to `income | expense`; `amount` must be positive and ≤ 999,999,999.99; `category` is 1–40 characters after trimming; `note` is ≤ 200 characters; `occurred_on` is bounded to 2000–2100.
- `budgets` is keyed by `(user_id, month)` with a check that `month` is the first day of a month, so a user has at most one budget per month.
- `transactions_user_date_idx` supports the dashboard's per-user date-range query.
- Both tables have `before update` triggers that set `updated_at = now()`.

The SQL checks are defence in depth: the browser also validates and normalises, but a crafted request that bypasses the UI still has to satisfy the same constraints.

## Row Level Security matrix

RLS is enabled on both tables. The `anon` role has **no** table privileges (explicitly revoked), and `authenticated` receives `select, insert, update, delete`.

| Table | Operation | Policy | Rule |
| --- | --- | --- | --- |
| `transactions` | SELECT | `transactions_select_own` | `using ((select auth.uid()) = user_id)` |
| `transactions` | INSERT | `transactions_insert_own` | `with check ((select auth.uid()) = user_id)` |
| `transactions` | UPDATE | `transactions_update_own` | `using` and `with check` both compare `auth.uid()` |
| `transactions` | DELETE | `transactions_delete_own` | `using ((select auth.uid()) = user_id)` |
| `budgets` | SELECT | `budgets_select_own` | `using ((select auth.uid()) = user_id)` |
| `budgets` | INSERT | `budgets_insert_own` | `with check ((select auth.uid()) = user_id)` |
| `budgets` | UPDATE | `budgets_update_own` | `using` and `with check` both compare `auth.uid()` |
| `budgets` | DELETE | `budgets_delete_own` | `using ((select auth.uid()) = user_id)` |

`auth.uid()` is wrapped in `(select …)` so Postgres can evaluate it once per statement instead of once per row. The update policies repeat the predicate in `with check`; without it, a user could move their own row's `user_id` to somebody else's id.

The app's Supabase store does not append `user_id` filters to its queries. That is intentional: filtering in PostgREST would be a convention, while RLS is the enforced boundary. Inserts omit `user_id` entirely and let the default supply it.

## What was verified on the live project

The schema was applied to project `mexckxbopmgmklusegwo` and exercised with two temporary users (A and B) by impersonating `authenticated` requests:

```sql
begin;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '<user-uuid>', 'role', 'authenticated')::text,
  true
);
-- run selects / inserts / updates / deletes here
rollback;
```

| Check | Result |
| --- | --- |
| A selects transactions | sees only A's rows |
| B selects transactions | does not see A's rows |
| B updates A's row | 0 rows affected |
| B deletes A's row | 0 rows affected |
| B inserts with `user_id = A` | rejected by RLS (`42501`) |
| Insert without `user_id` | row is stored with `auth.uid()` |
| Update a row | `updated_at` changes via trigger |
| Budget upsert as A | one row per month; B sees nothing and cannot modify it |
| `anon` selects either table | `42501 permission denied` (privilege revoked, not just RLS) |

The two test users and all their rows were deleted after verification; a count of `public.transactions`, `public.budgets` and the test rows in `auth.users` returned zero.

These tests prove the database boundary. They do not replace a browser end-to-end auth test, which needs a real email-confirmation round trip; do that once after deployment.

## Key handling

`js/config.js` holds `SUPABASE_URL` and `SUPABASE_ANON_KEY` (the publishable key, `sb_publishable_…`). Both are safe to commit and ship:

- the URL identifies the project;
- the publishable key identifies the client and is constrained by RLS;
- the **secret/service-role key is never present** in this directory. It bypasses RLS and must stay on a server.

The app also checks for missing/placeholder configuration at startup and refuses to make requests when the URL or key is absent, rather than failing with a cryptic error.

Search the folder before publishing:

```bash
grep -RIn "service_role\|sb_secret" expense-tracker/js expense-tracker/index.html
```

The only expected match is the warning comment in `js/config.js`; there must be no key assignment or secret value.

## Auth configuration

The bundled project is configured as follows:

| Setting | Value | Why |
| --- | --- | --- |
| Email provider | enabled | only sign-in method |
| Email confirmation | required | prevents unverified addresses from signing in |
| Site URL | `https://101dave.github.io/EbaleAllanDave/expense-tracker/` | fallback confirmation destination |
| Redirect allow-list | localhost:8000, 127.0.0.1:8000, localhost:3000, `https://*.vercel.app/**`, the GitHub Pages app path | the app sends `emailRedirectTo`; Supabase only honours allow-listed URLs |
| Password minimum | 6 (server), 8 (client) | Supabase default plus a stricter client rule |
| JWT expiry | 3600 s, refresh rotation on | normal Supabase session lifetime |
| Sign-ups | enabled | portfolio visitors can create an account |

`getRedirectUrl()` in `js/app.js` uses the current origin and pathname, so the same build works locally, on Vercel and under the GitHub Pages subpath, as long as each origin is allow-listed. An unlisted origin will fall back to the Site URL rather than redirecting somewhere arbitrary.

## Session and error handling

- `supabase-js` persists the session (`persistSession: true`), refreshes it (`autoRefreshToken: true`) and detects token fragments in the URL after email confirmation (`detectSessionInUrl: true`).
- `StoreError.isAuthError` recognises HTTP 401, `PGRST301`, `PGRST303` and JWT-expired messages. The dashboard then calls `onSessionExpired`, which shows the auth screen with an explanation and clears the stale session in the background.
- Failed requests show a friendly inline message and a toast; they do not expose stack traces or raw SQL.
- Sign-out clears the Supabase session and returns to the auth screen. In demo mode it simply closes the local workspace.

## Threat model and residual risks

| Threat | Mitigation | Remaining risk |
| --- | --- | --- |
| One user reads another's rows | RLS on every command; `anon` has no grants | misconfigured policy in a future migration; test after schema changes |
| Forged `user_id` on insert | column default + `with check` | none found in testing |
| Leaked publishable key | RLS is the boundary; no secret ships | key abuse is limited to allowed operations, but auth endpoints can still be probed |
| XSS stealing the session | user strings rendered with `textContent`/DOM APIs; no `eval` | a future DOM sink could read `localStorage`; add a CSP at the host |
| Supply-chain compromise | pinned CDN versions (`supabase-js@2.57.4`, `chart.js@4.4.7`) | no SRI hashes; self-host or add SRI before a high-stakes deployment |
| Email abuse / enumeration | Supabase rate limits and confirmation requirement | no CAPTCHA configured; tune Supabase limits and enable captcha for a public launch |
| Brute force | Supabase auth rate limits, 8-character client minimum | no MFA UI; enable TOTP in Supabase and build screens if needed |
| CSRF | API calls use a bearer token, not ambient cookies | no cookie-based session to forge |
| SQL injection | PostgREST uses parameterised queries; no raw SQL in the client | none known |
| Demo data exposure | localStorage only, clearly labelled as sample | not private storage; do not enter real financial data in demo mode |
| Account deletion | `on delete cascade` from `auth.users` | no in-app delete-account screen; do it from the Supabase dashboard or add an RPC |
| Lost password | Supabase support exists | no reset screen in this app; add `resetPasswordForEmail` + update-password UI |

There is no Content Security Policy in the static files because headers are host-dependent. On Vercel or Netlify, add a header policy that allows the Supabase project origin, `cdn.jsdelivr.net`, `fonts.googleapis.com` and `fonts.gstatic.com`, and restricts `script-src`/`connect-src` accordingly.

## Deployment checklist

- [ ] `sql/schema.sql` applied to the production project, with RLS enabled on both tables.
- [ ] `js/config.js` points at the production URL and contains only the publishable key.
- [ ] `grep -RIn "service_role\|sb_secret" expense-tracker/js expense-tracker/index.html` returns only the warning comment.
- [ ] Supabase **Site URL** and **Redirect URLs** include the production origin and path.
- [ ] Email confirmation policy matches the intended onboarding flow.
- [ ] Password minimum length is 8 (or higher) in Supabase, matching the client hint.
- [ ] RLS smoke test with two accounts (one cannot read or change the other's rows).
- [ ] No test users or sample rows remain in production tables.
- [ ] `?demo=1` works and the demo banner is visible.
- [ ] Sign-up → confirmation email → login → add a transaction → sign out → sign in again.
- [ ] A CSP and other security headers are configured at the host if available.
