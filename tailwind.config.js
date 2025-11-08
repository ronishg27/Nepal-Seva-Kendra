// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: "#f0f9ff",
                    100: "#e0f2fe",
                    500: "#0ea5e9",
                    600: "#0284c7",
                    700: "#0369a1",
                },
                // Nepal government palette
                'nepal-red': '#DC1E2D',
                'nepal-blue': '#003893',
                'nepal-darkBlue': '#00296B',
                'nepal-gray': '#f5f6f7',
                'nepal-gold': '#C8A96A',
            },
            fontFamily: {
                sans: ["Inter", "Noto Sans Devanagari", "system-ui", "sans-serif"],
                dev: ["Noto Sans Devanagari", "sans-serif"],
            },
            container: {
                center: true,
                padding: {
                    DEFAULT: '1rem',
                    sm: '1rem',
                    lg: '2rem',
                    xl: '2rem',
                    '2xl': '3rem',
                },
            },
        },
    },
    plugins: [],
};
