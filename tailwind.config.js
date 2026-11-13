/** @type {import('tailwindcss').Config} */

// Every colour is a CSS variable holding "R G B" channels (see src/index.css),
// so light/dark switch at runtime and Tailwind opacity modifiers still work.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: ['selector', '[data-theme="dark"]'],
    theme: {
        extend: {
            colors: {
                canvas: {
                    DEFAULT: v('canvas'),
                    subtle: v('canvas-subtle'),
                    inset: v('canvas-inset'),
                    overlay: v('canvas-overlay'),
                },
                fg: {
                    DEFAULT: v('fg'),
                    muted: v('fg-muted'),
                    subtle: v('fg-subtle'),
                    onemphasis: v('fg-onemphasis'),
                },
                line: {
                    DEFAULT: v('line'),
                    muted: v('line-muted'),
                },
                header: {
                    DEFAULT: v('header'),
                    fg: v('header-fg'),
                    line: v('header-line'),
                },
                accent: {
                    DEFAULT: v('accent'),
                    emphasis: v('accent-emphasis'),
                    subtle: v('accent-subtle'),
                    muted: v('accent-muted'),
                },
                brand: {
                    DEFAULT: v('brand'),
                    hover: v('brand-hover'),
                    fg: v('brand-fg'),
                },
                success: {
                    DEFAULT: v('success'),
                    emphasis: v('success-emphasis'),
                    subtle: v('success-subtle'),
                },
                attention: {
                    DEFAULT: v('attention'),
                    subtle: v('attention-subtle'),
                },
                danger: {
                    DEFAULT: v('danger'),
                    emphasis: v('danger-emphasis'),
                    subtle: v('danger-subtle'),
                },
                done: {
                    DEFAULT: v('done'),
                    subtle: v('done-subtle'),
                },
                neutral: {
                    muted: v('neutral-muted'),
                    subtle: v('neutral-subtle'),
                },
            },
            fontFamily: {
                sans: ['"Mona Sans Variable"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Helvetica', 'Arial', 'sans-serif'],
                display: ['"Hubot Sans Variable"', '"Mona Sans Variable"', '-apple-system', '"Segoe UI"', 'sans-serif'],
                mono: ['"Monaspace Neon"', 'ui-monospace', 'SFMono-Regular', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
            },
            fontSize: {
                xxs: ['11px', '16px'],
            },
            borderRadius: {
                DEFAULT: '6px',
                md: '6px',
                lg: '8px',
                xl: '12px',
            },
            boxShadow: {
                sm: '0 1px 0 rgb(var(--shadow) / 0.04)',
                DEFAULT: '0 1px 3px rgb(var(--shadow) / 0.08), 0 1px 0 rgb(var(--shadow) / 0.04)',
                overlay: '0 1px 3px rgb(var(--shadow) / 0.12), 0 8px 24px rgb(var(--shadow) / 0.12)',
                modal: '0 0 0 1px rgb(var(--line) / 1), 0 16px 48px rgb(var(--shadow) / 0.24)',
            },
            maxWidth: {
                page: '1280px',
            },
            keyframes: {
                'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
                'pop-in': {
                    from: { opacity: '0', transform: 'scale(0.98) translateY(4px)' },
                    to: { opacity: '1', transform: 'none' },
                },
            },
            animation: {
                'fade-in': 'fade-in 120ms ease-out',
                'pop-in': 'pop-in 160ms cubic-bezier(0.33, 1, 0.68, 1)',
            },
        },
    },
    plugins: [],
}
