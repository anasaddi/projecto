/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        dark: {
          bg: '#080B12',
          surface1: '#10151F',
          surface2: '#151B26',
          surface3: '#1B2230',
          borderSubtle: '#242C3A',
          borderStrong: '#33405A',
          textPrimary: '#F4F7FB',
          textSecondary: '#A7B0C0',
          textMuted: '#6F7888',
          violet: '#7C5CFF',
          violetLight: '#9B82FF',
          violetDark: '#4F38C8',
          teal: '#16C7A3',
          cyan: '#22B8F0',
          amber: '#F59E0B',
          rose: '#F43F5E',
        },
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
}
