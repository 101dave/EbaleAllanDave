/* =========================================================
   Ledger — configuration
   =========================================================
   Fill these two values in with the ones from your Supabase
   project: Dashboard → Project Settings → API.

   Safe to commit: the publishable (anon) key is designed to
   be shipped to browsers. Row Level Security in
   sql/schema.sql decides which rows it may read or write.

   NEVER put a service_role / secret key here. Those bypass
   Row Level Security and must stay on a server.
   ========================================================= */

export const SUPABASE_URL = 'https://mexckxbopmgmklusegwo.supabase.co';

// Publishable key (the newer name for the anon key).
export const SUPABASE_ANON_KEY = 'sb_publishable_darDcvAXKLgfD-LXY929jQ_4PFpf03t';

/* ---------- Display ---------- */

// ISO 4217 currency code + BCP-47 locale used by Intl.NumberFormat.
// Examples: 'PHP' + 'en-PH', 'USD' + 'en-US', 'EUR' + 'de-DE'.
export const CURRENCY = 'PHP';
export const LOCALE = 'en-PH';

/* ---------- Demo mode ---------- */

// Set to false to hide the "Explore the demo" button entirely.
export const DEMO_ENABLED = true;

/* ---------- Portfolio link ---------- */

// Shown in the footer (and used when someone leaves the demo).
// Set to '' if you deploy this folder on its own and the link
// would 404.
export const PORTFOLIO_URL = '../PROJECTS.html';
