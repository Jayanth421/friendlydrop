import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#121922",
        pearl: "#f7f7f2",
        accent: "#ff6f3d",
        sage: "#87b39a",
        mist: "#ecf4f8",
        gold: "#b9914f",
        midnight: "#0d1015",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        display: ["var(--font-cormorant)", "serif"],
        grotesk: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 20px 80px -40px rgba(18,25,34,0.35)",
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at 10% 20%, rgba(255,111,61,0.3), transparent 35%), radial-gradient(circle at 80% 0%, rgba(135,179,154,0.3), transparent 30%)",
      },
      animation: {
        float: "float 5s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
