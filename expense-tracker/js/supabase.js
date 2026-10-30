/* =========================================================
   Supabase client (browser only)
   The publishable/anon key is safe to ship; Row Level Security
   is what protects the data. Never add a service_role key here.
   ========================================================= */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config.js';

const url = String(SUPABASE_URL || '').trim();
const key = String(SUPABASE_ANON_KEY || '').trim();

/**
 * A quick sanity check so the UI can explain what is missing
 * instead of failing with a cryptic network error.
 */
export const isConfigured =
  Boolean(url && key) &&
  /^https?:\/\//i.test(url) &&
  !/YOUR_|your-project|example\.com/i.test(`${url} ${key}`) &&
  key.length > 20;

export const supabase = isConfigured
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'ledger.auth',
      },
    })
  : null;
