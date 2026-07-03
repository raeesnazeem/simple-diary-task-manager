import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        caveat: ['var(--font-caveat)', 'cursive'],
        kalam: ['var(--font-kalam)', 'cursive'],
        architects: ['var(--font-architects)', 'cursive'],
        figtree: ['var(--font-figtree)', 'sans-serif'],
        urbanist: ['var(--font-urbanist)', 'sans-serif'],
        'geist-mono': ['Geist Mono', 'monospace'],
        'sn-pro': ['SN Pro', 'sans-serif'],
        'patrick-hand': ['var(--font-patrick-hand)', 'cursive'],
        handlee: ['var(--font-handlee)', 'cursive'],
        'shadows-into-light': ['var(--font-shadows-into-light)', 'cursive'],
        neucha: ['var(--font-neucha)', 'cursive'],
        'permanent-marker': ['var(--font-permanent-marker)', 'cursive'],
        'homemade-apple': ['var(--font-homemade-apple)', 'cursive'],
        'nanum-pen-script': ['var(--font-nanum-pen-script)', 'cursive'],
        'indie-flower': ['var(--font-indie-flower)', 'cursive'],
        'gochi-hand': ['var(--font-gochi-hand)', 'cursive'],
      },
      colors: {
        paper: {
          light: '#fdfbf7',
          DEFAULT: '#f9f6ef',
          dark: '#f0ebd8',
        }
      },
      keyframes: {
        'scale-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
        }
      },
      animation: {
        'scale-pulse': 'scale-pulse 1.5s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
export default config
