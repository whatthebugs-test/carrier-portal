import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        kestrel: {
          50: "#fdf6ef",
          100: "#fae9d7",
          200: "#f4cfae",
          300: "#ecad7b",
          400: "#e38446",
          500: "#dc6624",
          600: "#cd4f1a",
          700: "#aa3b18",
          800: "#88311b",
          900: "#6e2a19",
        },
        ink: {
          DEFAULT: "#16202b",
          muted: "#5b6b7c",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
