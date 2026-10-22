/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        void: '#05060A',
        ink: '#0B0D17',
        mist: '#F3F4FA',
        neon: {
          cyan: '#3DF5FF',
          violet: '#8B6CFF',
          magenta: '#FF3DCB',
          lime: '#C6FF3D',
        },
        deep: {
          cyan: '#0090B0',
          violet: '#5B3DF5',
          magenta: '#D6007F',
        },
      },
    },
  },
  plugins: [],
};
