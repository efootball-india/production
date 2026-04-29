import type { Config } from "tailwindcss";

/* ============================================================
   eFTBL · Tailwind Config
   ------------------------------------------------------------
   Extends shadcn defaults with:
   - Editorial color tokens (ink, accent, accent-dim, etc.)
   - Archivo + JetBrains Mono fonts (loaded in layout.tsx)
   - Editorial typography scale
   - Disabled border-radius (editorial = sharp corners)
   ============================================================ */

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        /* shadcn-mapped (these inherit from CSS variables) */
        border: "hsl(var(--border) / 0.08)",  // softer hairline by default
        input: "hsl(var(--input) / 0.20)",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          2: "hsl(var(--accent-2))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        /* Editorial extensions — use these in JSX */
        ink: "hsl(var(--ink))",
        bg: "hsl(var(--bg))",
        surface: "hsl(var(--surface))",
        "surface-2": "hsl(var(--surface-2))",
        live: "hsl(var(--live))",
        warn: "hsl(var(--warn))",
      },
      fontFamily: {
        sans: ["var(--font-archivo)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-archivo)", "system-ui", "sans-serif"],
      },
      fontSize: {
        /* Editorial display sizes — for use as text-display-* */
        "display-sm": ["32px", { lineHeight: "1", letterSpacing: "-0.025em", fontWeight: "900" }],
        "display-md": ["56px", { lineHeight: "0.92", letterSpacing: "-0.035em", fontWeight: "900" }],
        "display-lg": ["84px", { lineHeight: "0.88", letterSpacing: "-0.04em", fontWeight: "900" }],
        "display-xl": ["120px", { lineHeight: "0.84", letterSpacing: "-0.045em", fontWeight: "900" }],
      },
      letterSpacing: {
        "label": "0.14em",
        "label-loose": "0.18em",
        "label-extra": "0.22em",
      },
      borderRadius: {
        lg: "0",       /* editorial = no rounded corners */
        md: "0",
        sm: "0",
      },
      boxShadow: {
        "brutal": "6px 6px 0 hsl(var(--ink))",
        "brutal-sm": "4px 4px 0 hsl(var(--ink))",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.85)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-dot": "pulse-dot 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
