/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Dark grey backgrounds
        background: {
          primary: '#0D0D0D',
          secondary: '#1A1A1A',
          tertiary: '#262626',
          card: '#1E1E1E',
        },
        // Cyan/blue accents for active elements
        accent: {
          cyan: '#00D4FF',
          blue: '#0066FF',
          purple: '#8B5CF6',
          pink: '#EC4899',
        },
        // Mind map node colors
        node: {
          disease: '#EC4899',    // Pink
          molecule: '#8B5CF6',   // Purple/Blue
          product: '#FBBF24',    // Yellow
        },
        // Status colors
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        },
        // Text colors
        text: {
          primary: '#FFFFFF',
          secondary: '#A1A1AA',
          muted: '#71717A',
        },
        // Border colors
        border: {
          default: '#3F3F46',
          light: '#52525B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
