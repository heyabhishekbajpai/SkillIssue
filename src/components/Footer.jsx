import { Link } from 'react-router-dom'

const COLUMNS = [
    {
        title: 'Product',
        links: [
            { label: 'Explore skills', to: '/browse' },
            { label: 'Skill builder', to: '/build' },
            { label: 'Upload a skill', to: '/upload' },
            { label: 'Private vault', to: '/coming-soon?feature=Private%20Vault' },
            { label: 'Pricing', to: '/coming-soon?feature=Pricing' },
        ],
    },
    {
        title: 'Resources',
        links: [
            { label: 'What are AI skills?', to: '/about' },
            { label: 'Skill format guide', to: '/about' },
            { label: 'Community', to: '/community' },
        ],
    },
    {
        title: 'Company',
        links: [
            { label: 'About', to: '/about' },
            { label: 'X / Twitter', href: 'https://x.com/BajpaiX' },
            { label: 'GitHub', href: 'https://github.com/heyabhishekbajpai' },
            { label: 'Support on Ko-fi', href: 'https://ko-fi.com/abhishekbajpai' },
        ],
    },
]

export default function Footer() {
    return (
        <footer className="mt-8 border-t border-line-muted bg-canvas-subtle">
            <div className="container-page py-10">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2">
                            <img src="/favicon.png" alt="" width={24} height={24} loading="lazy" className="h-6 w-6 rounded-full ring-1 ring-line" />
                            <span className="font-display text-sm font-semibold">Skill Issue</span>
                        </div>
                        <p className="mt-3 max-w-xs text-sm text-fg-muted">
                            The open registry for AI agent skills. Discover, build and share SKILL.md files for every agent.
                        </p>
                    </div>
                    {COLUMNS.map((col) => (
                        <div key={col.title}>
                            <h2 className="mb-3 font-sans text-sm font-semibold text-fg">{col.title}</h2>
                            <ul className="space-y-2">
                                {col.links.map(({ label, to, href }) => (
                                    <li key={label}>
                                        {to ? (
                                            <Link to={to} className="text-sm text-fg-muted hover:text-accent hover:underline">{label}</Link>
                                        ) : (
                                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-fg-muted hover:text-accent hover:underline">{label}</a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-10 flex flex-col gap-4 border-t border-line-muted pt-6 text-xs text-fg-muted sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span>© {new Date().getFullYear()} Skill Issue</span>
                        <Link to="/terms" className="hover:text-accent hover:underline">Terms</Link>
                        <Link to="/privacy" className="hover:text-accent hover:underline">Privacy</Link>
                        <Link to="/about" className="hover:text-accent hover:underline">About</Link>
                    </div>
                    <a
                        href="https://www.bajpai.tech"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 hover:text-fg"
                    >
                        Built by
                        <img
                            src="/bajpailogo.png"
                            alt="Bajpai Tech"
                            loading="lazy"
                            width={80}
                            height={20}
                            className="h-4 w-auto opacity-80 [[data-theme=light]_&]:invert"
                        />
                    </a>
                </div>
            </div>
        </footer>
    )
}
