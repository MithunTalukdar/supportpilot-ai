/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        navy: {
          950: '#070913',
          900: '#0b0f19',
          850: '#0d1224',
          800: '#11172e',
          750: '#151c38',
          700: '#1c254a',
        },
        surface: {
          darkest: '#070913',
          darker: '#0b0f19',
          dark: '#0e1428',
          card: '#11172e',
          cardHover: '#161e3d',
          border: 'rgba(255, 255, 255, 0.08)',
          borderGlow: 'rgba(139, 92, 246, 0.25)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 25px -4px rgba(99, 102, 241, 0.35)',
        'glow-violet': '0 0 30px -4px rgba(139, 92, 246, 0.45)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.35)',
        'glow-card': '0 10px 40px -10px rgba(0, 0, 0, 0.7), 0 0 20px -2px rgba(139, 92, 246, 0.15)',
        'glow-hero': '0 0 80px -10px rgba(99, 102, 241, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 3.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
