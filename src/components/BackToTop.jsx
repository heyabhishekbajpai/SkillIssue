import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export default function BackToTop({ threshold = 600 }) {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > threshold)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [threshold])

    if (!visible) return null

    return (
        <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Back to top"
            className="btn btn-icon fixed bottom-6 right-6 z-[60] hidden shadow-overlay md:inline-flex"
        >
            <ArrowUp className="h-4 w-4" />
        </button>
    )
}
