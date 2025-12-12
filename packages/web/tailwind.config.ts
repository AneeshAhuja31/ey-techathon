import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: "#FFFFFF",
          secondary: "#F9FAFB",
          tertiary: "#F3F4F6",
          card: "#FFFFFF",
        },
        accent: {
          cyan: "#0EA5E9",
          blue: "#3B82F6",
          purple: "#8B5CF6",
          green: "#10B981",
        },
        node: {
          disease: "#EC4899",
          molecule: "#8B5CF6",
          product: "#F59E0B",
        },
        border: {
          default: "#E5E7EB",
          hover: "#D1D5DB",
        },
        text: {
          primary: "#111827",
          secondary: "#6B7280",
          muted: "#9CA3AF",
        },
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [typography],
};

export default config;
