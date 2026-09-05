/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0D12",
        surface: "#141821",
        "surface-raised": "#1B202B",
        border: "#262C38",
        text: {
          primary: "#E7EAF0",
          muted: "#8892A4",
        },
        verdict: {
          safe: "#3FBF8B",
          low: "#4FB8C4",
          medium: "#E3A73E",
          high: "#E5484D",
        },
        accent: "#5B7FFF",
      },
      fontFamily: {
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
        sans: ["IBM Plex Sans", "ui-sans-serif", "system-ui"],
      },
      borderRadius: {
        DEFAULT: "4px",
      },
    },
  },
  plugins: [],
};
