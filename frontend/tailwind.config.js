/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        pandeum: {
          bg: '#0B1020',
          panel: '#111827',
          card: '#151E2F',
          hover: '#1A2440',
          primary: '#6D5EF8',
          'text-secondary': '#9CA3AF',
          border: '#1E2D4A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '22px',
      },
    },
  },
  plugins: [],
}
