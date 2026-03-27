import { Link } from 'react-router-dom'

/**
 * Breadcrumb navigation for inner pages.
 * 
 * Usage:
 *   <Breadcrumbs items={[{ label: 'Browse', to: '/browse' }, { label: 'My Skill' }]} />
 */
export default function Breadcrumbs({ items = [] }) {
    return (
        <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-1.5 font-satoshi text-xs text-white/30">
                <li>
                    <Link to="/" className="hover:text-accent transition-colors">Home</Link>
                </li>
                {items.map((item, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                        {item.to ? (
                            <Link to={item.to} className="hover:text-accent transition-colors">{item.label}</Link>
                        ) : (
                            <span className="text-white/50">{item.label}</span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    )
}
