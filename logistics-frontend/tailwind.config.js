/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: '#4F46E5',
        'on-primary': '#FFFFFF',
        background: '#FAFAF9',
        surface: '#FAFAF9',
        'surface-container-low': '#F1F0EE',
        'on-surface': '#0F172A',
        'on-surface-muted': '#64748B',
      },
      boxShadow: {
        brutal: '4px 4px 0 0 #0F172A',
        'brutal-sm': '2px 2px 0 0 #0F172A',
      },
    },
  },
  plugins: [],
};
