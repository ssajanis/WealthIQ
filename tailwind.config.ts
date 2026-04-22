import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Calibri', 'Inter', 'sans-serif'],
      },
      fontSize: {
        base: ['14px', { lineHeight: '1.6' }],
      },
      colors: {
        background: '#FAF9F5',
        foreground: 'hsl(var(--foreground))',
        brand: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          700: '#0369a1',
        },
      },
      borderRadius: {
        DEFAULT: '12px',
        sm: '8px',
        lg: '16px',
      },
    },
  },
  plugins: [],
};

export default config;
