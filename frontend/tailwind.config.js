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
        dark: {
          50: '#f3f4f6',
          100: '#e5e7eb',
          200: '#d1d5db',
          300: '#9ca3af',
          400: '#6b7280',
          500: '#4b5563',
          600: '#374151',
          700: '#1f2937',
          800: '#111827',
          900: '#030712',
        },
        accent: {
          primary: '#3b82f6',   // Blue
          secondary: '#10b981', // Green
          danger: '#ef4444',    // Red
        },
      },
      boxShadow: {
        'glow': '0 0 15px rgba(59, 130, 246, 0.5)',
        'glow-sm': '0 0 10px rgba(59, 130, 246, 0.3)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}