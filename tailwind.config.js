/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Rippling brand palette - matched from screenshots
        rippling: {
          plum: '#481138',        // top nav background
          'plum-hover': '#3a0d2d',
          'plum-light': '#5d1748',
          primary: '#7B1F5C',      // primary buttons (slightly brighter purple)
          'primary-hover': '#641849',
          accent: '#D946A8',       // bright accent / highlights
          ink: '#0F0F0F',          // primary text
          'ink-2': '#3a3a3a',      // secondary text
          muted: '#6b6b6b',        // tertiary
          line: '#E5E5E5',         // borders
          'line-2': '#F0F0F0',     // subtle borders
          surface: '#FAFAFA',      // body background
          'surface-2': '#F5F5F5',  // muted panels / header bg
          elevated: '#E0E0E0',   // interactive hover backgrounds
          'chip-elevated': '#E5DDE3', // chip / selected row hover
          chip: '#F4F1F3',         // filter chips
          'red-dot': '#F03E3E',    // notification dot
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.6875rem',
      },
      boxShadow: {
        'rippling-card': '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 1px rgba(0, 0, 0, 0.03)',
        'rippling-dropdown': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}
