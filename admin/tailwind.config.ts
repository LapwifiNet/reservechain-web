import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0E1116",
        surface: "#171A21",
        "surface-2": "#1F232C",
        border: "#2A2F3A",
        text: "#ECEEF1",
        "text-2": "#A2ABB8",
        copper: "#C0703B",
        nickel: "#6B7785",
        brand: "#2783DE",
        success: "#46A171",
        warning: "#D5803B",
        danger: "#E56458",
      },
    },
  },
  plugins: [],
};

export default config;
