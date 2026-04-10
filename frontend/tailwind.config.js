/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'ai-shimmer': {
          '0%': { backgroundPosition: '100% 0' },
          '100%': { backgroundPosition: '-100% 0' },
        }
      },
      animation: {
        'ai-shimmer': 'ai-shimmer 2.5s infinite linear',
      }
    },
  },
  plugins: [],
}
