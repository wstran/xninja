import formsPlugin from '@tailwindcss/forms'
import headlessuiPlugin from '@headlessui/tailwindcss'
import { type Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.5rem' }],
      base: ['1rem', { lineHeight: '1.75rem' }],
      lg: ['1.125rem', { lineHeight: '2rem' }],
      xl: ['1.25rem', { lineHeight: '2rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['2rem', { lineHeight: '2.5rem' }],
      '4xl': ['2.5rem', { lineHeight: '3.5rem' }],
      '5xl': ['3rem', { lineHeight: '3.5rem' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1.1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
      '9xl': ['8rem', { lineHeight: '1' }],
    },
    extend: {
      borderRadius: {
        '4xl': '2rem',
        '8xs': '5px',
        '13xl-3': '32.3px',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        monospace: 'var(--font-vt323)',
        display: 'var(--font-vt323)',
        vt323: 'VT323',
        'source-sans-pro': 'Source Sans Pro',
      },
      maxWidth: {
        '2xl': '40rem',
      },
      colors: {
        gray: {
          '100': '#fefefe',
          '200': '#451b0b',
          '300': '#070707',
          '400': 'rgba(255, 255, 255, 0.01)',
        },
        royalblue: '#2571e9',
        saddlebrown: '#5d2e1c',
        sandybrown: '#fcbd80',
        darksalmon: '#b47c57',
        burlywood: '#bc8c61',
        peachpuff: '#dcc7af',
        bisque: '#e9d2b8',
        tan: {
          '100': '#b8a590',
          '200': '#baa48b',
        },
        white: '#fff',
        lightgreen: '#94f5ad',
      },
    },
  },
  plugins: [formsPlugin, headlessuiPlugin, require('tailwindcss-animated')],
} satisfies Config
