/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1E2230", // Midnight Indigo
          dark: "#141721",
        },
        secondary: {
          DEFAULT: "#C86D51", // Terracotta Clay
          dark: "#B25E43",
        },
        accent: {
          DEFAULT: "#3B82F6", // Soft Mint Teal (using the hex code provided)
          dark: "#2563EB",
        },
        warmpearl: {
          DEFAULT: "#FAFAFD", // Warm Pearl
        },
        crispwhite: {
          DEFAULT: "#FFFFFF", // Crisp White
        },
        navyblack: {
          DEFAULT: "#0F172A", // Deep Navy Black
        },
        slategray: {
          DEFAULT: "#64748B", // Slate Blue-Gray
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
