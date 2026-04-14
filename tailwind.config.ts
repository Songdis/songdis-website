import type { Config } from "tailwindcss";

const config: Config = {
   content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#140C0C",
          "bg-mid": "#170F0F",
          "bg-light": "#180F0F",
          dark: "#37332C",
          "dark-alt": "#38342D",
          red: "#C30100",
          muted: "#686560",
          white: "#FFFFFF",
        },
      },
      fontFamily: {
        nulshock: ["Nulshock", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
      },
      animation: {
        "scroll-left": "scrollLeft 30s linear infinite",
        "scroll-left-slow": "scrollLeft 50s linear infinite",
        "fade-up": "fadeUp 0.8s ease forwards",
        "fade-in": "fadeIn 0.6s ease forwards",
      },
      keyframes: {
        scrollLeft: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;