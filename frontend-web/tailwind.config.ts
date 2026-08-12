import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  'rgb(var(--brand-50) / <alpha-value>)',
          100: 'rgb(var(--brand-100) / <alpha-value>)',
          200: 'rgb(var(--brand-200) / <alpha-value>)',
          300: 'rgb(var(--brand-300) / <alpha-value>)',
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
          800: 'rgb(var(--brand-800) / <alpha-value>)',
          900: 'rgb(var(--brand-900) / <alpha-value>)',
        },
        background:  'rgb(var(--background) / <alpha-value>)',
        foreground:  'rgb(var(--foreground) / <alpha-value>)',
        card:        'rgb(var(--card) / <alpha-value>)',
        border:      'rgb(var(--border) / <alpha-value>)',
        muted:       'rgb(var(--muted) / <alpha-value>)',
        primary:     'rgb(var(--primary) / <alpha-value>)',
        secondary:   'rgb(var(--secondary) / <alpha-value>)',
        destructive: 'rgb(var(--destructive) / <alpha-value>)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
      },
    },
  },
  plugins: [],
};

export default config;
