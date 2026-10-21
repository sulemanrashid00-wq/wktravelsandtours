/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: {
            DEFAULT: '#10263D',
            50: '#F3F6F8',
            100: '#E1E7EB',
            200: '#C4D1DB',
            300: '#9DB3C4',
            400: '#586775',
            500: '#344A5F',
            600: '#22384D',
            700: '#172E44',
            800: '#10263D',
            900: '#0C1C2E',
            950: '#07121F',
          },
          teal: {
            DEFAULT: '#087E83',
            50: '#F0FDFA',
            100: '#CCFBF1',
            200: '#99F6E4',
            300: '#5EEAD4',
            400: '#2DD4BF',
            500: '#087E83',
            600: '#06676B',
            700: '#055154',
            800: '#043E40',
            900: '#032C2E',
          },
          gold: {
            DEFAULT: '#D97706',
            50: '#FEF9EE',
            100: '#FDF1D5',
            200: '#FBE0A7',
            300: '#F8CE79',
            400: '#F5B640',
            500: '#D97706',
            600: '#B45309',
            700: '#8C3D06',
            800: '#6E2F08',
            900: '#5A2609',
          },
          surface: '#F3F6F8',
          border: '#E1E7EB',
          text: {
            primary: '#10263D',
            secondary: '#586775',
          },
          whatsapp: {
            DEFAULT: '#128C7E',
            hover: '#075E54',
            bright: '#25D366',
          },
          sand: {
            50: '#FFFFFF',
            100: '#F8FAFB',
            200: '#F3F6F8',
            300: '#E1E7EB',
            400: '#C4D1DB',
            500: '#586775',
          },
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

