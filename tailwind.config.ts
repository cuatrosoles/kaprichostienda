import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        kap: {
          black: '#0b0b0b',
          green: '#1e4d32',
          tan: '#c4a574',
          paper: '#f7f4ef',
          muted: '#6b6358',
        },
      },
      letterSpacing: {
        nav: '0.22em',
      },
    },
  },
  plugins: [],
}

export default config
