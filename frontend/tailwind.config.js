/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}", 
  ],
  theme: {
    extend: {
      colors: {
        'brown-800': '#654134', 
      },
      screens: {
        'mid-large': '500px', // breakpoint personalizado entre md y lg
      },
    },

  },
}