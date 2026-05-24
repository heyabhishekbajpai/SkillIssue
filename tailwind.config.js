/** @type {import('tailwindcss').Config} */
export default {
     darkMode: ['selector', '[data-theme="dark"]'],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                navy: {
                    DEFAULT: '#0a0e1a',
                    50: '#0d1225',
                    100: '#111730',
                    200: '#161d3c',
                    300: '#1c2548',
                    400: '#232e55',
                },
                accent: {
                    DEFAULT: '#4ba9ff',
                    light: '#cae8ff',
                    dark: '#2b7fd4',
                    glow: 'rgba(75, 169, 255, 0.3)',
                },
            },
            fontFamily: {
                clash: ['"Clash Display"', 'sans-serif'],
                satoshi: ['Satoshi', 'sans-serif'],
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'marquee': 'marquee var(--duration, 40s) linear infinite',
                'marquee-vertical': 'marquee-vertical var(--duration, 40s) linear infinite',
                'float-slow': 'float 8s ease-in-out infinite',
                'float-slower': 'float 10s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
                'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
                'drift': 'drift 20s linear infinite',
            },
            keyframes: {
                marquee: {
                    from: { transform: 'translateX(0)' },
                    to: { transform: 'translateX(calc(-100% - var(--gap, 1rem)))' },
                },
                'marquee-vertical': {
                    from: { transform: 'translateY(0)' },
                    to: { transform: 'translateY(calc(-100% - var(--gap, 1rem)))' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                'pulse-glow': {
                    '0%, 100%': { opacity: '0.4', filter: 'blur(20px)' },
                    '50%': { opacity: '0.8', filter: 'blur(30px)' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(40px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                drift: {
                    '0%': { transform: 'translate(0, 0) rotate(0deg)' },
                    '25%': { transform: 'translate(10px, -15px) rotate(2deg)' },
                    '50%': { transform: 'translate(-5px, -25px) rotate(-1deg)' },
                    '75%': { transform: 'translate(-15px, -10px) rotate(1deg)' },
                    '100%': { transform: 'translate(0, 0) rotate(0deg)' },
                },
            },
        },
    },
    plugins: [],
}
