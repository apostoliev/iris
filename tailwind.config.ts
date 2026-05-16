import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#1a1815',
        cream: '#faf7f2',
        sand: '#ebe5d8',
        sandlight: '#f3eee2',
        discovery: '#005A3C',
        discovery2: '#0f7050',
        gold: '#a78145',
        muted: '#6b6660',
        mist: '#e2dccf',
        whisper: '#fbf9f4',
      },
      fontFamily: {
        serif: ['var(--font-display)', 'Cormorant Garamond', 'Playfair Display', 'serif'],
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.45s ease-out',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
