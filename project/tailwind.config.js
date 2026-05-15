/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50:  '#f0faf4',
          100: '#dcf5e6',
          200: '#bbe9ce',
          300: '#8dd6ae',
          400: '#5bbc87',
          500: '#38a169',
          600: '#2d8a56',
          700: '#266e46',
          800: '#1e5438',
          900: '#163d29',
          950: '#0b1f15',
        },
        mint: {
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
      },
      fontFamily: {
        lora: ['Lora', 'Georgia', 'serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
