/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // La línea crucial. Debe coincidir con dónde están tus archivos de componentes (.html y .ts)
    "./src/**/*.{html,ts}", 
  ],
  theme: {
    extend: {
      colors: {
        'brown-800': '#654134', // Verifica que el color esté aquí
      }
    },
  },
  // ...
}