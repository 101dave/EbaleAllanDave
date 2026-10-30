/* =========================================================
   Authentication screen
   Log in, sign up, and the entry point to demo mode.
   ========================================================= */

import {
  $,
  $$,
  clearErrors,
  clearFormAlert,
  focusSoon,
  setBusy,
  setFieldError,
  showFormAlert,
} from './ui.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Turn Supabase's technical errors into something a person can act on. */
export function friendlyAuthError(error) {
  const message = String(error?.message || '');

  if (/invalid login credentials/i.test(message)) {
    return 'Email or password is incorrect.';
  }
  if (/email not confirmed/i.test(message)) {
    return 'Please confirm your email address first — check your inbox for the link.';
  }
  if (/user already registered|already been registered|already exists/i.test(message)) {
    return 'An account with that email already exists. Try logging in instead.';
  }
  if (/password should be at least|password is too short/i.test(message)) {
    return 'Choose a password with at least 8 characters.';
  }
  if (/rate limit|too many requests|email rate/i.test(message)) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (/valid email|invalid email/i.test(message)) {
    return 'Enter a valid email address.';
  }
  if (/signups? (are )?disabled|signup is disabled/i.test(message)) {
    return 'Sign-ups are disabled for this project. Use the demo instead.';
  }
  if (/failed to fetch|networkerror|load failed|fetch failed/i.test(message)) {
    return 'Could not reach Supabase. Check your connection and try again.';
  }
  if (/database error/i.test(message)) {
    return 'The account could not be created. Please try again in a moment.';
  }

  return message || 'Something went wrong. Please try again.';
}

export function createAuth({
  client,
  configured,
  demoEnabled,
  redirectUrl,
  onSignedIn,
  onDemo,
}) {
  const view = document.getElementById('authView');
  const heading = document.getElementById('authHeadline');
  const setupNotice = document.getElementById('setupNotice');
  const setupDemoBtn = document.getElementById('setupDemoBtn');
  const authForms = document.getElementById('authForms');
  const tabList = $('.tabs[role="tablist"]', view);
  const tabs = $$('[data-auth-tab]', view);
  const panels = {
    login: document.getElementById('panelLogin'),
    signup: document.getElementById('panelSignup'),
  };

  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const signupEmail = document.getElementById('signupEmail');
  const signupPassword = document.getElementById('signupPassword');
  const signupConfirm = document.getElementById('signupConfirm');

  const loginError = document.getElementById('loginError');
  const signupError = document.getElementById('signupError');
  const loginEmailError = document.getElementById('loginEmailError');
  const loginPasswordError = document.getElementById('loginPasswordError');
  const signupEmailError = document.getElementById('signupEmailError');
  const signupPasswordError = document.getElementById('signupPasswordError');
  const signupConfirmError = document.getElementById('signupConfirmError');

  const loginSubmit = document.getElementById('loginSubmit');
  const signupSubmit = document.getElementById('signupSubmit');
  const demoBtn = document.getElementById('demoBtn');
  const backToLoginBtn = document.getElementById('backToLoginBtn');
  const successPanel = document.getElementById('authSuccess');
  const successText = document.getElementById('authSuccessText');

  let mode = 'login';

  /* ---------- Setup / demo availability ---------- */

  if (!configured) {
    setupNotice.hidden = false;
    authForms.hidden = true;
  }

  if (!demoEnabled) {
    demoBtn.hidden = true;
    if (setupDemoBtn) setupDemoBtn.hidden = true;
  }

  if (setupDemoBtn) {
    setupDemoBtn.addEventListener('click', () => onDemo());
  }

  /* ---------- Tabs ---------- */

  function setMode(next, { focusTab = false } = {}) {
    mode = next === 'signup' ? 'signup' : 'login';

    tabs.forEach((tab) => {
      const isActive = tab.dataset.authTab === mode;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
      panels[tab.dataset.authTab].hidden = !isActive;
    });

    if (focusTab) {
      const activeTab = tabs.find((tab) => tab.dataset.authTab === mode);
      if (activeTab) activeTab.focus();
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => setMode(tab.dataset.authTab));
  });

  tabList.addEventListener('keydown', (event) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    event.preventDefault();
    const current = tabs.findIndex((tab) => tab.dataset.authTab === mode);
    let next = current;

    if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;

    const target = tabs[next];
    if (target) {
      setMode(target.dataset.authTab);
      target.focus();
    }
  });

  /* ---------- Password visibility ---------- */

  $$('[data-reveal]', view).forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.reveal);
      if (!input) return;
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      button.setAttribute('aria-pressed', String(!showing));
      button.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    });
  });

  /* ---------- Validation ---------- */

  function setEmailError(input, errorEl, value) {
    const email = value.trim();
    if (!email) {
      setFieldError(input, errorEl, 'Enter your email address.');
      return false;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setFieldError(input, errorEl, 'Enter a valid email address, like you@example.com.');
      return false;
    }
    setFieldError(input, errorEl, '');
    return true;
  }

  function validateLogin() {
    let valid = true;
    valid = setEmailError(loginEmail, loginEmailError, loginEmail.value) && valid;

    if (!loginPassword.value) {
      setFieldError(loginPassword, loginPasswordError, 'Enter your password.');
      valid = false;
    } else {
      setFieldError(loginPassword, loginPasswordError, '');
    }

    return valid;
  }

  function validateSignup() {
    let valid = true;
    valid = setEmailError(signupEmail, signupEmailError, signupEmail.value) && valid;

    if (signupPassword.value.length < 8) {
      setFieldError(
        signupPassword,
        signupPasswordError,
        signupPassword.value ? 'Use at least 8 characters.' : 'Choose a password.'
      );
      valid = false;
    } else {
      setFieldError(signupPassword, signupPasswordError, '');
    }

    if (!signupConfirm.value) {
      setFieldError(signupConfirm, signupConfirmError, 'Repeat your password.');
      valid = false;
    } else if (signupPassword.value !== signupConfirm.value) {
      setFieldError(signupConfirm, signupConfirmError, 'Passwords do not match.');
      valid = false;
    } else {
      setFieldError(signupConfirm, signupConfirmError, '');
    }

    return valid;
  }

  function firstInvalid(inputs) {
    return inputs.find((input) => input.getAttribute('aria-invalid') === 'true');
  }

  // Clear a field error as soon as the visitor edits that field.
  [
    [loginEmail, loginEmailError],
    [loginPassword, loginPasswordError],
    [signupEmail, signupEmailError],
    [signupPassword, signupPasswordError],
    [signupConfirm, signupConfirmError],
  ].forEach(([input, errorEl]) => {
    input.addEventListener('input', () => {
      setFieldError(input, errorEl, '');
      clearFormAlert(input === signupEmail || input === signupPassword || input === signupConfirm ? signupError : loginError);
    });
  });

  /* ---------- Log in ---------- */

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFormAlert(loginError);

    if (!configured) return;
    if (!validateLogin()) {
      focusSoon(firstInvalid([loginEmail, loginPassword]));
      return;
    }

    setBusy(loginSubmit, true, 'Logging in…');

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: loginEmail.value.trim(),
        password: loginPassword.value,
      });

      if (error) {
        showFormAlert(loginError, friendlyAuthError(error));
        focusSoon(loginError);
        return;
      }

      if (data?.session) {
        loginForm.reset();
        onSignedIn(data.session);
      } else {
        showFormAlert(loginError, 'That did not sign you in. Please try again.');
        focusSoon(loginError);
      }
    } catch (error) {
      showFormAlert(loginError, friendlyAuthError(error));
      focusSoon(loginError);
    } finally {
      setBusy(loginSubmit, false);
    }
  });

  /* ---------- Sign up ---------- */

  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFormAlert(signupError);

    if (!configured) return;
    if (!validateSignup()) {
      focusSoon(firstInvalid([signupEmail, signupPassword, signupConfirm]));
      return;
    }

    setBusy(signupSubmit, true, 'Creating…');

    try {
      const { data, error } = await client.auth.signUp({
        email: signupEmail.value.trim(),
        password: signupPassword.value,
        options: { emailRedirectTo: redirectUrl },
      });

      if (error) {
        showFormAlert(signupError, friendlyAuthError(error));
        focusSoon(signupError);
        return;
      }

      if (data?.session) {
        signupForm.reset();
        onSignedIn(data.session);
      } else {
        showSuccess(signupEmail.value.trim());
        signupForm.reset();
      }
    } catch (error) {
      showFormAlert(signupError, friendlyAuthError(error));
      focusSoon(signupError);
    } finally {
      setBusy(signupSubmit, false);
    }
  });

  /* ---------- Success / reset ---------- */

  function showSuccess(email) {
    authForms.hidden = true;
    successPanel.hidden = false;
    successText.textContent = `We sent a confirmation link to ${email}. Open it to finish setting up your account, then log in.`;
    focusSoon(successPanel);
  }

  backToLoginBtn.addEventListener('click', () => {
    successPanel.hidden = true;
    authForms.hidden = false;
    setMode('login');
    clearFormAlert(loginError);
    focusSoon(loginEmail);
  });

  function clearAllErrors() {
    clearErrors([
      { input: loginEmail, error: loginEmailError },
      { input: loginPassword, error: loginPasswordError },
      { input: signupEmail, error: signupEmailError },
      { input: signupPassword, error: signupPasswordError },
      { input: signupConfirm, error: signupConfirmError },
    ]);
    clearFormAlert(loginError);
    clearFormAlert(signupError);
  }

  function reset() {
    loginForm.reset();
    signupForm.reset();
    clearAllErrors();
    successPanel.hidden = true;
    authForms.hidden = !configured;
    setMode('login');
  }

  /* ---------- Public API ---------- */

  return {
    show({ message = '', startMode = 'login', focusHeading = false } = {}) {
      view.hidden = false;
      reset();
      setMode(startMode);
      if (message) {
        const alertEl = startMode === 'signup' ? signupError : loginError;
        showFormAlert(alertEl, message);
        focusSoon(alertEl);
      } else if (focusHeading) {
        focusSoon(heading);
      }
    },

    hide() {
      view.hidden = true;
      reset();
    },

    setMode,
    reset,
    heading,
    showSuccess,
  };
}
