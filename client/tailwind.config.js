/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0c233c',
          800: '#123B63',
          700: '#1F5A85',
          600: '#2A72A4',
          100: '#E8F1F8',
          50: '#F0F6FA',
        },
        agri: {
          800: '#1B5E20',
          700: '#2E7D32',
          600: '#388E3C',
          500: '#4CAF50',
          100: '#E8F5E9',
          50: '#F1F8E9',
        },
        surface: {
          bg: '#F5F7FA',
          card: '#FFFFFF',
          border: '#DDE3EA',
          muted: '#64748B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Roboto', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
