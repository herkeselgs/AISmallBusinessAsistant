import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FBFAF7",
        ink: {
          DEFAULT: "#0E1116",
          soft: "#3A3F47",
          faint: "#6B7280",
        },
        line: "#E9E6DF",
        brand: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          400: "#34D399",
          500: "#0FA968",
          600: "#0B8A55",
          700: "#0A6E45",
          900: "#064E3B",
        },
        amber: {
          400: "#FBBF24",
          500: "#F59E0B",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(14,17,22,0.04), 0 8px 24px -12px rgba(14,17,22,0.12)",
        lift: "0 2px 4px rgba(14,17,22,0.05), 0 24px 48px -20px rgba(14,17,22,0.22)",
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "80%, 100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
