/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cork: '#8A5A3B',
        corkdark: '#6E4429',
        card: '#FFFCF2',
        cardline: '#E4DEC8',
        ink: '#2E2A22',
        pin: {
          yellow: '#E8B93B',
          pink: '#E0708C',
          blue: '#5B8FBE',
          green: '#6FA766',
        },
        muted: '#8A8168',
      },
      fontFamily: {
        display: ['"Kalam"', '"Comic Sans MS"', 'cursive'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        card: '0.25rem',
      },
      boxShadow: {
        pinned: '0 6px 14px rgba(0,0,0,0.25)',
      },
      backgroundImage: {
        corkboard: 'radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1px)',
      },
      backgroundSize: {
        corkboard: '10px 10px',
      },
    },
  },
  plugins: [],
};
