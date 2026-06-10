import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2b1b10",
        earth: {
          50: "#fff7ed",
          100: "#f2e6d6",
          500: "#9a6a3c",
          600: "#7c4a21",
          700: "#5b3418",
          900: "#2b1b10"
        },
        saathi: {
          50: "#efffed",
          100: "#d7fbdc",
          500: "#3d251e",
          600: "#5b3e31",
          700: "#267239",
          900: "#15411f"
        }
      },
      boxShadow: {
        soft: "0 12px 32px rgba(91, 52, 24, 0.1)"
      }
    }
  },
  plugins: []
} satisfies Config;
