import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand → Indigo (4F46E5 / 2563EB)
        brand: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5', // primary button / active link
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        // Sidebar — Dark Navy
        sidebar: {
          DEFAULT:  '#0F172A',
          surface:  '#1E293B',
          border:   '#1E293B',
          muted:    '#334155',
          text:     '#94A3B8',
          'text-active': '#F1F5F9',
        },
        // Status palette (aligned with spec)
        status: {
          'active-bg':    '#DCFCE7',
          'active-text':  '#15803D',
          'active-dot':   '#22C55E',
          'warn-bg':      '#FEF9C3',
          'warn-text':    '#A16207',
          'warn-dot':     '#EAB308',
          'danger-bg':    '#FEE2E2',
          'danger-text':  '#B91C1C',
          'danger-dot':   '#EF4444',
          'info-bg':      '#DBEAFE',
          'info-text':    '#1D4ED8',
          'info-dot':     '#3B82F6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / .05), 0 1px 2px -1px rgb(0 0 0 / .05)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / .08)',
        'sidebar': '4px 0 16px 0 rgb(0 0 0 / .12)',
        'topbar': '0 1px 0 0 rgb(0 0 0 / .06)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
};

export default config;
