import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import SEO from '../components/SEO'

export default function ComingSoon() {
    const location = useLocation()
    const [feature, setFeature] = useState('New Feature')
    const [email, setEmail] = useState('')
    const [subscribed, setSubscribed] = useState(false)

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search)
        const f = queryParams.get('feature')
        if (f) {
            setFeature(f)
        } else if (location.pathname.includes('vault')) {
            setFeature('Private Vault')
        } else if (location.pathname.includes('pricing')) {
            setFeature('Premium Pricing Plans')
        }
    }, [location])

    const handleSubmit = (e) => {
        e.preventDefault()
        if (email.trim()) {
            setSubscribed(true)
            setEmail('')
        }
    }

    return (
        <>
            <SEO
                title={`${feature} - Coming Soon`}
                description={`Get ready for ${feature}! We are working hard to bring this feature to Skill Issue. Subscribe for updates.`}
                noindex={true}
            />
            <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
                <div className="box w-full max-w-lg overflow-hidden">
                    <div className="p-8 text-center">
                        <span className="label label-done">Coming soon</span>
                        <h1 className="mt-4 font-display text-3xl font-semibold">{feature}</h1>
                        <p className="mx-auto mt-2 max-w-md text-fg-muted">
                            We’re building {feature} for Skill Issue. Leave your email and we’ll let you know when it ships.
                        </p>
                        {subscribed ? (
                            <p className="flash flash-success mt-6 text-sm">Thanks! We’ll notify you as soon as it’s live.</p>
                        ) : (
                            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-2 sm:flex-row">
                                <label htmlFor="cs-email" className="sr-only">Email address</label>
                                <input
                                    id="cs-email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="input flex-1"
                                />
                                <button type="submit" className="btn-primary">Notify me</button>
                            </form>
                        )}
                    </div>
                    <div className="flex justify-center gap-2 border-t border-line-muted bg-canvas-subtle px-4 py-3">
                        <Link to="/" className="btn btn-sm">Home</Link>
                        <Link to="/browse" className="btn btn-sm">Explore skills</Link>
                    </div>
                </div>
            </div>
        </>
    )
}
