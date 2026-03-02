/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#09090b',
          card: '#18181b',
          elevated: '#27272a',
          border: '#27272a',
          muted: '#3f3f46',
        },
      },
    },
  },
  plugins: [],
}
