/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: "#FF6B35",
        secondary: "#2D2A32",
        success: "#4CAF50",
        danger: "#E53935",
        warning: "#FFB300",
        info: "#00ACC1",
        "dark-bg": "#1A1820",
        "dark-card": "#26222C",
        "dark-border": "#36323E",
        "neon-orange": "#FF8C42",
        "neon-pink": "#FF4081",
        "neon-green": "#69F0AE",
      },
      fontFamily: {
        display: ['"ZCOOL KuaiLe"', "cursive"],
        sans: ['"Noto Sans SC"', "sans-serif"],
      },
      boxShadow: {
        "neon-orange": "0 0 10px rgba(255, 140, 66, 0.6), 0 0 20px rgba(255, 140, 66, 0.4), 0 0 40px rgba(255, 140, 66, 0.2)",
        "neon-pink": "0 0 10px rgba(255, 64, 129, 0.6), 0 0 20px rgba(255, 64, 129, 0.4), 0 0 40px rgba(255, 64, 129, 0.2)",
        "neon-green": "0 0 10px rgba(105, 240, 174, 0.6), 0 0 20px rgba(105, 240, 174, 0.4), 0 0 40px rgba(105, 240, 174, 0.2)",
        "card-glow": "0 0 20px rgba(255, 107, 53, 0.15), 0 4px 24px rgba(0, 0, 0, 0.4)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      keyframes: {
        "pulse-border": {
          "0%, 100%": {
            boxShadow: "0 0 0 0 rgba(255, 107, 53, 0.7)",
            borderColor: "rgba(255, 107, 53, 1)",
          },
          "50%": {
            boxShadow: "0 0 0 8px rgba(255, 107, 53, 0)",
            borderColor: "rgba(255, 140, 66, 0.6)",
          },
        },
        float: {
          "0%, 100%": {
            transform: "translateY(0)",
          },
          "50%": {
            transform: "translateY(-10px)",
          },
        },
        glow: {
          "0%, 100%": {
            filter: "brightness(1)",
            textShadow: "0 0 10px rgba(255, 107, 53, 0.6), 0 0 20px rgba(255, 107, 53, 0.4)",
          },
          "50%": {
            filter: "brightness(1.3)",
            textShadow: "0 0 20px rgba(255, 140, 66, 0.9), 0 0 40px rgba(255, 107, 53, 0.6)",
          },
        },
        "slide-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(30px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        "pulse-border": "pulse-border 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        glow: "glow 2.5s ease-in-out infinite",
        "slide-up": "slide-up 0.6s ease-out forwards",
      },
    },
  },
  plugins: [],
};
