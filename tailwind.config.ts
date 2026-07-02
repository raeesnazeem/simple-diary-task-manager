import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        caveat: ['var(--font-caveat)'],
        inter: ['var(--font-inter)'],
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
