export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'] },
      colors: { ink: '#16202E', brand: { DEFAULT: '#0F766E', dark: '#0B5A54', soft: '#E3F1EF' } },
    },
  },
};
