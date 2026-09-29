/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          200: '#b9d0ff',
          300: '#7da7ff',
          400: '#3d7aff',
          500: '#1a56ff',
          600: '#0033e0',
          700: '#0028b8',
          800: '#001e96',
          900: '#001580',
          950: '#0a1628',
        },
        teal: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-subtle': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(239, 68, 68, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(239, 68, 68, 0.9), 0 0 40px rgba(239, 68, 68, 0.4)' },
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 8px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.1)',
        'gauge': '0 8px 32px rgba(0,0,0,0.12), inset 0 2px 4px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
