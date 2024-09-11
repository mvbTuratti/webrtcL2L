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
    nextui({
      addCommonColors: true,
      themes: {
        // extend: {
        //   colors: {
        //     default: {
        //       50: "#18181b",
        //       100: "#27272a",
        //       200: "#3f3f46",
        //       300: "#52525b",
        //       400: "#71717a",
        //       500: "#a1a1aa",
        //       600: "#d4d4d8",
        //       700: "#e4e4e7",
        //       800: "#f4f4f5",
        //       900: "#fafafa"
        //     },
        //   }
        // },
        light: {
          colors: {
            background: "#FFFFFF", // or DEFAULT
            foreground: "#11181C", // or 50 to 900 DEFAULT
            primary: {
              //... 50 to 900
              foreground: "#FFFFFF",
              DEFAULT: "#006FEE",
            },
            // ... rest of the colors
          },
        },
        dark: {
          colors: {
            background: "#000000", // or DEFAULT
            foreground: "#ECEDEE", // or 50 to 900 DEFAULT
            default: {
              50: "#18181b",
              100: "#27272a",
              200: "#3f3f46",
              300: "#52525b",
              400: "#71717a",
              500: "#a1a1aa",
              600: "#d4d4d8",
              700: "#e4e4e7",
              800: "#f4f4f5",
              900: "#fafafa"
            },
            primary: {
              //... 50 to 900
              foreground: "#FFFFFF",
              DEFAULT: "#006FEE",
            },
          },
          // ... rest of the colors
        },
      },
    })
  ]
}

