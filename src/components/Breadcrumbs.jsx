import { Link } from 'react-router-dom'

/**
 * Breadcrumb navigation for inner pages.
 *   <Breadcrumbs items={[{ label: 'Browse', to: '/browse' }, { label: 'My Skill' }]} />
 */
export default function Breadcrumbs({ items = [] }) {
    return (
        <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-fg-muted">
                <li>
                    <Link to="/" className="hover:text-accent hover:underline">Home</Link>
                </li>
                {items.map((item, i) => (
                    <li key={i} className="flex items-center gap-1">
                        <span aria-hidden="true" className="text-fg-subtle">/</span>
                        {item.to ? (
                            <Link to={item.to} className="hover:text-accent hover:underline">{item.label}</Link>
                        ) : (
                            <span aria-current="page" className="font-semibold text-fg">{item.label}</span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    )
}
