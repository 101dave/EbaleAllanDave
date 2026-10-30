/* =========================================================
   Chart.js wrapper
   Chart.js is loaded from a CDN with a plain <script>. If it
   fails to load, the dashboard still shows the category list,
   so the numbers remain readable.
   ========================================================= */

import { formatCurrency } from './format.js';

let chart = null;
let chartRows = [];

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function chartSupported() {
  return typeof window !== 'undefined' && typeof window.Chart === 'function';
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function colorsFromRows(rows) {
  return rows.map((row) => cssVar(row.colorVar) || cssVar('--muted'));
}

/**
 * Create or update the donut chart.
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{category: string, total: number, colorVar: string}>} rows
 */
export function renderSpendingChart(canvas, rows) {
  if (!chartSupported() || !canvas || !rows.length) return null;

  chartRows = rows;
  const labels = rows.map((row) => row.category);
  const values = rows.map((row) => row.total);
  const colors = colorsFromRows(rows);
  const surface = cssVar('--surface');
  const ink = cssVar('--ink');
  const bg = cssVar('--bg');
  const animate = !prefersReducedMotion();

  if (!chart) {
    window.Chart.defaults.font.family = cssVar('--font-sans') || 'sans-serif';
    window.Chart.defaults.font.size = 12;

    chart = new window.Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderColor: surface,
            borderWidth: 2,
            hoverOffset: 5,
            hoverBorderColor: surface,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        animation: animate ? { duration: 450, easing: 'easeOutQuart' } : false,
        layout: { padding: 2 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: ink,
            titleColor: bg,
            bodyColor: bg,
            titleFont: { size: 11, weight: '600' },
            bodyFont: { size: 12 },
            displayColors: false,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label(context) {
                return ` ${formatCurrency(context.parsed)}`;
              },
            },
          },
        },
      },
    });
  } else {
    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.data.datasets[0].backgroundColor = colors;
    chart.data.datasets[0].borderColor = surface;
    chart.data.datasets[0].hoverBorderColor = surface;
    chart.options.animation = animate ? { duration: 450, easing: 'easeOutQuart' } : false;
    chart.options.plugins.tooltip.backgroundColor = ink;
    chart.options.plugins.tooltip.titleColor = bg;
    chart.options.plugins.tooltip.bodyColor = bg;
    chart.update();
  }

  return chart;
}

/** Re-read theme colours after the light/dark toggle. */
export function refreshChartTheme() {
  if (!chart) return;
  const style = getComputedStyle(document.documentElement);
  const surface = style.getPropertyValue('--surface').trim();
  const ink = style.getPropertyValue('--ink').trim();
  const bg = style.getPropertyValue('--bg').trim();

  chart.data.datasets[0].backgroundColor = chartRows.map(
    (row) => cssVar(row.colorVar) || style.getPropertyValue('--muted').trim()
  );
  chart.data.datasets[0].borderColor = surface;
  chart.data.datasets[0].hoverBorderColor = surface;
  chart.options.plugins.tooltip.backgroundColor = ink;
  chart.options.plugins.tooltip.titleColor = bg;
  chart.options.plugins.tooltip.bodyColor = bg;
  chart.update();
}

export function destroyChart() {
  if (chart) {
    chart.destroy();
    chart = null;
  }
  chartRows = [];
}
