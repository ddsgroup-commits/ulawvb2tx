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
        navy: {
          DEFAULT: "#1F3A68",
          dark: "#0d1e3a",
          light: "#2d4f8a",
          50: "#eef2fa",
          100: "#d6e0f5",
          200: "#adc1eb",
          300: "#7a9bdc",
          400: "#4e78cc",
          500: "#2d58b5",
          600: "#1F3A68",
          700: "#172d52",
          800: "#0d1e3a",
          900: "#060f1e",
        },
        // ULAW signature red — used sparingly as an academic accent
        // (matches the Stanford "cardinal" pattern on the homepage).
        "ulaw-red": {
          DEFAULT: "#A6192E",
          light: "#C8324C",
          dark: "#7E0F22",
          50: "#fbe8eb",
          100: "#f5c4cb",
          200: "#ea8a98",
          300: "#dc5567",
          400: "#c8324c",
          500: "#A6192E",
          600: "#86131f",
          700: "#600d17",
          800: "#40070e",
          900: "#200307",
        },
        gold: {
          DEFAULT: "#c9a84c",
          light: "#dfc078",
          dark: "#a8832a",
          50: "#fdf9ee",
          100: "#f8eed3",
          200: "#f0daa2",
          300: "#e5c268",
          400: "#c9a84c",
          500: "#b08a30",
          600: "#8d6b22",
          700: "#6e511b",
          800: "#503a14",
          900: "#30220b",
        },
        event: {
          class: "#2563eb",
          exam: "#dc2626",
          deadline: "#d97706",
          event: "#7c3aed",
        },
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans", "system-ui", "sans-serif"],
        // Academic serif — used for hero / page headings to match the
        // static ULAW-Website (which uses Source Serif Pro).
        serif: ['"Source Serif Pro"', "Georgia", '"Times New Roman"', "serif"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(31, 58, 104, 0.08)",
        "card-hover": "0 6px 24px rgba(31, 58, 104, 0.14)",
        nav: "0 2px 8px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};

export default config;
