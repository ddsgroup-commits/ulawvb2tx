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
        // Primary: Academic Navy
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
        // Accent: ULAW Red
        ulaw: {
          DEFAULT: "#B32024",
          dark: "#8a171a",
          light: "#d42a30",
          50: "#fdf2f2",
          100: "#fde0e0",
          200: "#f9bfbf",
          300: "#f39090",
          400: "#e85a5a",
          500: "#d42a30",
          600: "#B32024",
          700: "#8a171a",
          800: "#631012",
          900: "#3d090b",
        },
        // Secondary: Gold
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
        // Event types
        event: {
          class: "#2563eb",
          exam: "#dc2626",
          deadline: "#d97706",
          event: "#7c3aed",
          meeting: "#059669",
          release: "#0891b2",
        },
        // Role colors
        role: {
          superadmin: "#7c3aed",
          admin: "#1F3A68",
          moderator: "#0891b2",
          creator: "#059669",
          lecturer: "#c9a84c",
          student: "#2563eb",
          pending: "#9ca3af",
        },
        // Status colors
        status: {
          draft: "#9ca3af",
          submitted: "#f59e0b",
          review: "#3b82f6",
          approved: "#10b981",
          rejected: "#ef4444",
          published: "#059669",
          archived: "#6b7280",
        },
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans", "system-ui", "sans-serif"],
        serif: ["Source Serif Pro", "Georgia", "Times New Roman", "serif"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(31, 58, 104, 0.08)",
        "card-hover": "0 6px 24px rgba(31, 58, 104, 0.14)",
        nav: "0 2px 8px rgba(0,0,0,0.08)",
        "ulaw": "0 4px 20px rgba(179, 32, 36, 0.18)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-in": "slideIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateY(-8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
