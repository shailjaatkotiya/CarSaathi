import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#171717",
          dark: "#000000",
          light: "#737373",
          soft: "#F4F4F5"
        },
        sage: "#737373",
        sand: {
          DEFAULT: "#E5E5E5",
          light: "#F5F5F5"
        },
        cream: "#FFFFFF",
        ink: "#171717",
        muted: "#6B7280"
      },
      fontFamily: {
        sans: ["Archia", "Space Grotesk", "Inter", "Segoe UI", "Roboto", "Arial", "sans-serif"]
      },
      boxShadow: {
        soft: "0 12px 32px rgba(0, 0, 0, 0.10)",
        card: "0 18px 50px rgba(0, 0, 0, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
