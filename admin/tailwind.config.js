/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#FFD600',
          600: '#D4A800',
          700: '#B8860B',
          800: '#8B6914',
          900: '#713F12',
        },
dark: {
            50: '#f8f8f8',
            100: '#f0f0f0',
            200: '#e4e4e7',
            300: '#d4d4d8',
            400: '#a1a1aa',
            500: '#71717a',
            600: '#52525b',
            700: '#3f3f46',
            800: '#27272a',
            900: '#18181b',
            950: '#000000',
          },
        },
        animation: {
          'slide-down': 'slideDown 0.3s ease-out',
        },
        keyframes: {
          slideDown: {
            '0%': { opacity: '0', transform: 'translateY(-10px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
        },
      },
  },
  plugins: [],
};