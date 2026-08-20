/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#004ac6',
        'primary-fixed': '#dbe1ff',
        'primary-fixed-dim': '#b4c5ff',
        surface: '#f9f9ff',
        'surface-container-high': '#dee8ff',
        'surface-container-low': '#f0f3ff',
        'ice-blue': '#F0F7FF',
        'slate-primary': '#1E293B',
        'slate-secondary': '#64748B',
        secondary: '#585f66',
        'outline-variant': '#c3c6d7',
        'on-primary': '#ffffff',
        'on-surface': '#111c2d',
      },
      fontFamily: {
        body: ['Outfit', 'sans-serif'],
        headline: ['Outfit', 'sans-serif'],
      },
      spacing: {
        'gutter-desktop': '24px',
        'gutter-mobile': '16px',
        'margin-desktop': '32px',
        'margin-mobile': '16px',
        'max-width-content': '1440px',
      }
    },
  },
  plugins: [],
}
