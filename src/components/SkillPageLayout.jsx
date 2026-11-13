import { Link } from 'react-router-dom'
import { Avatar } from './ui/primitives'

/**
 * Repository-style page chrome shared by the skill detail pages:
 *   owner / name  [Public]                     [actions]
 *   ───────────── tabs ─────────────
 */
export function SkillRepoHeader({ avatar, avatarSquare = false, owner, ownerTo, ownerHref, name, label, actions, tabs }) {
    const ownerEl = ownerTo
        ? <Link to={ownerTo} className="text-accent hover:underline">{owner}</Link>
        : ownerHref
            ? <a href={ownerHref} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{owner}</a>
            : <span className="text-accent">{owner}</span>

    return (
        <div className="border-b border-line bg-canvas-subtle pt-4 md:pt-6">
            <div className="container-page">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-start gap-2 sm:items-center">
                        <Avatar src={avatar} name={owner} size={24} square={avatarSquare} />
                        <h1 className="min-w-0 break-words font-sans text-lg leading-6 sm:text-xl sm:leading-7">
                            {ownerEl}
                            <span className="mx-1 text-fg-muted">/</span>
                            <strong className="font-semibold text-accent">{name}</strong>
                        </h1>
                        {label && <span className="label mt-0.5 shrink-0 sm:mt-0">{label}</span>}
                    </div>
                    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
                </div>
                {tabs && <div className="-mb-px mt-3">{tabs}</div>}
            </div>
        </div>
    )
}

export function SidebarSection({ title, children, className = '' }) {
    return (
        <section className={`border-b border-line-muted py-5 first:pt-0 last:border-b-0 ${className}`}>
            {title && <h2 className="mb-3 font-sans text-base font-semibold">{title}</h2>}
            {children}
        </section>
    )
}

export function MetaItem({ icon: Icon, children }) {
    return (
        <li className="flex items-center gap-2 text-sm text-fg-muted">
            <Icon className="h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate">{children}</span>
        </li>
    )
}

export function DetailSkeleton() {
    return (
        <div aria-busy="true">
            <div className="border-b border-line bg-canvas-subtle py-6">
                <div className="container-page space-y-3">
                    <div className="skeleton-line h-6 w-72 max-w-full" />
                    <div className="skeleton-line h-4 w-40" />
                </div>
            </div>
            <div className="container-page grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_296px]">
                <div className="box h-96 p-6">
                    <div className="skeleton-line mb-3 h-5 w-1/2" />
                    <div className="skeleton-line mb-2 h-3 w-full" />
                    <div className="skeleton-line mb-2 h-3 w-5/6" />
                    <div className="skeleton-line h-3 w-2/3" />
                </div>
                <div className="space-y-3">
                    <div className="skeleton-line h-4 w-24" />
                    <div className="skeleton-line h-3 w-full" />
                    <div className="skeleton-line h-3 w-3/4" />
                </div>
            </div>
        </div>
    )
}
