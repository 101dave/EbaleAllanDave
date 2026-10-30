/* =========================================================
   Dashboard controller
   Owns the selected month, filters, rendering, and the three
   dialogs (transaction, budget, delete).
   ========================================================= */

import {
  $,
  announce,
  elem,
  focusSoon,
  icon,
  openDialog,
  closeDialog,
  setBusy,
  setFieldError,
  clearErrors,
  showFormAlert,
  clearFormAlert,
  toast,
  wireDialogs,
} from './ui.js';

import {
  amountForInput,
  currencySymbol,
  currentMonthKey,
  formatCompactCurrency,
  formatCurrency,
  formatDateLong,
  formatDay,
  formatMonth,
  formatPercent,
  formatWeekday,
  isValidISODate,
  isValidMonthKey,
  monthOfDate,
  parseAmount,
  plural,
  shiftMonthKey,
  todayISO,
} from './format.js';

import {
  categoriesFor,
  categoryColorVar,
} from './categories.js';

import {
  chartSupported,
  destroyChart,
  refreshChartTheme,
  renderSpendingChart,
} from './chart.js';

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export function createDashboard({ onSessionExpired = () => {} } = {}) {
  const el = {
    dashboard: document.getElementById('main'),
    pageSub: document.getElementById('pageSub'),
    monthInput: document.getElementById('monthInput'),
    prevMonth: document.getElementById('prevMonth'),
    nextMonth: document.getElementById('nextMonth'),
    addTxBtn: document.getElementById('addTxBtn'),

    statIncome: document.getElementById('statIncome'),
    statIncomeFoot: document.getElementById('statIncomeFoot'),
    statExpenses: document.getElementById('statExpenses'),
    statExpensesFoot: document.getElementById('statExpensesFoot'),
    statBalance: document.getElementById('statBalance'),
    statBalanceFoot: document.getElementById('statBalanceFoot'),
    balanceCard: document.querySelector('.stat-card.is-balance'),

    budgetCard: document.querySelector('.budget-card'),
    budgetSub: document.getElementById('budgetSub'),
    budgetBody: document.getElementById('budgetBody'),
    editBudgetBtn: document.getElementById('editBudgetBtn'),

    chartBody: document.getElementById('chartBody'),
    chartWrap: document.querySelector('.chart-canvas-wrap'),
    chartCanvas: document.getElementById('categoryChart'),
    chartLegend: document.getElementById('chartLegend'),
    chartTotal: document.getElementById('chartTotal'),
    chartEmpty: document.getElementById('chartEmpty'),
    chartEmptyTitle: document.querySelector('#chartEmpty .empty-title'),
    chartEmptyText: document.querySelector('#chartEmpty .empty-text'),
    chartFallback: document.getElementById('chartFallback'),

    txTable: document.getElementById('txTable'),
    txBody: document.getElementById('txBody'),
    txCaption: document.getElementById('txCaption'),
    txSkeleton: document.getElementById('txSkeleton'),
    txCount: document.getElementById('txCount'),
    txEmpty: document.getElementById('txEmpty'),
    txEmptyTitle: document.getElementById('txEmptyTitle'),
    txEmptyText: document.getElementById('txEmptyText'),
    emptyAddBtn: document.getElementById('emptyAddBtn'),

    filterType: document.getElementById('filterType'),
    filterCategory: document.getElementById('filterCategory'),
    clearFiltersBtn: document.getElementById('clearFiltersBtn'),

    appError: document.getElementById('appError'),
    appErrorText: document.getElementById('appErrorText'),
    retryBtn: document.getElementById('retryBtn'),
    dashboardStatus: document.getElementById('dashboardStatus'),

    userEmail: document.getElementById('userEmail'),
    demoBadge: document.getElementById('demoBadge'),
    demoBanner: document.getElementById('demoBanner'),
    signOutBtn: document.getElementById('signOutBtn'),
    signOutLabel: document.getElementById('signOutLabel'),
    footerMode: document.getElementById('footerMode'),

    txDialog: document.getElementById('txDialog'),
    txForm: document.getElementById('txForm'),
    txDialogTitle: document.getElementById('txDialogTitle'),
    txDialogEyebrow: document.getElementById('txDialogEyebrow'),
    txAmount: document.getElementById('txAmount'),
    txAmountError: document.getElementById('txAmountError'),
    txDate: document.getElementById('txDate'),
    txDateError: document.getElementById('txDateError'),
    txCategory: document.getElementById('txCategory'),
    txCategoryError: document.getElementById('txCategoryError'),
    txNote: document.getElementById('txNote'),
    txNoteError: document.getElementById('txNoteError'),
    txNoteCount: document.getElementById('txNoteCount'),
    txFormError: document.getElementById('txFormError'),
    txSubmit: document.getElementById('txSubmit'),
    currencyPrefix: document.getElementById('currencyPrefix'),

    budgetDialog: document.getElementById('budgetDialog'),
    budgetForm: document.getElementById('budgetForm'),
    budgetDialogTitle: document.getElementById('budgetDialogTitle'),
    budgetDialogEyebrow: document.getElementById('budgetDialogEyebrow'),
    budgetDialogNote: document.getElementById('budgetDialogNote'),
    budgetAmount: document.getElementById('budgetAmount'),
    budgetAmountError: document.getElementById('budgetAmountError'),
    budgetFormError: document.getElementById('budgetFormError'),
    budgetSubmit: document.getElementById('budgetSubmit'),
    removeBudgetBtn: document.getElementById('removeBudgetBtn'),
    budgetPrefix: document.querySelector('#budgetDialog .input-prefix'),

    deleteDialog: document.getElementById('deleteDialog'),
    deleteForm: document.getElementById('deleteForm'),
    deleteSummary: document.getElementById('deleteSummary'),
    deleteError: document.getElementById('deleteError'),
    deleteSubmit: document.getElementById('deleteSubmit'),
  };

  let store = null;
  let isDemo = false;
  let started = false;
  let month = currentMonthKey();
  let filters = { type: 'all', category: 'all' };
  let transactions = [];
  let budget = null;
  let totals = { income: 0, expenses: 0, balance: 0, incomeCount: 0, expenseCount: 0 };
  let editingId = null;
  let deletingId = null;
  let loadError = false;
  let loadToken = 0;

  /* =====================================================
     Boot / teardown
     ===================================================== */

  function start(nextStore, session, { demo = false } = {}) {
    store = nextStore;
    isDemo = Boolean(demo);
    started = true;
    month = currentMonthKey();
    filters = { type: 'all', category: 'all' };
    transactions = [];
    budget = null;
    loadError = false;
    editingId = null;
    deletingId = null;

    destroyChart();
    hideError();
    clearTable();

    el.demoBadge.hidden = !isDemo;
    el.demoBanner.hidden = !isDemo;
    el.userEmail.textContent = isDemo ? 'sample data' : session?.user?.email || '';
    el.signOutLabel.textContent = isDemo ? 'Exit demo' : 'Log out';
    // The visible label is hidden on small screens, so keep an accessible name.
    el.signOutBtn.setAttribute('aria-label', isDemo ? 'Exit demo mode' : 'Log out');
    el.footerMode.textContent = isDemo ? 'Demo · saved in this browser' : 'Supabase Postgres';
    if (el.currencyPrefix) el.currencyPrefix.textContent = currencySymbol();
    if (el.budgetPrefix) el.budgetPrefix.textContent = currencySymbol();

    el.filterType.value = 'all';
    rebuildCategoryFilter();
    renderMonthUI();
    setLoading(true);
    loadMonth();
  }

  function stop() {
    started = false;
    store = null;
    isDemo = false;
    loadToken += 1;
    transactions = [];
    budget = null;
    editingId = null;
    deletingId = null;
    destroyChart();
    [el.txDialog, el.budgetDialog, el.deleteDialog].forEach(closeDialog);
    clearTable();
    hideError();
    setLoading(false);
    el.userEmail.textContent = '';
    el.demoBadge.hidden = true;
    el.demoBanner.hidden = true;
    el.dashboardStatus.textContent = '';
    resetVisibleData();
  }

  /** Remove the previous account's numbers from the DOM immediately. */
  function resetVisibleData() {
    el.statIncome.textContent = '—';
    el.statExpenses.textContent = '—';
    el.statBalance.textContent = '—';
    el.statIncomeFoot.textContent = '';
    el.statExpensesFoot.textContent = '';
    el.statBalanceFoot.textContent = '';
    el.statBalance.classList.remove('is-negative');
    el.budgetSub.textContent = '';
    el.budgetBody.replaceChildren();
    el.chartBody.hidden = false;
    el.chartEmpty.hidden = true;
    el.chartLegend.replaceChildren();
    el.chartTotal.textContent = '—';
    el.txEmpty.hidden = true;
    el.txTable.hidden = true;
    el.chartFallback.hidden = true;
    el.monthInput.value = month;
  }

  function reload(options = {}) {
    return loadMonth(options);
  }

  function setTheme() {
    if (started) refreshChartTheme();
  }

  /* =====================================================
     Data loading
     ===================================================== */

  async function loadMonth({ announceLoad = true } = {}) {
    if (!store) return;

    const token = (loadToken += 1);
    loadError = false;
    hideError();
    setLoading(true);

    try {
      const [list, budgetValue] = await Promise.all([
        store.listTransactions(month),
        store.getBudget(month),
      ]);

      if (token !== loadToken) return;

      transactions = Array.isArray(list) ? list : [];
      budget = typeof budgetValue === 'number' ? budgetValue : null;
      computeTotals();
      setLoading(false);
      renderAll();

      if (announceLoad) {
        const count = transactions.length;
        announce(
          el.dashboardStatus,
          `${formatMonth(month)} loaded. ${count} ${plural(count, 'transaction')}.`
        );
      }
    } catch (error) {
      if (token !== loadToken) return;

      transactions = [];
      budget = null;
      computeTotals();
      setLoading(false);
      loadError = true;
      renderAll();

      if (error?.isAuthError) {
        onSessionExpired(error.message || 'Your session has expired. Please log in again.');
        return;
      }

      showError(error?.message || 'Could not load this month. Please try again.');
      announce(el.dashboardStatus, 'Could not load this month.');
    }
  }

  function computeTotals() {
    let income = 0;
    let expenses = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'income') {
        income += Number(tx.amount) || 0;
        incomeCount += 1;
      } else {
        expenses += Number(tx.amount) || 0;
        expenseCount += 1;
      }
    });

    totals = {
      income: round2(income),
      expenses: round2(expenses),
      balance: round2(income - expenses),
      incomeCount,
      expenseCount,
    };
  }

  /* =====================================================
     Render
     ===================================================== */

  function renderAll() {
    renderMonthUI();
    renderStats();
    renderBudget();
    renderChart();
    renderFilters();
    renderTable();
  }

  function renderMonthUI() {
    el.monthInput.value = month;
    el.pageSub.textContent = `${formatMonth(month)} at a glance.`;
    el.monthInput.setAttribute('aria-label', `Month: ${formatMonth(month)}`);
  }

  function renderStats() {
    const { income, expenses, balance, incomeCount, expenseCount } = totals;

    if (loadError) {
      el.statIncome.textContent = '—';
      el.statExpenses.textContent = '—';
      el.statBalance.textContent = '—';
      el.statIncomeFoot.textContent = 'Could not load';
      el.statExpensesFoot.textContent = 'Could not load';
      el.statBalanceFoot.textContent = 'Could not load';
      el.statBalance.classList.remove('is-negative');
      el.balanceCard.classList.remove('is-negative');
      return;
    }

    el.statIncome.textContent = formatCurrency(income);
    el.statIncomeFoot.textContent = incomeCount
      ? `${incomeCount} ${plural(incomeCount, 'entry', 'entries')}`
      : 'No income recorded';

    el.statExpenses.textContent = formatCurrency(expenses);
    el.statExpensesFoot.textContent = expenseCount
      ? `${expenseCount} ${plural(expenseCount, 'entry', 'entries')}`
      : 'No expenses recorded';

    el.statBalance.textContent = formatCurrency(balance);
    el.statBalance.classList.toggle('is-negative', balance < 0);

    if (!transactions.length) {
      el.statBalanceFoot.textContent = 'Nothing recorded yet';
    } else if (balance < 0) {
      el.statBalanceFoot.textContent = 'Spending is ahead of income';
    } else {
      el.statBalanceFoot.textContent = 'Income minus expenses';
    }
  }

  function renderBudget() {
    el.budgetCard.classList.remove('is-warn', 'is-over');
    el.budgetBody.replaceChildren();
    el.editBudgetBtn.disabled = false;

    if (loadError) {
      el.budgetSub.textContent = 'Unavailable right now';
      el.editBudgetBtn.disabled = true;
      el.budgetBody.append(
        elem('div', { class: 'budget-empty' },
          elem('p', { text: 'The budget could not be loaded. Use “Try again” in the banner above.' })
        )
      );
      return;
    }

    if (budget == null || budget <= 0) {
      el.budgetSub.textContent = `No budget for ${formatMonth(month)}`;
      el.editBudgetBtn.setAttribute('aria-label', 'Set monthly budget');
      el.editBudgetBtn.title = 'Set monthly budget';

      const setButton = elem(
        'button',
        { class: 'btn btn-secondary btn-sm', type: 'button', 'data-action': 'set-budget' },
        icon('i-plus'),
        'Set a budget'
      );

      el.budgetBody.append(
        elem(
          'div',
          { class: 'budget-empty' },
          elem('p', {
            text: 'Set a monthly spending limit to see how much is left as the month goes on.',
          }),
          setButton
        )
      );
      return;
    }

    el.budgetSub.textContent = `For ${formatMonth(month)}`;
    el.editBudgetBtn.setAttribute('aria-label', 'Edit monthly budget');
    el.editBudgetBtn.title = 'Edit monthly budget';

    const spent = totals.expenses;
    const rawPercent = budget > 0 ? (spent / budget) * 100 : 0;
    const percentLabel = formatPercent(rawPercent);
    const over = spent > budget;
    const warn = !over && rawPercent >= 75;
    const remaining = round2(budget - spent);

    el.budgetCard.classList.toggle('is-over', over);
    el.budgetCard.classList.toggle('is-warn', warn);

    const amounts = elem(
      'div',
      { class: 'budget-amounts' },
      elem(
        'div',
        {},
        elem('span', { class: 'budget-spent', text: formatCurrency(spent) }),
        elem('span', { class: 'budget-of', text: ` of ${formatCurrency(budget)}` })
      ),
      elem('span', {
        class: `budget-pct${over ? ' is-over' : warn ? ' is-warn' : ''}`,
        text: `${percentLabel} used`,
      })
    );

    const progress = elem('div', {
      class: 'progress',
      role: 'progressbar',
      'aria-label': `${formatMonth(month)} budget used`,
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': String(Math.min(100, Math.round(rawPercent))),
      'aria-valuetext': `${percentLabel} of the budget used`,
    });
    const bar = elem('div', { class: 'progress-bar' });
    progress.append(bar);

    const rows = elem('div', { class: 'budget-rows' });
    rows.append(
      elem(
        'div',
        { class: 'budget-row' },
        elem('span', { text: 'Monthly budget' }),
        elem('strong', { text: formatCurrency(budget) })
      ),
      elem(
        'div',
        { class: `budget-row${over ? ' is-over' : ''}` },
        elem('span', { text: over ? 'Over budget by' : 'Left to spend' }),
        elem('strong', { text: formatCurrency(Math.abs(remaining)) })
      )
    );

    el.budgetBody.append(amounts, progress, rows);

    // Animate the bar after it is in the document.
    requestAnimationFrame(() => {
      bar.style.width = `${Math.min(100, rawPercent)}%`;
    });
  }

  function expenseRowsByCategory() {
    const sums = new Map();

    transactions.forEach((tx) => {
      if (tx.type !== 'expense') return;
      sums.set(tx.category, round2((sums.get(tx.category) || 0) + Number(tx.amount)));
    });

    return Array.from(sums, ([category, total]) => ({
      category,
      total,
      colorVar: categoryColorVar(category),
    })).sort((a, b) => b.total - a.total);
  }

  function renderChart() {
    const rows = expenseRowsByCategory();
    el.chartTotal.textContent = loadError ? '—' : formatCompactCurrency(totals.expenses);

    el.chartLegend.replaceChildren(
      ...rows.map((row) => {
        const swatch = elem('span', { class: 'swatch' });
        swatch.style.setProperty('--c', `var(${row.colorVar})`);
        const percent = totals.expenses > 0 ? (row.total / totals.expenses) * 100 : 0;

        return elem(
          'li',
          {},
          swatch,
          elem('span', { class: 'legend-name', title: row.category, text: row.category }),
          elem('span', { class: 'legend-value', text: formatCurrency(row.total) }),
          elem('span', { class: 'legend-pct', text: formatPercent(percent) })
        );
      })
    );

    if (loadError) {
      el.chartBody.hidden = true;
      el.chartEmpty.hidden = false;
      el.chartFallback.hidden = true;
      el.chartEmptyTitle.textContent = 'Could not load spending';
      el.chartEmptyText.textContent = 'Use “Try again” in the banner above.';
      destroyChart();
      el.chartCanvas.setAttribute('aria-label', 'Spending could not be loaded');
      return;
    }

    if (!rows.length) {
      el.chartBody.hidden = true;
      el.chartEmpty.hidden = false;
      el.chartFallback.hidden = true;
      el.chartEmptyTitle.textContent = 'Nothing spent yet';
      el.chartEmptyText.textContent = 'Expenses you add this month will show up here.';
      destroyChart();
      el.chartCanvas.setAttribute(
        'aria-label',
        `No expenses recorded for ${formatMonth(month)}`
      );
      return;
    }

    el.chartBody.hidden = false;
    el.chartEmpty.hidden = true;

    const supported = chartSupported();
    el.chartWrap.hidden = !supported;
    el.chartBody.classList.toggle('no-chart', !supported);
    setChartAriaLabel(rows);

    if (supported) {
      el.chartFallback.hidden = true;
      renderSpendingChart(el.chartCanvas, rows);
    } else {
      el.chartFallback.hidden = false;
      destroyChart();
    }
  }

  function setChartAriaLabel(rows) {
    const top = rows
      .slice(0, 4)
      .map((row) => `${row.category} ${formatCurrency(row.total)}`)
      .join(', ');
    const more = rows.length > 4 ? `, and ${rows.length - 4} more categories` : '';
    el.chartCanvas.setAttribute(
      'aria-label',
      `Expenses for ${formatMonth(month)}: ${top}${more}. Total ${formatCurrency(
        totals.expenses
      )}. The full list of categories is below the chart.`
    );
  }

  function renderFilters() {
    rebuildCategoryFilter();
    el.filterType.value = filters.type;
    el.clearFiltersBtn.hidden = filters.type === 'all' && filters.category === 'all';
  }

  function rebuildCategoryFilter() {
    const categories = Array.from(new Set(transactions.map((tx) => tx.category))).sort((a, b) =>
      a.localeCompare(b)
    );

    if (filters.category !== 'all' && !categories.includes(filters.category)) {
      filters.category = 'all';
    }

    el.filterCategory.replaceChildren(
      elem('option', { value: 'all', text: 'All categories' }),
      ...categories.map((category) => elem('option', { value: category, text: category }))
    );
    el.filterCategory.value = filters.category;
  }

  function filteredTransactions() {
    return transactions.filter((tx) => {
      if (filters.type !== 'all' && tx.type !== filters.type) return false;
      if (filters.category !== 'all' && tx.category !== filters.category) return false;
      return true;
    });
  }

  function renderTable() {
    const filtered = filteredTransactions();
    const total = transactions.length;

    el.txCount.textContent = String(filtered.length);
    // The count is visual; the table caption carries the same information for
    // screen readers without putting an unsupported aria-label on a span.
    el.txCaption.textContent = `${filtered.length} ${plural(
      filtered.length,
      'transaction'
    )} shown for ${formatMonth(month)}${
      filters.type !== 'all' || filters.category !== 'all' ? ' (filtered)' : ''
    }`;

    el.txBody.replaceChildren();

    if (loadError) {
      el.txTable.hidden = true;
      el.txEmpty.hidden = true;
      el.txCount.textContent = '—';
      return;
    }

    if (total === 0) {
      el.txTable.hidden = true;
      el.txEmpty.hidden = false;
      el.txEmptyTitle.textContent = 'No transactions this month';
      el.txEmptyText.textContent =
        'Add your first entry and your month will start to take shape.';
      el.emptyAddBtn.textContent = 'Add a transaction';
      el.emptyAddBtn.dataset.mode = 'add';
      return;
    }

    if (filtered.length === 0) {
      el.txTable.hidden = true;
      el.txEmpty.hidden = false;
      el.txEmptyTitle.textContent = 'No matching transactions';
      el.txEmptyText.textContent =
        'Nothing matches the filters you chose. Try another type or category.';
      el.emptyAddBtn.textContent = 'Clear filters';
      el.emptyAddBtn.dataset.mode = 'clear';
      return;
    }

    el.txEmpty.hidden = true;
    el.txTable.hidden = false;
    el.txBody.append(...filtered.map(transactionRow));
  }

  function transactionRow(tx) {
    const date = elem(
      'time',
      { class: 'tx-date', datetime: tx.date },
      formatDay(tx.date),
      elem('span', { text: formatWeekday(tx.date) })
    );

    const dot = elem('span', { class: 'chip-dot' });
    dot.style.setProperty('--c', `var(${categoryColorVar(tx.category)})`);
    const chip = elem('span', { class: 'chip' }, dot, tx.category);

    const note = elem('span', {
      class: `tx-note${tx.note ? '' : ' is-empty'}`,
      title: tx.note || 'No note',
      text: tx.note || 'No note',
    });

    const sign = tx.type === 'income' ? '+' : '−';
    const amount = elem('span', {
      class: `tx-amount${tx.type === 'income' ? ' is-income' : ''}`,
      text: `${sign}${formatCurrency(tx.amount)}`,
    });

    const label = `${tx.category} on ${formatDateLong(tx.date)}, ${formatCurrency(tx.amount)}`;

    const editButton = elem(
      'button',
      {
        class: 'icon-btn',
        type: 'button',
        dataset: { action: 'edit', id: tx.id },
        'aria-label': `Edit ${label}`,
        title: 'Edit transaction',
      },
      icon('i-edit')
    );

    const deleteButton = elem(
      'button',
      {
        class: 'icon-btn is-delete',
        type: 'button',
        dataset: { action: 'delete', id: tx.id },
        'aria-label': `Delete ${label}`,
        title: 'Delete transaction',
      },
      icon('i-trash')
    );

    return elem(
      'tr',
      {},
      elem('td', { dataset: { col: 'date' } }, date),
      elem('td', { dataset: { col: 'category' } }, chip),
      elem('td', { dataset: { col: 'note' } }, note),
      elem('td', { dataset: { col: 'amount' }, class: 'align-right' }, amount),
      elem('td', { dataset: { col: 'actions' }, class: 'align-right' },
        elem('div', { class: 'row-actions' }, editButton, deleteButton)
      )
    );
  }

  /* =====================================================
     Loading / error utilities
     ===================================================== */

  function setLoading(loading) {
    el.dashboard.classList.toggle('is-loading', loading);
    el.dashboard.setAttribute('aria-busy', String(loading));
    el.txSkeleton.hidden = !loading;

    if (loading) {
      el.txTable.hidden = true;
      el.txEmpty.hidden = true;
    }
  }

  function showError(message) {
    el.appErrorText.textContent = message;
    el.appError.hidden = false;
  }

  function hideError() {
    el.appError.hidden = true;
    el.appErrorText.textContent = '';
  }

  function clearTable() {
    el.txBody.replaceChildren();
    el.chartLegend.replaceChildren();
    el.chartTotal.textContent = '—';
    el.txCount.textContent = '0';
    el.txCaption.textContent = 'Transactions';
  }

  /* =====================================================
     Month + filters
     ===================================================== */

  function setMonth(next) {
    if (!isValidMonthKey(next) || next === month) {
      el.monthInput.value = month;
      return;
    }
    month = next;
    loadMonth();
  }

  function clearFilters({ announceChange = true } = {}) {
    filters = { type: 'all', category: 'all' };
    renderFilters();
    renderTable();
    if (announceChange) {
      announce(el.dashboardStatus, `Filters cleared. ${transactions.length} transactions shown.`);
    }
  }

  /* =====================================================
     Transaction dialog
     ===================================================== */

  function selectedType() {
    const checked = el.txForm.querySelector('input[name="txType"]:checked');
    return checked && checked.value === 'income' ? 'income' : 'expense';
  }

  function setSelectedType(type) {
    el.txForm.querySelectorAll('input[name="txType"]').forEach((radio) => {
      radio.checked = radio.value === type;
    });
  }

  function defaultDateForMonth() {
    const today = todayISO();
    return monthOfDate(today) === month ? today : `${month}-01`;
  }

  function fillCategoryOptions(type, selected) {
    const list = categoriesFor(type);
    const options = list.map((category) => elem('option', { value: category, text: category }));

    if (selected && !list.includes(selected)) {
      options.push(elem('option', { value: selected, text: `${selected} (existing)` }));
    }

    el.txCategory.replaceChildren(...options);
    el.txCategory.value = selected || list[0];
  }

  function openTransactionDialog(transaction = null) {
    if (!store) return;

    editingId = transaction ? transaction.id : null;
    const isEditing = Boolean(transaction);

    el.txDialogTitle.textContent = isEditing ? 'Edit transaction' : 'Add transaction';
    el.txDialogEyebrow.textContent = isEditing ? 'edit entry' : 'new entry';
    el.txSubmit.textContent = isEditing ? 'Save changes' : 'Add transaction';

    const type = transaction?.type === 'income' ? 'income' : 'expense';
    setSelectedType(type);
    fillCategoryOptions(type, transaction?.category);

    el.txAmount.value = transaction ? amountForInput(transaction.amount) : '';
    el.txDate.value = transaction?.date || defaultDateForMonth();
    el.txNote.value = transaction?.note || '';
    el.txNoteCount.textContent = String(el.txNote.value.length);

    clearErrors([
      { input: el.txAmount, error: el.txAmountError },
      { input: el.txDate, error: el.txDateError },
      { input: el.txCategory, error: el.txCategoryError },
      { input: el.txNote, error: el.txNoteError },
    ]);
    clearFormAlert(el.txFormError);
    el.txForm.removeAttribute('aria-busy');

    openDialog(el.txDialog);
    focusSoon(el.txAmount);
  }

  function validateTransaction() {
    clearErrors([
      { input: el.txAmount, error: el.txAmountError },
      { input: el.txDate, error: el.txDateError },
      { input: el.txCategory, error: el.txCategoryError },
      { input: el.txNote, error: el.txNoteError },
    ]);
    clearFormAlert(el.txFormError);

    const amountResult = parseAmount(el.txAmount.value);
    if (amountResult.error) setFieldError(el.txAmount, el.txAmountError, amountResult.error);

    if (!el.txCategory.value) {
      setFieldError(el.txCategory, el.txCategoryError, 'Choose a category.');
    }

    if (!el.txDate.value) {
      setFieldError(el.txDate, el.txDateError, 'Choose a date.');
    } else if (!isValidISODate(el.txDate.value)) {
      setFieldError(el.txDate, el.txDateError, 'Enter a valid date.');
    }

    const note = el.txNote.value.trim();
    if (note.length > 200) {
      setFieldError(el.txNote, el.txNoteError, 'Keep the note under 200 characters.');
    }

    const invalid = [el.txAmount, el.txDate, el.txCategory, el.txNote].find(
      (input) => input.getAttribute('aria-invalid') === 'true'
    );

    if (invalid) {
      showFormAlert(el.txFormError, 'Please fix the highlighted field, then try again.');
      invalid.focus();
      return null;
    }

    return {
      type: selectedType(),
      amount: amountResult.value,
      category: el.txCategory.value,
      date: el.txDate.value,
      note,
    };
  }

  /* =====================================================
     Events
     ===================================================== */

  el.prevMonth.addEventListener('click', () => setMonth(shiftMonthKey(month, -1)));
  el.nextMonth.addEventListener('click', () => setMonth(shiftMonthKey(month, 1)));
  el.monthInput.addEventListener('change', () => {
    if (isValidMonthKey(el.monthInput.value)) setMonth(el.monthInput.value);
    else el.monthInput.value = month;
  });

  el.addTxBtn.addEventListener('click', () => openTransactionDialog());
  el.emptyAddBtn.addEventListener('click', () => {
    if (el.emptyAddBtn.dataset.mode === 'clear') clearFilters();
    else openTransactionDialog();
  });

  el.filterType.addEventListener('change', () => {
    filters.type = el.filterType.value;
    renderFilters();
    renderTable();
    announce(
      el.dashboardStatus,
      `Showing ${filteredTransactions().length} ${plural(
        filteredTransactions().length,
        'transaction'
      )}.`
    );
  });

  el.filterCategory.addEventListener('change', () => {
    filters.category = el.filterCategory.value;
    renderFilters();
    renderTable();
    announce(
      el.dashboardStatus,
      `Showing ${filteredTransactions().length} ${plural(
        filteredTransactions().length,
        'transaction'
      )}.`
    );
  });

  el.clearFiltersBtn.addEventListener('click', () => clearFilters());

  el.retryBtn.addEventListener('click', () => loadMonth());

  el.editBudgetBtn.addEventListener('click', () => openBudgetDialog());

  el.budgetBody.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="set-budget"]');
    if (button) openBudgetDialog();
  });

  el.txForm.querySelectorAll('input[name="txType"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      const type = selectedType();
      const current = el.txCategory.value;
      const list = categoriesFor(type);
      fillCategoryOptions(type, list.includes(current) ? current : null);
    });
  });

  el.txNote.addEventListener('input', () => {
    el.txNoteCount.textContent = String(el.txNote.value.length);
    setFieldError(el.txNote, el.txNoteError, '');
  });

  el.txAmount.addEventListener('input', () => {
    setFieldError(el.txAmount, el.txAmountError, '');
    clearFormAlert(el.txFormError);
  });

  el.txDate.addEventListener('change', () => {
    setFieldError(el.txDate, el.txDateError, '');
  });

  el.txCategory.addEventListener('change', () => {
    setFieldError(el.txCategory, el.txCategoryError, '');
  });

  el.txForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!store) return;

    const wasEditing = Boolean(editingId);
    const savedId = editingId;
    const input = validateTransaction();
    if (!input) return;

    setBusy(el.txSubmit, true, wasEditing ? 'Saving…' : 'Adding…');
    el.txForm.setAttribute('aria-busy', 'true');

    try {
      if (wasEditing) {
        await store.updateTransaction(editingId, input);
      } else {
        await store.createTransaction(input);
      }

      closeDialog(el.txDialog);
      editingId = null;
      toast(wasEditing ? 'Transaction updated.' : 'Transaction added.');

      // If the date belongs to another month, follow it so the change is visible.
      const targetMonth = monthOfDate(input.date);
      if (targetMonth !== month) month = targetMonth;

      await loadMonth();

      // Re-rendering replaces the row's edit button, so native dialog focus
      // restoration would land on a removed node. Put focus back on the row.
      if (wasEditing && savedId) {
        const rowButton = document.querySelector(
          `#txBody button[data-action="edit"][data-id="${CSS.escape(savedId)}"]`
        );
        if (rowButton) focusSoon(rowButton);
      }
    } catch (error) {
      if (error?.isAuthError) {
        closeDialog(el.txDialog);
        onSessionExpired(error.message);
        return;
      }
      showFormAlert(el.txFormError, error?.message || 'Could not save this transaction.');
      focusSoon(el.txFormError);
    } finally {
      el.txForm.removeAttribute('aria-busy');
      setBusy(el.txSubmit, false);
    }
  });

  /* ---------- Delete ---------- */

  el.txBody.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const transaction = transactions.find((tx) => tx.id === button.dataset.id);
    if (!transaction) return;

    if (button.dataset.action === 'edit') {
      openTransactionDialog(transaction);
    } else if (button.dataset.action === 'delete') {
      openDeleteDialog(transaction);
    }
  });

  function openDeleteDialog(transaction) {
    deletingId = transaction.id;
    el.deleteSummary.textContent = `${transaction.category} · ${formatCurrency(
      transaction.amount
    )} · ${formatDateLong(transaction.date)}`;
    clearFormAlert(el.deleteError);
    openDialog(el.deleteDialog);
  }

  el.deleteForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!store || !deletingId) return;

    setBusy(el.deleteSubmit, true, 'Deleting…');

    try {
      await store.deleteTransaction(deletingId);
      closeDialog(el.deleteDialog);
      deletingId = null;
      toast('Transaction deleted.');
      await loadMonth();
      focusSoon(el.addTxBtn);
    } catch (error) {
      if (error?.isAuthError) {
        closeDialog(el.deleteDialog);
        onSessionExpired(error.message);
        return;
      }
      showFormAlert(el.deleteError, error?.message || 'Could not delete this transaction.');
      focusSoon(el.deleteError);
    } finally {
      setBusy(el.deleteSubmit, false);
    }
  });

  /* ---------- Budget ---------- */

  function openBudgetDialog() {
    if (!store) return;

    const hasBudget = budget != null && budget > 0;
    el.budgetDialogTitle.textContent = hasBudget ? 'Edit monthly budget' : 'Set monthly budget';
    el.budgetDialogEyebrow.textContent = 'monthly limit';
    el.budgetDialogNote.textContent = `This budget applies to ${formatMonth(month)}.`;
    el.budgetAmount.value = hasBudget ? amountForInput(budget) : '';
    el.removeBudgetBtn.hidden = !hasBudget;
    setFieldError(el.budgetAmount, el.budgetAmountError, '');
    clearFormAlert(el.budgetFormError);

    openDialog(el.budgetDialog);
    focusSoon(el.budgetAmount);
  }

  el.budgetAmount.addEventListener('input', () => {
    setFieldError(el.budgetAmount, el.budgetAmountError, '');
    clearFormAlert(el.budgetFormError);
  });

  el.budgetForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!store) return;

    clearFormAlert(el.budgetFormError);
    const result = parseAmount(el.budgetAmount.value);

    if (result.error) {
      setFieldError(el.budgetAmount, el.budgetAmountError, result.error);
      el.budgetAmount.focus();
      return;
    }

    setBusy(el.budgetSubmit, true, 'Saving…');

    try {
      await store.setBudget(month, result.value);
      closeDialog(el.budgetDialog);
      toast('Budget saved.');
      await loadMonth();
    } catch (error) {
      if (error?.isAuthError) {
        closeDialog(el.budgetDialog);
        onSessionExpired(error.message);
        return;
      }
      showFormAlert(el.budgetFormError, error?.message || 'Could not save your budget.');
      focusSoon(el.budgetFormError);
    } finally {
      setBusy(el.budgetSubmit, false);
    }
  });

  el.removeBudgetBtn.addEventListener('click', async () => {
    if (!store) return;

    setBusy(el.removeBudgetBtn, true, 'Removing…');

    try {
      await store.clearBudget(month);
      closeDialog(el.budgetDialog);
      toast('Budget removed.');
      await loadMonth();
    } catch (error) {
      if (error?.isAuthError) {
        closeDialog(el.budgetDialog);
        onSessionExpired(error.message);
        return;
      }
      showFormAlert(el.budgetFormError, error?.message || 'Could not remove your budget.');
      focusSoon(el.budgetFormError);
    } finally {
      setBusy(el.removeBudgetBtn, false);
    }
  });

  /* ---------- Dialogs ---------- */

  wireDialogs([el.txDialog, el.budgetDialog, el.deleteDialog]);

  // Reset transient ids when a dialog is dismissed without saving.
  el.txDialog.addEventListener('close', () => {
    editingId = null;
    el.txForm.removeAttribute('aria-busy');
  });

  el.deleteDialog.addEventListener('close', () => {
    deletingId = null;
  });

  /* =====================================================
     Public API
     ===================================================== */

  return {
    start,
    stop,
    reload,
    setTheme,
    isDemo: () => isDemo,
    currentMonth: () => month,
  };
}
