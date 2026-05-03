/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['"Inter"', 'system-ui', 'sans-serif'],
        serif: ['"Luxurious Roman"', 'Georgia', 'serif'],
        mono:  ['"Geist Mono"', 'monospace'],
      },
      colors: {
        stone: {
          50:  '#FAFAF8',
          100: '#F5F4F0',
          200: '#E8E6E1',
          300: '#D4D0C8',
          400: '#A8A49A',
          500: '#78746C',
          600: '#57534A',
          700: '#3D3A34',
          800: '#28261F',
          900: '#111110',
        },
      },
      fontSize: {
        '2xs': ['10px', { letterSpacing: '0.1em' }],
        'xs':  ['12px', { lineHeight: '1.5' }],
        'sm':  ['13px', { lineHeight: '1.6' }],
        'base':['14px', { lineHeight: '1.6' }],
      },
    },
  },
  plugins: [],
}
