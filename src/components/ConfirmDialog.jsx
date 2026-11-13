import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Spinner } from './ui/primitives'

/**
 * Generic confirmation dialog.
 *   title, message, confirmLabel, onConfirm (async), onCancel, working
 */
export default function ConfirmDialog({
    title = 'Are you sure?',
    message,
    confirmLabel = 'Delete',
    onConfirm,
    onCancel,
    working = false,
}) {
    useEffect(() => {
        const h = (e) => e.key === 'Escape' && !working && onCancel()
        window.addEventListener('keydown', h)
        return () => window.removeEventListener('keydown', h)
    }, [working, onCancel])

    return createPortal(
        <div className="modal-overlay z-[300]" onClick={() => !working && onCancel()}>
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                className="modal-card max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-line-muted px-4 py-3">
                    <h3 id="confirm-title" className="font-sans text-sm font-semibold">{title}</h3>
                    <button type="button" onClick={onCancel} disabled={working} className="btn-invisible btn-icon btn-sm" aria-label="Close">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                {message && <div className="px-4 py-4 text-sm text-fg-muted">{message}</div>}
                <div className="flex justify-end gap-2 border-t border-line-muted bg-canvas-subtle px-4 py-3">
                    <button type="button" onClick={onCancel} disabled={working} className="btn">Cancel</button>
                    <button type="button" onClick={onConfirm} disabled={working} className="btn-danger">
                        {working && <Spinner size={14} />}
                        {working ? 'Working…' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
