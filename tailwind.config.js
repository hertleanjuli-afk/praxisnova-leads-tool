/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0A',
        'bg-dark': '#060606',
        coral: '#E8472A',
        card: '#111111',
        'card-border': '#1E1E1E',
        muted: '#555555',
        'border-subtle': '#181818',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
