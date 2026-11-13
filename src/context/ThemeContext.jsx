import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'si-theme'

function readPreference() {
    try {
        const v = localStorage.getItem(STORAGE_KEY)
        if (v === 'light' || v === 'dark' || v === 'system') return v
    } catch { /* storage blocked */ }
    return 'system'
}

function systemTheme() {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function apply(resolved) {
    document.documentElement.dataset.theme = resolved
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', resolved === 'dark' ? '#010409' : '#f6f8fa')
}

export function ThemeProvider({ children }) {
    const [preference, setPreferenceState] = useState(readPreference)
    const [resolved, setResolved] = useState(() => (preference === 'system' ? systemTheme() : preference))

    useEffect(() => {
        const next = preference === 'system' ? systemTheme() : preference
        setResolved(next)
        apply(next)
        if (preference !== 'system') return undefined
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const onChange = () => {
            const r = mq.matches ? 'dark' : 'light'
            setResolved(r)
            apply(r)
        }
        mq.addEventListener?.('change', onChange)
        return () => mq.removeEventListener?.('change', onChange)
    }, [preference])

    const setPreference = useCallback((p) => {
        setPreferenceState(p)
        try { localStorage.setItem(STORAGE_KEY, p) } catch { /* ignore */ }
    }, [])

    return (
        <ThemeContext.Provider value={{ preference, resolved, setPreference }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    // Fallback keeps isolated component tests working without the provider
    return ctx ?? { preference: 'system', resolved: 'light', setPreference: () => {} }
}
