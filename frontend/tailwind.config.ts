import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        saathi: {
          50: "#eefbf6",
          100: "#d6f5e7",
          500: "#15a46b",
          600: "#0f8c5b",
          700: "#0b6f49",
          900: "#07442e"
        }
      },
      boxShadow: {
        soft: "0 12px 32px rgba(16, 24, 40, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
