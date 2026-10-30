/* =========================================================
   Small UI helpers: DOM lookup, safe element building,
   validation messages, busy buttons, toasts and dialogs.
   ========================================================= */

export function $(selector, root = document) {
  return root.querySelector(selector);
}

export function $$(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

/**
 * Build an element without innerHTML, so user data can never be
 * interpreted as markup.
 *
 * elem('p', { class: 'hint', text: 'Hello' }, childNode)
 */
export function elem(tag, props = {}, ...children) {
  const node = document.createElement(tag);

  Object.entries(props || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
    else if (key === 'hidden') node.hidden = Boolean(value);
    else node.setAttribute(key, value === true ? '' : String(value));
  });

  children.flat().forEach((child) => {
    if (child === null || child === undefined || child === false) return;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  });

  return node;
}

/** Build an <svg><use href="#id"></use></svg> icon from the sprite. */
export function icon(id) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#${id}`);
  svg.append(use);
  return svg;
}

export function setFieldError(input, errorEl, message) {
  if (!input || !errorEl) return;
  if (message) {
    input.setAttribute('aria-invalid', 'true');
    errorEl.textContent = message;
    errorEl.hidden = false;
  } else {
    input.removeAttribute('aria-invalid');
    errorEl.textContent = '';
    errorEl.hidden = true;
  }
}

export function clearErrors(fields) {
  fields.forEach(({ input, error }) => setFieldError(input, error, ''));
}

export function showFormAlert(element, message) {
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
  // Lets callers move focus to the alert so screen readers announce it.
  if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '-1');
}

export function clearFormAlert(element) {
  if (!element) return;
  element.textContent = '';
  element.hidden = true;
}

/**
 * Show a spinner inside a button and disable it while an async
 * action runs. The original markup is restored afterwards.
 */
export function setBusy(button, busy, busyLabel = 'Working…') {
  if (!button) return;

  if (busy) {
    if (!button.dataset.idleHtml) button.dataset.idleHtml = button.innerHTML;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.replaceChildren(elem('span', { class: 'spinner' }), elem('span', { text: busyLabel }));
  } else {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    if (button.dataset.idleHtml) {
      button.innerHTML = button.dataset.idleHtml;
      delete button.dataset.idleHtml;
    }
  }
}

/* ---------- Toasts ---------- */

let toastRegion = null;

export function toast(message, { type = 'success', duration = 4000 } = {}) {
  toastRegion = toastRegion || document.getElementById('toastRegion');
  if (!toastRegion) return;

  // Keep the stack short.
  while (toastRegion.children.length >= 3) {
    toastRegion.firstElementChild.remove();
  }

  const node = elem(
    'div',
    { class: `toast toast-${type}` },
    icon(type === 'error' ? 'i-alert' : 'i-check'),
    elem('span', { text: message })
  );

  const close = elem('button', {
    class: 'toast-close',
    type: 'button',
    'aria-label': 'Dismiss notification',
  }, icon('i-close'));

  let removed = false;
  const remove = () => {
    if (removed) return;
    removed = true;
    node.classList.add('is-leaving');
    window.setTimeout(() => node.remove(), 220);
  };

  close.addEventListener('click', remove);
  node.append(close);
  toastRegion.append(node);

  if (duration > 0) window.setTimeout(remove, duration);
}

/* ---------- Dialogs ---------- */

export function openDialog(dialog) {
  if (!dialog || dialog.open) return;
  if (typeof dialog.showModal === 'function') {
    dialog.showModal();
  } else {
    dialog.setAttribute('open', '');
  }
}

export function closeDialog(dialog) {
  if (!dialog) return;
  if (typeof dialog.close === 'function' && dialog.open) {
    dialog.close();
  } else {
    dialog.removeAttribute('open');
  }
}

/**
 * Close on backdrop click and on any [data-close-dialog] button.
 * Native <dialog> already handles Escape and focus return.
 */
export function wireDialogs(dialogs) {
  dialogs.forEach((dialog) => {
    if (!dialog) return;
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
    dialog.querySelectorAll('[data-close-dialog]').forEach((button) => {
      button.addEventListener('click', () => closeDialog(dialog));
    });
  });
}

/* ---------- Misc ---------- */

export function focusSoon(element) {
  if (!element) return;
  window.setTimeout(() => {
    try {
      element.focus({ preventScroll: false });
    } catch {
      element.focus();
    }
  }, 30);
}

export function announce(element, message) {
  if (!element) return;
  element.textContent = message;
}
