/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        navy: { 950: '#0B1526', 900: '#0F1E35', 800: '#16294A', 700: '#1E365F', 600: '#2A4776' },
        teal: { 50: '#EEF7F6', 100: '#D5ECEA', 200: '#ACD8D4', 300: '#7DBEB8', 400: '#4FA39C', 500: '#358881', 600: '#2A6E69', 700: '#235955', 800: '#1D4744' },
        sand: { 50: '#FAF8F5', 100: '#F4F0EA', 200: '#E8E1D6', 300: '#D6CBBA', 400: '#B9A88F' },
        amber: { 50: '#FDF6E9', 100: '#F8E6C2', 600: '#A8650F', 700: '#8A520B' },
        rose: { 50: '#FBEFEF', 100: '#F4D5D5', 600: '#A63D40', 700: '#8B3033' },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,30,53,0.04), 0 4px 16px rgba(15,30,53,0.06)',
        lift: '0 2px 4px rgba(15,30,53,0.06), 0 12px 32px rgba(15,30,53,0.10)',
      },
      borderRadius: { xl2: '1.25rem' },
    },
  },
  plugins: [],
};
