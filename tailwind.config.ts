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
        inter: ['var(--font-inter)', 'sans-serif'],
        architects: ['var(--font-architects)', 'cursive'],
        'instrument-sans': ['var(--font-instrument-sans)', 'sans-serif'],
        figtree: ['var(--font-figtree)', 'sans-serif'],
        urbanist: ['var(--font-urbanist)', 'sans-serif'],
        'instrument-serif': ['var(--font-instrument-serif)', 'serif'],
        newsreader: ['var(--font-newsreader)', 'serif'],
        'plus-jakarta': ['var(--font-plus-jakarta)', 'sans-serif'],
        'geist-mono': ['Geist Mono', 'monospace'],
        charter: ['Charter', 'Bitstream Charter', 'serif'],
        'sn-pro': ['SN Pro', 'sans-serif'],
      },
      colors: {
        paper: {
          light: '#fdfbf7',
          DEFAULT: '#f9f6ef',
          dark: '#f0ebd8',
        }
      }
    },
  },
  plugins: [],
}
export default config
