/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        base: '#0d0d0f',
        surface: '#111114',
        elevated: '#18181d',
        hover: '#1f1f26',
        'border-subtle': 'rgba(255,255,255,0.06)',
        'accent-indigo': '#818cf8',
        'accent-blue': '#60a5fa',
        'accent-purple': '#a78bfa',
        'accent-green': '#34d399',
        'accent-amber': '#fbbf24',
        'accent-pink': '#f472b6',
      },
    },
  },
  plugins: [],
};
