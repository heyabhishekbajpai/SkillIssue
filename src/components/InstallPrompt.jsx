import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        try { if (sessionStorage.getItem('pwa-dismissed')) return undefined } catch { /* ignore */ }
        let timer
        const handler = (e) => {
            e.preventDefault()
            setDeferredPrompt(e)
            timer = setTimeout(() => setVisible(true), 3000)
        }
        window.addEventListener('beforeinstallprompt', handler)
        return () => {
            window.removeEventListener('beforeinstallprompt', handler)
            clearTimeout(timer)
        }
    }, [])

    const install = async () => {
        if (!deferredPrompt) return
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            setVisible(false)
            setDeferredPrompt(null)
        }
    }

    const dismiss = () => {
        setVisible(false)
        try { sessionStorage.setItem('pwa-dismissed', '1') } catch { /* ignore */ }
    }

    if (!visible) return null

    return (
        <div className="fixed bottom-20 left-1/2 z-[95] flex w-[min(380px,calc(100vw-32px))] -translate-x-1/2 items-center gap-3 rounded-lg border border-line bg-canvas-overlay p-3 shadow-overlay animate-pop-in md:bottom-6">
            <img src="/favicon.png" alt="" width={36} height={36} className="h-9 w-9 rounded-md ring-1 ring-line" />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-fg">Install Skill Issue</p>
                <p className="text-xs text-fg-muted">Add it to your home screen for quick access.</p>
            </div>
            <button type="button" onClick={install} className="btn-primary btn-sm">
                <Download className="h-3.5 w-3.5" />
                Install
            </button>
            <button type="button" onClick={dismiss} className="btn-invisible btn-icon btn-sm" aria-label="Dismiss">
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}
