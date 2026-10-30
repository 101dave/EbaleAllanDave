/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  prefix: 'tw-',
  // The existing pages already have a reset; leave them and their print styles intact.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        canvas: 'var(--portfolio-canvas)',
        paper: 'var(--portfolio-paper)',
        ink: 'var(--portfolio-ink)',
        muted: 'var(--portfolio-muted)',
        line: 'var(--portfolio-line)',
        wash: 'var(--portfolio-wash)',
        moss: 'var(--portfolio-moss)',
        mosswash: 'var(--portfolio-moss-wash)'
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
};
