import { NavLink } from 'react-router-dom'

const DOC_NAV = [
    { to: '/about', label: 'About Skill Issue' },
    { to: '/terms', label: 'Terms of Service' },
    { to: '/privacy', label: 'Privacy Policy' },
]

/** Docs-style shell: left navigation + readable article column. */
export default function DocLayout({ children }) {
    return (
        <div className="container-page grid gap-8 py-8 md:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
            <aside className="md:sticky md:top-24 md:self-start">
                <nav aria-label="Documentation" className="flex gap-1 overflow-x-auto scrollbar-hide md:flex-col">
                    <p className="mb-1 hidden px-2 text-xs font-semibold text-fg-muted md:block">Skill Issue docs</p>
                    {DOC_NAV.map(({ to, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `relative shrink-0 rounded-md px-2 py-1.5 text-sm hover:bg-neutral-subtle ${isActive ? 'bg-neutral-subtle font-semibold text-fg' : 'text-fg-muted'}`
                            }
                        >
                            {label}
                        </NavLink>
                    ))}
                </nav>
            </aside>
            <article className="min-w-0 max-w-[760px]">{children}</article>
        </div>
    )
}
