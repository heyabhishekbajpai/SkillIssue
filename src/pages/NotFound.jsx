import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

export default function NotFound() {
    return (
        <>
            <SEO
                title="Page Not Found"
                description="The page you're looking for doesn't exist. Browse AI skills or return to the homepage."
                noindex={true}
            />
            <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
                <p className="font-mono text-sm text-fg-muted">Error 404</p>
                <h1 className="mt-2 font-display text-4xl font-semibold">This is not the skill you’re looking for.</h1>
                <p className="mt-3 max-w-md text-fg-muted">The page doesn’t exist or has been moved.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <Link to="/" className="btn">Go home</Link>
                    <Link to="/browse" className="btn-primary">Explore skills</Link>
                </div>
            </div>
        </>
    )
}
