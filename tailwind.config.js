/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        brand: {
          50:  '#E8F7FB',
          100: '#C5EBEF',
          200: '#9DD8E6',
          300: '#71C5DC',
          400: '#4BBFD8',  // logo light teal
          500: '#2BAAC8',
          600: '#1B8FA8',
          700: '#1B7087',  // logo dark teal (primary)
          800: '#155A6E',
          900: '#0F4255',
        },
      },
    },
  },
  plugins: [],
};
