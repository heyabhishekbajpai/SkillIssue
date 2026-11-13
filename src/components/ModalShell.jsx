import { useEffect, useRef, useState, useCallback } from 'react'

let cachedModalSize = null

function defaultSize() {
    return cachedModalSize || {
        width: Math.min(1100, Math.round(window.innerWidth * 0.90)),
        height: Math.round(window.innerHeight * 0.88),
    }
}

function getFocusable(container) {
    if (!container) return []
    return Array.from(container.querySelectorAll([
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
    ].join(','))).filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'))
}

export default function ModalShell({
    children,
    onClose,
    titleId,
    ariaLabel,
    className = '',
    panelClassName = '',
    contentClassName = '',
    resizable = true,
}) {
    const panelRef = useRef(null)
    const openerRef = useRef(null)
    const dragRef = useRef(null)
    const isResizing = useRef(false)
    const [size, setSize] = useState(defaultSize)
    // Phones get a full-screen sheet instead of a floating, resizable window
    const [isPhone, setIsPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 639px)').matches)
    useEffect(() => {
        const mq = window.matchMedia?.('(max-width: 639px)')
        if (!mq) return undefined
        const onChange = () => setIsPhone(mq.matches)
        mq.addEventListener?.('change', onChange)
        return () => mq.removeEventListener?.('change', onChange)
    }, [])

    useEffect(() => {
        openerRef.current = document.activeElement
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        window.setTimeout(() => {
            const first = getFocusable(panelRef.current)[0]
            ;(first || panelRef.current)?.focus()
        }, 0)
        return () => {
            document.body.style.overflow = previousOverflow
            if (openerRef.current && typeof openerRef.current.focus === 'function') {
                openerRef.current.focus()
            }
        }
    }, [])

    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.stopPropagation()
                onClose?.()
                return
            }
            if (event.key !== 'Tab') return
            const focusable = getFocusable(panelRef.current)
            if (focusable.length === 0) {
                event.preventDefault()
                panelRef.current?.focus()
                return
            }
            const first = focusable[0]
            const last = focusable[focusable.length - 1]
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [onClose])

    const onResizeMouseDown = useCallback((event) => {
        if (!resizable) return
        event.preventDefault()
        event.stopPropagation()
        isResizing.current = true
        dragRef.current = {
            startX: event.clientX,
            startY: event.clientY,
            startW: size.width,
            startH: size.height,
        }
        const onMove = (moveEvent) => {
            if (!isResizing.current) return
            const dx = moveEvent.clientX - dragRef.current.startX
            const dy = moveEvent.clientY - dragRef.current.startY
            const next = {
                width: Math.min(Math.max(dragRef.current.startW + dx, 480), window.innerWidth - 32),
                height: Math.min(Math.max(dragRef.current.startH + dy, 400), window.innerHeight - 32),
            }
            cachedModalSize = next
            setSize(next)
        }
        const onUp = () => {
            isResizing.current = false
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
            document.body.style.userSelect = ''
            document.body.style.cursor = ''
        }
        document.body.style.userSelect = 'none'
        document.body.style.cursor = 'se-resize'
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
    }, [resizable, size])

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center ${isPhone ? '' : 'p-2'} ${className}`} onClick={onClose}>
            <div className="absolute inset-0 bg-[rgb(var(--shadow)/0.5)] animate-fade-in" />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-label={ariaLabel}
                tabIndex={-1}
                onClick={(event) => event.stopPropagation()}
                className={`relative rounded-xl bg-canvas-overlay shadow-modal overflow-hidden flex flex-col animate-pop-in outline-none ${panelClassName}`}
                style={isPhone ? { width: '100vw', height: '100dvh', borderRadius: 0 } : resizable ? { width: size.width, height: size.height, maxWidth: 'calc(100vw - 16px)', maxHeight: 'calc(100vh - 16px)' } : undefined}
            >
                <div className={`relative h-full ${contentClassName}`}>{children}</div>
                {resizable && !isPhone && (
                    <div
                        onMouseDown={onResizeMouseDown}
                        className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize z-10 flex items-end justify-end p-2 group"
                        title="Drag to resize"
                        aria-hidden="true"
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-fg-subtle group-hover:text-fg-muted transition-colors">
                            <path d="M1 11 L11 11 L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    )
}
