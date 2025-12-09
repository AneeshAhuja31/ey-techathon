import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: "#0D0D0D",
          secondary: "#1A1A1A",
          tertiary: "#262626",
          card: "#1E1E1E",
        },
        accent: {
          cyan: "#00D4FF",
          blue: "#0066FF",
          purple: "#8B5CF6",
          green: "#10B981",
        },
        node: {
          disease: "#EC4899",
          molecule: "#8B5CF6",
          product: "#FBBF24",
        },
        border: {
          default: "#333333",
          hover: "#444444",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#A0A0A0",
          muted: "#666666",
        },
      },
    },
  },
  plugins: [],
};

export default config;
