import { Check, Share2, Download, Bookmark, MessageSquare, Github, Copy, Star, Lock, Globe, Trash2, LogIn } from 'lucide-react'
import { Spinner } from './ui/primitives'

const ICONS = {
    star: Star,
    lock: Lock,
    globe: Globe,
    trash: Trash2,
    signin: LogIn,
    check: Check,
    share: Share2,
    download: Download,
    save: Bookmark,
    comments: MessageSquare,
    github: Github,
    copy: Copy,
}

function ActionButton({ action, compact }) {
    const active = action.active || action.status === 'success'
    const label = action.label || action.ariaLabel
    const Icon = ICONS[action.status === 'success' ? 'check' : action.icon] || Copy
    const variant = action.primary ? 'btn-primary' : 'btn'
    const className = `${variant} ${compact ? 'btn-sm' : ''} ${active && !action.primary ? 'bg-neutral-subtle' : ''} ${action.className || ''}`
    const icon = action.loading
        ? <Spinner size={14} className={action.primary ? 'text-brand-fg' : ''} />
        : <Icon className={`h-4 w-4 ${action.status === 'success' ? '!text-success' : ''}`} fill={(action.icon === 'save' || action.icon === 'star') && active ? 'currentColor' : 'none'} />

    const content = (
        <>
            {icon}
            <span className={compact ? '' : 'hidden sm:inline'}>{label}</span>
        </>
    )

    if (action.href) {
        return (
            <a href={action.href} target="_blank" rel="noopener noreferrer" title={action.title || label} aria-label={action.ariaLabel || label} className={className}>
                {content}
            </a>
        )
    }
    return (
        <button
            type="button"
            onClick={action.onClick}
            disabled={action.disabled || action.loading}
            title={action.title || label}
            aria-label={action.ariaLabel || label}
            aria-pressed={action.icon === 'comments' ? !!action.active : undefined}
            className={className}
        >
            {content}
        </button>
    )
}

export default function SkillActionBar({ actions = [], secondaryActions = [], compact = false, className = '' }) {
    const secondary = secondaryActions.filter(Boolean)
    return (
        <div className={`flex flex-wrap items-center justify-between gap-2 ${className}`}>
            <div className="flex flex-wrap items-center gap-2">
                {actions.filter(Boolean).map((action) => <ActionButton key={action.key || action.label} action={action} compact={compact} />)}
            </div>
            {secondary.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    {secondary.map((action) => <ActionButton key={action.key || action.label} action={action} compact={compact} />)}
                </div>
            )}
        </div>
    )
}
