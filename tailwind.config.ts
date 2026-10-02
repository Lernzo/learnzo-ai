import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eef5ff",
          100: "#dbe9ff",
          200: "#bcd5ff",
          300: "#8eb6ff",
          400: "#5a8dff",
          500: "#2f66f5",
          600: "#1a4bdd",
          700: "#163cb2",
          800: "#16348d",
          900: "#172f70"
        },
        accent: { 400: "#fbbf24", 500: "#f59e0b" },
        mint:   { 500: "#10b981" }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"]
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem"
      },
      boxShadow: {
        soft: "0 6px 24px -8px rgba(15, 23, 42, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;