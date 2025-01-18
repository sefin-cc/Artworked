/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#2A1212',
        'primary-lighter': "#70373e",
        'secondary': '#997d7d',
        'light': '#e8e3e3',
        'white': '#F7F7F7',
      },
      width: {
        'login-lg': '90vw',
        'login-md': '80vw',
        'login-sm': '40vw',
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out forwards',
        fadeOut: 'fadeOut 0.3s ease-in-out forwards',
        fadeInUp: 'fadeInUp 1s ease-in-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' , visibility: 'hidden'},
          '100%': { opacity: '1' , visibility: 'visible'},
        },
        fadeOut: {
          '0%': { opacity: '1', visibility: 'visible' },
          '100%': { opacity: '0',  visibility: 'hidden'},
        },
        fadeInUp: {
          "0%": { opacity: 0, transform: "translate3d(0, 100%, 0)",},
          "100%": { opacity: 1, transform: "translate3d(0, 0, 0)",},
          },
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}