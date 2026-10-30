/* =========================================================
   Ledger — application wiring
   Decides between the auth screen and the dashboard, owns the
   real/demo stores, and handles theme + sign-out.
   ========================================================= */

import { DEMO_ENABLED, PORTFOLIO_URL } from './config.js';
import { isConfigured, supabase } from './supabase.js';
import { createDemoStore, createSupabaseStore } from './store.js';
import { createAuth } from './auth.js';
import { createDashboard } from './dashboard.js';
import { $, $$, focusSoon, toast } from './ui.js';

const appView = document.getElementById('appView');
const bootScreen = document.getElementById('bootScreen');
const bootText = document.getElementById('bootText');
const signOutBtn = document.getElementById('signOutBtn');
const resetDemoBtn = document.getElementById('resetDemoBtn');
const demoSignupBtn = document.getElementById('demoSignupBtn');

const state = {
  mode: null, // 'remote' | 'demo' | null
  userId: null,
};

let demoStore = null;

/* =====================================================
   Dashboard + auth controllers
   ===================================================== */

const dashboard = createDashboard({
  onSessionExpired: handleSessionExpired,
});

const auth = createAuth({
  client: supabase,
  configured: isConfigured,
  demoEnabled: DEMO_ENABLED,
  redirectUrl: getRedirectUrl(),
  onSignedIn: (session) => enterRemote(session),
  onDemo: () => enterDemo(),
});

/* =====================================================
   View switching
   ===================================================== */

function markReady() {
  document.body.dataset.ready = 'true';
  if (bootScreen) bootScreen.hidden = true;
}

function showApp() {
  auth.hide();
  appView.hidden = false;
  markReady();
}

function showAuth({ message = '', mode = 'login', focusHeading = true } = {}) {
  if (state.mode) dashboard.stop();
  state.mode = null;
  state.userId = null;
  demoStore = null;

  appView.hidden = true;
  auth.show({ message, startMode: mode, focusHeading: focusHeading && !message });
  markReady();
}

function enterRemote(session) {
  if (!session?.user?.id || !supabase) return;

  // Idempotent: auth events and the promise resolution can both fire.
  if (state.mode === 'remote' && state.userId === session.user.id) return;

  state.mode = 'remote';
  state.userId = session.user.id;
  demoStore = null;

  showApp();
  dashboard.start(createSupabaseStore(supabase, session.user.id), session, { demo: false });
  focusSoon(document.getElementById('pageTitle'));
}

function enterDemo() {
  if (!DEMO_ENABLED) return;
  if (state.mode === 'demo' && demoStore) return;

  state.mode = 'demo';
  state.userId = null;
  demoStore = createDemoStore();

  showApp();
  dashboard.start(demoStore, null, { demo: true });
  focusSoon(document.getElementById('pageTitle'));
}

/* =====================================================
   Session lifecycle
   ===================================================== */

function handleSessionExpired(message) {
  if (state.mode !== 'remote') return;

  showAuth({
    message: message || 'Your session expired. Please log in again.',
    focusHeading: true,
  });

  // Clean up the stale token in the background.
  if (supabase) supabase.auth.signOut().catch(() => {});
}

async function handleSignOut() {
  if (state.mode === 'demo') {
    showAuth({
      message: 'Demo closed. Sign in or create an account to save your own records.',
    });
    return;
  }

  signOutBtn.disabled = true;
  try {
    if (supabase) await supabase.auth.signOut();
  } catch (error) {
    console.warn('Sign out request failed:', error);
  } finally {
    signOutBtn.disabled = false;
  }

  if (state.mode === 'remote') {
    showAuth({ message: 'You have been logged out.' });
  }
}

if (supabase) {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      if (state.mode === 'remote') showAuth({ message: 'You have been logged out.' });
      return;
    }

    // Arriving from an email confirmation link (or another tab).
    if (event === 'SIGNED_IN' && session?.user) {
      if (state.mode !== 'remote' && state.mode !== 'demo') {
        window.setTimeout(() => enterRemote(session), 0);
      }
    }
  });
}

/* =====================================================
   Demo controls
   ===================================================== */

function resetDemo() {
  if (!demoStore) return;

  try {
    demoStore.reset();
    toast('Sample data reset.');
    dashboard.reload();
  } catch (error) {
    toast(error?.message || 'Could not reset the demo data.', { type: 'error' });
  }
}

/* =====================================================
   Theme (shared localStorage key with the portfolio)
   ===================================================== */

function setupTheme() {
  const buttons = $$('[data-theme-toggle]');

  const isDark = () =>
    document.body.classList.contains('dark-mode') ||
    document.documentElement.classList.contains('dark-mode-init');

  const sync = () => {
    const dark = isDark();
    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    });
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const next = !isDark();
      document.body.classList.toggle('dark-mode', next);
      document.documentElement.classList.remove('dark-mode-init');

      try {
        localStorage.setItem('darkMode', next ? 'enabled' : 'disabled');
      } catch {
        /* The theme still works for this tab. */
      }

      sync();
      dashboard.setTheme();
    });
  });

  sync();
}

/* =====================================================
   Portfolio links
   ===================================================== */

function setupPortfolioLinks() {
  const footerLink = document.getElementById('portfolioLink');
  const credit = document.getElementById('portfolioCredit');
  const authBrand = document.querySelector('#authView .brand');

  if (!PORTFOLIO_URL) {
    if (footerLink) footerLink.hidden = true;
    if (credit) credit.hidden = true;
    if (authBrand) authBrand.setAttribute('aria-label', 'Ledger');
    return;
  }

  if (footerLink) footerLink.href = PORTFOLIO_URL;
  if (credit) {
    const link = credit.querySelector('a');
    if (link) link.href = PORTFOLIO_URL;
  }
  if (authBrand) authBrand.href = PORTFOLIO_URL;
}

/* =====================================================
   Boot
   ===================================================== */

function getRedirectUrl() {
  if (typeof window === 'undefined' || window.location.protocol === 'file:') return undefined;
  return `${window.location.origin}${window.location.pathname}`;
}

function demoRequested() {
  try {
    return new URLSearchParams(window.location.search).get('demo') === '1';
  } catch {
    return false;
  }
}

/** Read ?error_description=… or #error_description=… left by Supabase links. */
function readUrlFeedback() {
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const raw =
    params.get('error_description') ||
    hash.get('error_description') ||
    params.get('error') ||
    hash.get('error') ||
    '';

  if (!raw) return '';

  const message = String(raw).replace(/\+/g, ' ');

  try {
    const url = new URL(window.location.href);
    ['error', 'error_code', 'error_description'].forEach((key) => url.searchParams.delete(key));
    url.hash = '';
    window.history.replaceState(
      {},
      '',
      `${url.pathname}${url.searchParams.toString() ? `?${url.searchParams}` : ''}`
    );
  } catch {
    /* History can be unavailable in some embedded contexts. */
  }

  return message;
}

function showBootFailure(error) {
  if (bootScreen) bootScreen.hidden = false;
  if (bootText) bootText.textContent = 'ledger could not start.';

  const inner = bootScreen?.querySelector('.boot-inner');
  if (!inner) return;

  let note = inner.querySelector('.boot-failure');
  if (!note) {
    note = document.createElement('p');
    note.className = 'boot-note boot-failure';
    inner.append(note);
  }
  note.textContent = `${error?.message || 'Unknown error'} — reload the page. If this is a fresh copy, check README.md for the Supabase setup steps.`;
}

async function boot() {
  setupTheme();
  setupPortfolioLinks();

  signOutBtn.addEventListener('click', handleSignOut);
  if (resetDemoBtn) resetDemoBtn.addEventListener('click', resetDemo);
  if (demoSignupBtn) {
    demoSignupBtn.addEventListener('click', () => {
      showAuth({ mode: 'signup', focusHeading: true });
    });
  }

  const message = readUrlFeedback();

  if (!isConfigured) {
    if (demoRequested() && DEMO_ENABLED) enterDemo();
    else {
      auth.show({ message, startMode: 'login', focusHeading: false });
      markReady();
    }
    return;
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    if (data?.session) {
      enterRemote(data.session);
    } else if (demoRequested() && DEMO_ENABLED) {
      enterDemo();
    } else {
      auth.show({ message, startMode: 'login', focusHeading: false });
      markReady();
    }
  } catch (error) {
    console.error('Could not read the Supabase session:', error);
    if (demoRequested() && DEMO_ENABLED) {
      enterDemo();
    } else {
      auth.show({
        message: 'Could not reach Supabase. Check your connection — the demo still works offline.',
        startMode: 'login',
        focusHeading: false,
      });
      markReady();
    }
  }
}

boot().catch((error) => {
  console.error('Ledger failed to start:', error);
  showBootFailure(error);
});
