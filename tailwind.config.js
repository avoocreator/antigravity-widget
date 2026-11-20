/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          base: "rgba(13, 16, 23, 0.82)",
          card: "rgba(23, 27, 39, 0.68)",
          cardHover: "rgba(33, 39, 56, 0.78)",
          cardInner: "rgba(18, 21, 31, 0.75)",
          border: "rgba(255, 255, 255, 0.08)",
          borderHighlight: "rgba(255, 255, 255, 0.16)",
          pill: "rgba(30, 36, 52, 0.85)"
        },
        accent: {
          emerald: "#00e5a3",
          cyan: "#38bdf8",
          amber: "#f59e0b",
          rose: "#f43f5e",
          indigo: "#6366f1"
        }
      },
      backdropBlur: {
        xs: "2px",
        md: "12px",
        lg: "20px",
        xl: "28px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        card: "0 4px 20px 0 rgba(0, 0, 0, 0.25)",
        glowCyan: "0 0 15px rgba(56, 189, 248, 0.25)",
        glowEmerald: "0 0 15px rgba(0, 229, 163, 0.25)",
        glowAmber: "0 0 15px rgba(245, 158, 11, 0.25)"
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '24px'
      }
    },
  },
  plugins: [],
}
