/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        india: {
          green: '#15803D', // Agricultural Green
          green_deep: '#166534', // Deep Green
          green_fresh: '#22C55E', // Fresh Green
          saffron: '#F59E0B', // Warm Saffron Accent
          saffron_hover: '#D97706',
        },
        chakra: {
          blue: '#1A4B9C',
        },
        paper: '#F8FAF7', // BACKGROUND
        surface: '#FFFFFF', // SURFACE
        ink: '#17231B', // PRIMARY TEXT
        muted: '#647067', // SECONDARY TEXT
        line: '#DDE6DF', // BORDER
        error: '#DC2626',
        warning: '#D97706',
        success: '#15803D',
        info: '#2563EB',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans', 'Segoe UI', 'Roboto', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        'reading': '65ch',
      }
    },
  },
  plugins: [],
}
