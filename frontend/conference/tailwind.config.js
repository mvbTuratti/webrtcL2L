/** @type {import('tailwindcss').Config} */

const { nextui } = require("@nextui-org/react");

export default {
  content: ["./src/**/*.{html,js,tsx,css}","./src/*.{html,js,tsx,css}", 
            // 'node_modules/flowbite-react/lib/esm/**/*.js',
            "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  darkMode: "class",

  plugins: [
    nextui()
  ]
}

