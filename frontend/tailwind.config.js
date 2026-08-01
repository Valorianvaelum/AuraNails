/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        border: "var(--color-border)",
        input: "var(--color-border)",
        ring: "var(--color-brand)",
        background: "var(--color-canvas)",
        foreground: "var(--color-text)",
        primary: {
          DEFAULT: "var(--color-brand)",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "var(--color-surface-muted)",
          foreground: "var(--color-text)",
        },
        destructive: {
          DEFAULT: "var(--color-danger)",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "var(--color-surface-muted)",
          foreground: "var(--color-text-muted)",
        },
        accent: {
          DEFAULT: "var(--color-brand-soft)",
          foreground: "var(--color-brand-hover)",
        },
        card: {
          DEFAULT: "var(--color-surface-raised)",
          foreground: "var(--color-text)",
        },
        popover: {
          DEFAULT: "var(--color-surface-raised)",
          foreground: "var(--color-text)",
        },
      },
      borderRadius: {
        lg: "var(--radius-card)",
        md: "var(--radius-control)",
        sm: "calc(var(--radius-control) - 0.2rem)",
      },
      boxShadow: {
        sm: "var(--shadow-hairline)",
        md: "var(--shadow-raised)",
      },
    },
  },
  plugins: [],
};
