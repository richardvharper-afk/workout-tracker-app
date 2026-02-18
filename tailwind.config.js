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
        dark: {
          base: '#0a0a0f',
          secondary: '#13131b',
          tertiary: '#1a1a26',
        },
        glass: {
          bg: 'rgba(255,255,255,0.05)',
          border: 'rgba(255,255,255,0.1)',
          hover: 'rgba(255,255,255,0.08)',
        },
        accent: {
          cyan: '#00d4ff',
          purple: '#7b61ff',
          green: '#00ff94',
          amber: '#ffb800',
          pink: '#ff3b6d',
        },
        text: {
          primary: '#e8e8f2',
          secondary: '#a0a0b8',
          tertiary: '#6a6a7f',
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0,212,255,0.3), 0 0 60px rgba(0,212,255,0.1)',
        'glow-purple': '0 0 20px rgba(123,97,255,0.3), 0 0 60px rgba(123,97,255,0.1)',
        'glow-green': '0 0 20px rgba(0,255,148,0.3), 0 0 60px rgba(0,255,148,0.1)',
        'glow-amber': '0 0 20px rgba(255,184,0,0.3), 0 0 60px rgba(255,184,0,0.1)',
        'glow-pink': '0 0 20px rgba(255,59,109,0.3), 0 0 60px rgba(255,59,109,0.1)',
        'glass': '0 8px 32px rgba(0,0,0,0.3)',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,212,255,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0,212,255,0.5)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
