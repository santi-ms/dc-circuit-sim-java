/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          600: '#059669',
          700: '#047857',
          800: '#065f46'
        },
        charcoal: '#1f2933'
      }
    }
  },
  plugins: []
}
