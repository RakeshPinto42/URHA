import type { Config } from "tailwindcss";

// Every colour, radius and size is a CSS variable defined in app/globals.css
// (docs/DESIGN.md §3). Components reference roles, never raw hex.
const v = (name: string) => `var(--${name})`;

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ground: v("ground"),
        surface: v("surface"),
        raised: v("raised"),
        border: v("border"),
        rule: v("rule"),
        control: v("control"),
        ink: v("text"),
        muted: v("muted"),
        faint: v("faint"),
        accent: v("accent"),
        positive: v("positive"),
        negative: v("negative"),
        warning: v("warning"),
        active: v("active"),
        primary: v("primary"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        syriac: ["var(--font-syriac)", "serif"],
      },
      borderRadius: { card: "22px", img: "4px" },
      maxWidth: { column: "1100px", read: "68ch" },
    },
  },
  plugins: [],
} satisfies Config;
