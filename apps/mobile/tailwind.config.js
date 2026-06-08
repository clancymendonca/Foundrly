/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          100: "#FFE8F0",
          DEFAULT: "#4E71FF",
        },
        secondary: "#FBE843",
      },
      fontFamily: {
        "work-sans": ["WorkSans"],
      },
    },
  },
  plugins: [],
};
