import type { Config } from "tailwindcss";

// Tailwind CSS v4 Configuration
// In v4, most configuration is done via CSS custom properties and @import statements
const config: Config = {
  // Content paths for file scanning
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Most theme configuration is now handled in CSS
  // This minimal config is for backwards compatibility
};

export default config;
