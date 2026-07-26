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
          bg: '#050816',
          'bg-2': '#080B14',
          panel: '#0E1422',
          card: '#111827',
          'card-alt': '#151E2F',
          primary: '#7C3AED',
          'primary-2': '#6D5EF8',
          accent: '#22D3EE',
          muted: '#9CA3AF',
          border: 'rgba(255,255,255,0.08)',
          success: '#22C55E',
          danger: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '22px',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.15)' },
          '50%': { boxShadow: '0 0 30px rgba(124, 58, 237, 0.3)' },
        },
      },
    },
  },
  plugins: [],
}
