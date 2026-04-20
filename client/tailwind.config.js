/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-2": "var(--color-primary-2)",
        accent: "var(--color-accent)",
        success: "var(--color-success)",
        danger: "var(--color-danger)",
        warning: "var(--color-warning)",
        excused: "var(--color-excused)"
      },
      boxShadow: {
        card: "var(--elevation-2)",
        "card-lg": "var(--elevation-3)"
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)"
      },
      transitionTimingFunction: {
        smooth: "var(--motion-easing)"
      }
    }
  },
  plugins: []
}
