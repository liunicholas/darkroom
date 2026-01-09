import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      colors: {
        dark: {
          900: '#121212',
          800: '#1a1a1a',
          700: '#242424',
          600: '#2d2d2d',
          500: '#333333',
          400: '#3a3a3a',
          300: '#4a4a4a',
        },
        maroon: {
          DEFAULT: '#8B2332',
          light: '#A62D3F',
          dark: '#6F1C28',
          muted: 'rgba(139, 35, 50, 0.3)',
          glow: 'rgba(139, 35, 50, 0.5)',
        },
      },
      boxShadow: {
        'accent-glow': '0 0 10px rgba(139, 35, 50, 0.5)',
        'accent-glow-lg': '0 0 20px rgba(139, 35, 50, 0.6)',
      },
      animation: {
        'accordion-down': 'accordion-down 300ms ease-out',
        'accordion-up': 'accordion-up 200ms ease-out',
        'fade-in': 'fade-in 200ms ease-out',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0', opacity: '0' },
          to: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
          to: { height: '0', opacity: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
