/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          300: '#8FA9C8',
          400: '#8A8675',
          500: '#5B7FA3',
          600: '#2860B0',
          700: '#1A4A8A',
          800: '#0B2440',
          900: '#061527',
        },
        terra: {
          50:  '#FEF5F0',
          100: '#FEE8DB',
          200: '#FBCFBC',
          400: '#E8956D',
          500: '#E2835A',
          600: '#CF6A3E',
          700: '#B85430',
        },
        cream: {
          200: '#F5F0E8',
          300: '#EDE5D6',
          400: '#D9CEBC',
        },
      },
    },
  },
  plugins: [],
}
