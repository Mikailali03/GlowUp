/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        spa: {
          pink: "#FDF2F2",
          mint: "#F0F9F6",
          blue: "#EBF5FF",
          lavender: "#F5F3FF",
          gold: "#AF905B",
          slate: "#4A5568",
        },
      },
    },
  },
  plugins: [],
}