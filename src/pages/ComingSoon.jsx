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
            <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 relative overflow-hidden py-12">
                {/* Visual Highlight Background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

                {/* Main Glassmorphic Card */}
                <div className="relative z-10 max-w-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl p-8 sm:p-12 rounded-3xl shadow-2xl flex flex-col items-center">
                    {/* Badge */}
                    <span className="px-3 py-1 rounded-full text-xs font-semibold tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 mb-6 uppercase">
                        Coming Soon
                    </span>

                    <h1 className="text-4xl sm:text-5xl font-extrabold font-clash text-white tracking-tight mb-4">
                        {feature}
                    </h1>

                    <p className="text-white/60 text-base sm:text-lg mb-8 max-w-md leading-relaxed">
                        We are currently building the ultimate {feature} experience for AI skill management. Stay tuned!
                    </p>

                    {subscribed ? (
                        <div className="w-full max-w-md p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-satoshi text-sm mb-8 animate-fade-in">
                            ✨ Thank you! We will notify you as soon as this feature goes live.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col sm:flex-row gap-3 mb-8">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email to get notified"
                                className="flex-1 px-5 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-indigo-500 transition-all duration-300"
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:scale-[1.02]"
                            >
                                Notify Me
                            </button>
                        </form>
                    )}

                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link
                            to="/"
                            className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all duration-300 text-sm font-medium"
                        >
                            Return Home
                        </Link>
                        <Link
                            to="/browse"
                            className="px-6 py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300 text-sm font-medium"
                        >
                            Browse Skills
                        </Link>
                    </div>
                </div>
            </div>
        </>
    )
}
