import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#546B41",
          dark: "#3F5130",
          light: "#99AD7A",
          soft: "#E9EEDF"
        },
        sage: "#99AD7A",
        sand: {
          DEFAULT: "#DCCCAC",
          light: "#EAE0C9"
        },
        cream: "#FFF8EC",
        ink: "#2C3324",
        muted: "#6B7261"
      },
      fontFamily: {
        sans: ["Archia", "Space Grotesk", "Inter", "Segoe UI", "Roboto", "Arial", "sans-serif"]
      },
      boxShadow: {
        soft: "0 12px 32px rgba(84, 107, 65, 0.12)",
        card: "0 18px 50px rgba(84, 107, 65, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
