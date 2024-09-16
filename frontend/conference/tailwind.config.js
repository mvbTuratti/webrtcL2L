/** @type {import('tailwindcss').Config} */

const { nextui } = require("@nextui-org/react");

export default {
  content: ["./src/**/*.{html,js,tsx,css}","./src/*.{html,js,tsx,css}", 
            // 'node_modules/flowbite-react/lib/esm/**/*.js',
            "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      extend: {
        fontFamily: {
          "desktop-body-1-regular-16px": "var(--desktop-body-1-regular-16px-font-family)",
          "desktop-body-1-semibold-16px": "var(--desktop-body-1-semibold-16px-font-family)",
          "desktop-body-2-regular-14px": "var(--desktop-body-2-regular-14px-font-family)",
          "desktop-body-2-semibold-14px": "var(--desktop-body-2-semibold-14px-font-family)",
          "desktop-button-semibold-16px": "var(--desktop-button-semibold-16px-font-family)",
          "desktop-caption-regular-12px": "var(--desktop-caption-regular-12px-font-family)",
          "desktop-caption-semibold-12px": "var(--desktop-caption-semibold-12px-font-family)",
          "desktop-heading-1-semibold-80px": "var(--desktop-heading-1-semibold-80px-font-family)",
          "desktop-heading-2-semibold-60px": "var(--desktop-heading-2-semibold-60px-font-family)",
          "desktop-heading-3-semibold-48px": "var(--desktop-heading-3-semibold-48px-font-family)",
          "desktop-heading-4-semibold-34px": "var(--desktop-heading-4-semibold-34px-font-family)",
          "desktop-heading-5-semibold-24px": "var(--desktop-heading-5-semibold-24px-font-family)",
          "desktop-heading-6-semibold-20px": "var(--desktop-heading-6-semibold-20px-font-family)",
          "desktop-link-semibold-14px": "var(--desktop-link-semibold-14px-font-family)",
          "desktop-overline-medium-10px": "var(--desktop-overline-medium-10px-font-family)",
          "desktop-paragraph-18px": "var(--desktop-paragraph-18px-font-family)",
          "desktop-subtitle-1-semibold-16px": "var(--desktop-subtitle-1-semibold-16px-font-family)",
          "desktop-subtitle-2-semibold-14px": "var(--desktop-subtitle-2-semibold-14px-font-family)",
          "mobile-body-1-regular-16px": "var(--mobile-body-1-regular-16px-font-family)",
          "mobile-body-2-regular-14px": "var(--mobile-body-2-regular-14px-font-family)",
          "mobile-button-semibold-16px": "var(--mobile-button-semibold-16px-font-family)",
          "mobile-caption-regular-12px": "var(--mobile-caption-regular-12px-font-family)",
          "mobile-h1-semibold-72px": "var(--mobile-h1-semibold-72px-font-family)",
          "mobile-h2-semibold-48px": "var(--mobile-h2-semibold-48px-font-family)",
          "mobile-h3-semibold-40px": "var(--mobile-h3-semibold-40px-font-family)",
          "mobile-h4-semibold-28px": "var(--mobile-h4-semibold-28px-font-family)",
          "mobile-h5-semibold-24px": "var(--mobile-h5-semibold-24px-font-family)",
          "mobile-h6-semibold-20px": "var(--mobile-h6-semibold-20px-font-family)",
          "mobile-overline-medium-10px": "var(--mobile-overline-medium-10px-font-family)",
          "mobile-subtitle-1-medium-16px": "var(--mobile-subtitle-1-medium-16px-font-family)",
          "mobile-subtitle-2-medium-14px": "var(--mobile-subtitle-2-medium-14px-font-family)",
        },
      },
    },
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

