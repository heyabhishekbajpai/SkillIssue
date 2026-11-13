import { useEffect, useRef } from 'react'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'

const ICONS = {
    success: <CheckCircle2 className="h-4 w-4 text-success" />,
    error: <AlertCircle className="h-4 w-4 text-danger" />,
    info: <Info className="h-4 w-4 text-accent" />,
}

export default function Toast({ message, variant = 'success', onDismiss, duration = 3000 }) {
    // Keep the latest callback without restarting the timer on every parent render
    const dismissRef = useRef(onDismiss)
    dismissRef.current = onDismiss

    useEffect(() => {
        if (!message || !duration) return undefined
        const timer = window.setTimeout(() => dismissRef.current?.(), duration)
        return () => window.clearTimeout(timer)
    }, [duration, message])

    if (!message) return null

    return (
        <div className="toast pointer-events-none bottom-20 md:bottom-6" role="status" aria-live="polite">
            {ICONS[variant] || ICONS.success}
            <span>{message}</span>
        </div>
    )
}
