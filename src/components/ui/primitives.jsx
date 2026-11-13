import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

/* ── Brand ──────────────────────────────────────────────── */
export function Logo({ to = '/', className = '', size = 'md' }) {
    const h = size === 'sm' ? 'h-5' : 'h-6 md:h-7'
    return (
        <Link to={to} className={`inline-flex shrink-0 items-center ${className}`} aria-label="Skill Issue home">
            {/* White wordmark; .logo-wordmark flips it to dark lettering in light theme */}
            <img src="/skill-issue-logo.png" alt="Skill Issue" width={800} height={159} className={`logo-wordmark ${h} w-auto`} />
        </Link>
    )
}

/* ── Avatar with initials fallback ──────────────────────── */
export function Avatar({ src, name = '', size = 32, className = '', square = false }) {
    const [err, setErr] = useState(false)
    useEffect(() => { setErr(false) }, [src])
    const radius = square ? 'rounded-md' : 'rounded-full'
    if (src && !err) {
        return (
            <img
                src={src}
                alt={name}
                width={size}
                height={size}
                loading="lazy"
                onError={() => setErr(true)}
                className={`avatar ${radius} ${className}`}
                style={{ width: size, height: size }}
            />
        )
    }
    const initial = (name || '?').trim().charAt(0).toUpperCase() || '?'
    return (
        <span
            aria-label={name}
            className={`avatar ${radius} inline-flex items-center justify-center bg-neutral-subtle font-semibold text-fg-muted ${className}`}
            style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.42)) }}
        >
            {initial}
        </span>
    )
}

/* ── Dropdown (click-to-open, closes on outside click / Esc) ── */
export function Dropdown({ trigger, children, align = 'right', className = '', menuClassName = '' }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        if (!open) return undefined
        const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
        document.addEventListener('mousedown', onDown)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onDown)
            document.removeEventListener('keydown', onKey)
        }
    }, [open])

    return (
        <div ref={ref} className={`relative ${className}`}>
            {trigger({ open, toggle: () => setOpen((o) => !o) })}
            {open && (
                <div
                    role="menu"
                    className={`menu absolute top-full mt-2 ${align === 'right' ? 'right-0' : 'left-0'} ${menuClassName}`}
                    onClick={(e) => { if (e.target.closest('a,button')) setOpen(false) }}
                >
                    {children}
                </div>
            )}
        </div>
    )
}

/* ── Spinner ────────────────────────────────────────────── */
export function Spinner({ size = 16, className = '' }) {
    return (
        <svg
            role="status"
            aria-label="Loading"
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            className={`animate-spin text-fg-muted ${className}`}
        >
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
            <path d="M15 8a7 7 0 00-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    )
}

/* ── Blankslate (empty state) ───────────────────────────── */
export function Blankslate({ icon: Icon, title, children, action, className = '' }) {
    return (
        <div className={`flex flex-col items-center px-6 py-12 text-center ${className}`}>
            {Icon && <Icon className="mb-3 h-6 w-6 text-fg-muted" strokeWidth={1.75} />}
            {title && <h3 className="mb-1 font-display text-xl font-semibold text-fg">{title}</h3>}
            {children && <p className="max-w-md text-sm text-fg-muted">{children}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    )
}

/* ── Page heading (title + description + actions) ───────── */
export function PageHeader({ title, description, actions, children, className = '' }) {
    return (
        <div className={`border-b border-line-muted pb-4 ${className}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <h1 className="font-display text-2xl font-semibold text-fg">{title}</h1>
                    {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
                </div>
                {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
            </div>
            {children}
        </div>
    )
}

/* ── Google "G" mark (for the OAuth button) ─────────────── */
export function GoogleMark({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    )
}

/* ── Number formatting (1.2k) ───────────────────────────── */
export function formatCount(n) {
    const num = Number(n) || 0
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`
    if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`
    return String(num)
}

/* ── Relative time ("3 days ago") ───────────────────────── */
export function timeAgo(dateStr) {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    if (Number.isNaN(diff) || diff < 0) return ''
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`
    const d = Math.floor(h / 24)
    if (d === 1) return 'yesterday'
    if (d < 30) return `${d} days ago`
    const mo = Math.floor(d / 30)
    if (mo < 12) return `${mo} month${mo === 1 ? '' : 's'} ago`
    const y = Math.floor(d / 365)
    return `${y} year${y === 1 ? '' : 's'} ago`
}

/* ── Category colour dot (like a repo's language dot) ───── */
const CATEGORY_COLORS = {
    coding: '#3178c6',
    development: '#3178c6',
    writing: '#8250df',
    research: '#1a7f37',
    analysis: '#bf8700',
    data: '#bf8700',
    design: '#e34c26',
    marketing: '#db61a2',
    productivity: '#0e8a16',
    business: '#6e5494',
    education: '#2b7489',
    devops: '#384d54',
    security: '#b60205',
}
export function categoryColor(category) {
    const key = String(category || '').toLowerCase()
    if (CATEGORY_COLORS[key]) return CATEGORY_COLORS[key]
    // Stable fallback colour derived from the name
    let h = 0
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 360
    return key ? `hsl(${h} 45% 50%)` : '#818b98'
}
export function CategoryDot({ category, className = '' }) {
    if (!category) return null
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs text-fg-muted ${className}`}>
            <span className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ background: categoryColor(category) }} />
            <span className="capitalize">{category}</span>
        </span>
    )
}
