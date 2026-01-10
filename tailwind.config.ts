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
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      colors: {
        dark: {
          900: '#0c0a09',
          800: '#1c1917',
          700: '#292524',
          600: '#44403c',
          500: '#57534e',
          400: '#78716c',
          300: '#a8a29e',
        },
        accent: {
          DEFAULT: '#8C271E',
          light: '#A63228',
          dark: '#6B1D16',
          muted: 'rgba(140, 39, 30, 0.2)',
          glow: 'rgba(140, 39, 30, 0.4)',
        },
      },
      boxShadow: {
        'accent-glow': '0 0 20px rgba(140, 39, 30, 0.4)',
        'accent-glow-lg': '0 0 40px rgba(140, 39, 30, 0.5)',
      },
      animation: {
        'fade-in': 'fade-in 600ms ease-out',
        'slide-up': 'slide-up 600ms ease-out',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
