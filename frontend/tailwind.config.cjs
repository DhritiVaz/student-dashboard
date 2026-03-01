/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans Variable', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Surfaces
        canvas:  "#f5f5f5",
        surface: "#ffffff",
        dark:    "#0a0a0a",
        "dark-card": "#141414",

        // Text
        "text-primary": "#111827",
        "text-muted":   "#6b7280",
        "text-subtle":  "#9ca3af",

        // Borders
        border:       "#e5e7eb",
        "border-mid": "#d1d5db",
        "border-dark":"rgba(255,255,255,0.08)",

        // Feedback
        error:   "#ef4444",
        success: "#10b981",
      },
      borderRadius: {
        input: "10px",
        card:  "16px",
        pill:  "9999px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)",
        "card-md": "0 4px 12px -2px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};
