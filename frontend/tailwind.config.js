/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        surface: {
          50: '#f0f1ff',
          100: '#e0e2ff',
          200: '#c1c5ff',
          300: '#9ba1ff',
          400: '#757dfe',
          500: '#5a5ff7',
          600: '#4a3dec',
          700: '#3f31d8',
          800: '#3429b0',
          900: '#2d278c',
          950: '#0b0a1a',
        },
        accent: {
          cyan: '#22d3ee',
          violet: '#a78bfa',
          rose: '#fb7185',
          emerald: '#34d399',
          amber: '#fbbf24',
        },
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'recording-pulse': 'recordingPulse 1.5s ease-in-out infinite',
        'bar-fill': 'barFill 1s ease-out forwards',
        'border-rotate': 'borderRotate 4s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(34,211,238,0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(34,211,238,0.4), 0 0 40px rgba(34,211,238,0.1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        recordingPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.3)' },
        },
        barFill: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--bar-width)' },
        },
        borderRotate: {
          '0%': { '--border-angle': '0deg' },
          '100%': { '--border-angle': '360deg' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
