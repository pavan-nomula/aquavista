/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ocean: {
          950: '#050a12',
          900: '#070d18',
          850: '#0b1424',
          800: '#0e1c31',
          750: '#13243e',
          700: '#182d4d',
          600: '#233d66',
          500: '#31548a',
        },
        aqua: {
          300: '#8dfdeb',
          400: '#44f9e0',
          500: '#00f5d4',
          600: '#00ccb0',
          700: '#009e89',
        },
        biolum: {
          300: '#90e0ef',
          400: '#48cae4',
          500: '#00b4d8',
          600: '#0096c7',
          700: '#03045e',
        },
        surface: {
          glass: 'rgba(11, 20, 36, 0.65)',
          'glass-elevated': 'rgba(14, 28, 49, 0.75)',
          'glass-card': 'rgba(17, 34, 60, 0.55)',
          border: 'rgba(0, 245, 212, 0.12)',
          'border-subtle': 'rgba(255, 255, 255, 0.07)',
          'border-active': 'rgba(0, 245, 212, 0.35)',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'aqua-glow': '0 0 25px -5px rgba(0, 245, 212, 0.25)',
        'aqua-glow-lg': '0 0 45px -10px rgba(0, 245, 212, 0.35)',
        'coral-glow': '0 0 25px -5px rgba(244, 63, 94, 0.3)',
        'amber-glow': '0 0 25px -5px rgba(245, 158, 11, 0.25)',
        'inner-glass': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wave-flow': 'waveFlow 8s linear infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
        waveFlow: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
