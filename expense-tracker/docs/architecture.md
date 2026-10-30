# Architecture notes

Ledger is deliberately small: one HTML document, one stylesheet, eleven ES modules, two SQL tables. This note explains how the pieces fit together, the decisions behind them, and how the app is tested.

## System shape

```text
┌──────────────────────────── browser ────────────────────────────┐
│  index.html                                                     │
│    ├─ css/styles.css                                            │
│    ├─ Chart.js (UMD, CDN)          window.Chart                 │
│    ├─ import map → supabase-js     @supabase/supabase-js        │
│    └─ js/app.js  ───────────────────────────────────────────┐   │
│         ├─ supabase.js (client / null)                      │   │
│         ├─ auth.js     login + signup panel                 │   │
│         ├─ dashboard.js  views, dialogs, filters, chart      │   │
│         ├─ store.js                                      │   │
│         │    ├─ createSupabaseStore  ─────────────────────┼───┼──► PostgREST ─┐
│         │    └─ createDemoStore     localStorage         │   │               │
│         └─ ui.js / format.js / categories.js / chart.js  │   │               │
└──────────────────────────────────────────────────────────────┘               │
                                                                                ▼
                                                               Supabase Auth + PostgreSQL
                                                               RLS on public.transactions
                                                               RLS on public.budgets
```

There is no app server and no API layer of our own. The browser talks to Supabase over HTTPS with the publishable key; Postgres policies, not client code, enforce ownership.

## Boot and view state

`js/app.js` owns a tiny state machine:

```text
boot()
  ├─ theme + portfolio links + event wiring
  ├─ read ?error_description / ?error feedback from email links
  ├─ no Supabase config?  ──► auth screen (setup notice)   [demo=1 → demo]
  ├─ getSession()
  │    ├─ session?        ──► enterRemote(session)
  │    ├─ ?demo=1         ──► enterDemo()
  │    └─ no session      ──► auth screen
  └─ getSession() throws  ──► auth screen with “demo still works” message
```

`state.mode` is `'remote'`, `'demo'` or `null`. Both entry functions are idempotent because `onAuthStateChange` and the initial `getSession()` promise can resolve in either order. `showAuth()` always calls `dashboard.stop()` first, which unsubscribes, destroys the chart and clears visible data. `body[data-ready="true"]` hides the boot screen; if module loading fails, the `boot().catch` path writes the error into the boot screen instead of leaving a blank page.

Theme is applied before first paint by a small inline script in `index.html`: it reads the shared `darkMode` key and adds `html.dark-mode-init`, which the CSS uses as a dark-token trigger. The toggle then switches to `body.dark-mode`, clears the init flag and persists the choice. This avoids a flash of light UI and shares the theme with the rest of the portfolio.

## Module responsibilities

| Module | Owns | Does not own |
| --- | --- | --- |
| `config.js` | URL/key, currency/locale, demo flag, portfolio link | secrets or environment logic |
| `supabase.js` | `isConfigured`, one client instance, auth storage key | UI or data shaping |
| `app.js` | session routing, sign-out, theme, demo entry, boot failure | DOM inside the dashboard |
| `auth.js` | login/signup tabs, client-side validation, feedback, password reveal | sessions or redirects after success |
| `dashboard.js` | month/filters state, stats, budget UI, table, dialogs, chart calls | persistence details |
| `store.js` | Supabase and demo implementations of one interface | rendering |
| `format.js` | money/percent formatting, UTC-safe date helpers, amount parsing | validation messages |
| `chart.js` | Chart.js instance lifecycle and dataset colors | totals or legend markup |
| `categories.js` | category names + chart token names | user data |
| `demo-data.js` | deterministic sample months relative to "now" | persistence |
| `ui.js` | selectors, dialogs, toasts, errors, focus, announcements | business rules |

The dependency direction is one-way: `app` → (`auth`, `dashboard`) → (`store`, `ui`, `format`, `categories`); `dashboard` → `chart`. Nothing imports `app`.

## The store contract

Both stores implement:

```js
listTransactions(monthKey)      // Transaction[]
createTransaction(input)        // Transaction
updateTransaction(id, input)    // Transaction
deleteTransaction(id)           // void
getBudget(monthKey)             // number | null
setBudget(monthKey, amount)     // void
clearBudget(monthKey)           // void
```

`Transaction` is `{ id, type, amount, category, date, note, createdAt }`, with `date` as `YYYY-MM-DD`. `store.js` maps this to `occurred_on` in Postgres and back. Normalisation (positive amount, category length, note length, valid calendar date, rounding to cents) happens once in `normalizeInput`, so both implementations reject the same input.

The Supabase store never filters by `user_id` in queries: RLS already limits every read and write to the signed-in user. Inserts omit `user_id`, letting the column default `auth.uid()` fill it. Failures are translated into `StoreError` messages, and `isAuthError` is how the dashboard recognises an expired session and asks `app.js` to sign out. `.maybeSingle()` is used for updates and budgets so "no row" is a first-class result instead of a PostgREST error; deletes request an exact count so deleting an already-removed row is reported.

The demo store uses the same shape over `localStorage` (`ledger.demo.v2`). Reads and writes clone plain objects so no UI code can mutate the store's state by reference. Every mutation first updates the in-memory copy and then persists; if persistence throws (quota, privacy mode), the in-memory change is rolled back so the UI and storage cannot drift. Invalid or missing stored state falls back to a fresh seed.

## Rendering and interaction

`dashboard.js` keeps one source of truth for a month: `transactions`, `budget`, `totals`, `filters`, `month`, plus dialog-only state (`editingId`, `deletingId`). A mutation follows a simple loop: validate → call the store → reload the month → re-render everything that depends on it. There is no optimistic rendering, so a failed request never leaves a phantom row.

- **Month navigation** uses `<input type="month">` plus previous/next buttons. Page text spells the month out ("October 2026 at a glance"), because the native control renders differently across browsers.
- **Stats and budget** are derived from the loaded month, not accumulated across navigation.
- **Filters** are client-side: the month is fetched once and type/category filtering happens in memory. The count updates, and a distinct "no matches" state appears only when data exists but the filter excludes it.
- **The table** is a real `<table>` on desktop and becomes a stacked list of labelled cards at 640px using `td[data-col]` labels; the DOM and semantics stay the same.
- **Dialogs** are native `<dialog>` elements with forms. Opening resets errors and fills defaults, `showModal()` provides the focus trap and Escape handling, and close returns focus to the trigger. The body is scroll-locked with `body:has(dialog[open])`.
- **Toasts** live in one polite region. Errors also appear inline near the action and move focus to the alert, so a screen reader announces the problem in context rather than only in a corner.
- **The chart** is created once per month render and destroyed before re-creation to avoid leaks. If Chart.js failed to load, the chart area switches to a styled text fallback instead of an empty canvas. The legend is generated from the same values as the dataset, so the canvas is never the only way to read the data.

## Dates and money

Dates are the subtle part of a finance UI. The app stores and compares `YYYY-MM-DD` strings, and every helper in `format.js` uses `Date.UTC` so a browser in UTC+8 cannot shift a date backwards when parsing or formatting. `monthRange(monthKey)` returns the first and last ISO dates of a month without constructing a local midnight. The default date for a new transaction comes from the local calendar date, which is what a user expects when they open the app.

Amounts are parsed by `parseAmount`, which accepts a currency prefix and thousands separators but rejects signs and parentheses *before* stripping the prefix. That guard matters: without it, `-5` silently became `5`. Values are rounded to two decimals for storage; display uses `Intl.NumberFormat` with no cents for summary figures and two decimals for table rows.

## Demo-mode parity

Demo mode is not a mock of the UI. It swaps the store at the same seam the real app uses, so filters, charts, validation, dialogs, persistence and reset all exercise production code. The seed builds three months relative to today: the current month clipped to today, a previous month with a budget and a month before that without one. That guarantees the empty-budget and over/under-budget states are reachable from a fresh visitor session without any network.

The tradeoff is that demo data is per-browser and unencrypted; it is explained in the banner and never presented as an account.

## Security boundaries

`config.js` contains a **publishable** key. That key is an identifier, not a secret: it can only do what RLS allows. There is no service-role key, no database password and no server secret anywhere in the frontend. The client stores its own session in `localStorage` under `ledger.auth`, uses Supabase's refresh rotation, and treats 401/PGRST301 responses as an expired session.

User-controlled strings are inserted with `textContent` or DOM APIs, never `innerHTML`. (The only `innerHTML` use is in `ui.js`, which saves and restores a button's own trusted loading label.) The main residual risks are the usual ones for a static SPA: an XSS bug anywhere in the origin could read the session token, and Supabase's public auth endpoints are subject to its rate limits. The full policy matrix and live verification are in [`security.md`](security.md).

## Testing layers

1. **Unit tests (shipped).** `node --test` runs formatting and demo-store tests with no browser or network. The demo store accepts injected `storage`/`now`/`seed`, which makes persistence failure and rollback deterministic.
2. **DOM-flow tests (development harness).** jsdom rendered the real document and module graph with a stubbed Supabase client and Chart.js; 14 checks covered the flows that pure functions cannot.
3. **Real-browser tests (development harness).** Chromium against a local static server, with CDN requests fulfilled from local copies and a stubbed Supabase module. 40 checks covered add/edit/delete, reload persistence, budget, filters, empty states, theme, validation, focus, mobile layout and scroll lock.
4. **Accessibility.** axe-core with WCAG 2.1 A/AA rules ran in Chromium against the auth screen, dashboard, empty month and transaction dialog, in light and dark themes: zero violations. The real-browser run caught muted text at 3.4:1 and a scrollable legend without keyboard access, both now fixed. Only canvas-adjacent and native-select contrast checks remain "incomplete" because their background cannot be resolved automatically.
5. **Database security.** RLS was exercised as two impersonated `authenticated` roles, plus `anon`, directly in Postgres. The test users and rows were deleted afterwards.

The harnesses were intentionally kept out of the repository: they need Node packages and, for the browser layer, a Chromium build. The shipped suite stays dependency-free. A real Supabase auth round-trip cannot run in the build sandbox because outbound network access to Supabase is blocked; that path is verified by the SQL-level auth simulation and should be smoke-tested in a browser after deployment.

## Deliberate non-goals

No router, client-state library, component framework, CSS preprocessor, bundler, service worker or backend-for-frontend. Every one of those would be justifiable in a larger product, but here the whole point is to show a clear, readable, framework-free implementation with a security boundary that holds.
