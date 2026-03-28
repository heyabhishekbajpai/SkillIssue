import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/** Small self-contained avatar that falls back to initials on image error. */
function AvatarImg({ src, name, size = 'w-8 h-8', textSize = 'text-xs' }) {
    const [err, setErr] = useState(false)
    useEffect(() => { setErr(false) }, [src])
    if (src && !err) {
        return (
            <img
                src={src}
                alt={name}
                className={`${size} rounded-full border border-accent/30 object-cover hover:border-accent transition-colors`}
                onError={() => setErr(true)}
            />
        )
    }
    return (
        <div className={`${size} rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center hover:border-accent transition-colors`}>
            <span className={`font-clash font-bold ${textSize} text-accent`}>
                {name?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
        </div>
    )
}

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const { user, profile, isLoggedIn, openAuthModal, signOut } = useAuth()
    const location = useLocation()
    const isHome = location.pathname === '/'

    // Sliding pill indicator
    const pillRef = useRef(null)
    const linkRefs = useRef({})
    const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 })

    const measureIndicator = useCallback(() => {
        const pill = pillRef.current
        const active = linkRefs.current[location.pathname]
        if (pill && active) {
            const pillRect = pill.getBoundingClientRect()
            const activeRect = active.getBoundingClientRect()
            setIndicator({
                left: activeRect.left - pillRect.left,
                width: activeRect.width,
                opacity: 1,
            })
        } else {
            setIndicator(prev => ({ ...prev, opacity: 0 }))
        }
    }, [location.pathname])

    useEffect(() => {
        const id = requestAnimationFrame(measureIndicator)
        return () => cancelAnimationFrame(id)
    }, [measureIndicator])

    useEffect(() => {
        window.addEventListener('resize', measureIndicator)
        return () => window.removeEventListener('resize', measureIndicator)
    }, [measureIndicator])

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false)
    }, [location])

    return (
        <nav className="fixed top-0 left-0 right-0 z-50">
            {/* ── Desktop: All pages → Bar + Centered floating pill ── */}
            <div className={`hidden md:block transition-all duration-500 ${
                scrolled
                    ? 'bg-navy/90 backdrop-blur-xl border-b border-accent/10 shadow-lg shadow-black/20'
                    : 'bg-navy/90 backdrop-blur-xl border-b border-white/5'
            }`}>
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link to="/" className="flex items-center group">
                            <img
                                src="/skill-issue-white.png"
                                alt="Skill Issue"
                                className="h-9 w-auto transition-transform duration-300 group-hover:scale-105"
                            />
                        </Link>

                        {/* Centered pill */}
                        <div
                            ref={pillRef}
                            className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-2 rounded-full border transition-all duration-500 ${
                                scrolled
                                    ? 'bg-navy/80 backdrop-blur-xl border-white/[0.08] shadow-lg shadow-black/20'
                                    : 'bg-white/[0.03] backdrop-blur-md border-white/[0.06]'
                            }`}
                        >
                            {/* Sliding indicator */}
                            <div
                                className="absolute top-2 bottom-2 rounded-full bg-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
                                style={{
                                    left: indicator.left,
                                    width: indicator.width,
                                    opacity: indicator.opacity,
                                }}
                            />
                            {[
                                { to: '/', label: 'Home' },
                                { to: '/browse', label: 'Browse' },
                                { to: '/community', label: 'Community' },
                                { to: '/build', label: 'Build' },
                                { to: '/upload', label: 'Upload' },
                            ].map(({ to, label }) => (
                                <Link
                                    key={to}
                                    ref={el => { linkRefs.current[to] = el }}
                                    to={to}
                                    className={`relative z-[1] px-4 py-2 rounded-full font-satoshi text-[13px] font-medium transition-colors duration-300 ${
                                        location.pathname === to
                                            ? 'text-white'
                                            : 'text-white/55 hover:text-white/90 hover:bg-white/[0.04]'
                                    }`}
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>

                        {/* Auth */}
                        <div>
                            {isLoggedIn ? (
                                <div className="flex items-center gap-3">
                                    <Link
                                        to={profile?.username ? `/user/${profile.username}` : '#'}
                                        title="My Profile"
                                        className="relative group/avatar"
                                    >
                                        <AvatarImg
                                            src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                                            name={profile?.display_name || user?.user_metadata?.full_name || 'User'}
                                        />
                                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap font-satoshi text-[10px] text-white/50 bg-navy border border-white/10 px-2 py-0.5 rounded-md opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none">
                                            @{profile?.username}
                                        </span>
                                    </Link>
                                    <button
                                        onClick={signOut}
                                        className="font-satoshi text-sm text-white/40 hover:text-white/70 transition-colors duration-300"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={openAuthModal}
                                    className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-accent/30 hover:bg-white/10 transition-all duration-300 group"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    <span className="font-satoshi text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                                        Sign in with Google
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Mobile: Same as before (all pages) ── */}
            <div className={`md:hidden transition-all duration-500 ${
                scrolled || mobileOpen
                    ? 'bg-navy/90 backdrop-blur-xl border-b border-accent/10 shadow-lg shadow-black/20'
                    : 'bg-navy/90 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/10'
            }`}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between h-20">
                        <Link to="/" className="flex items-center group">
                            <img
                                src="/skill-issue-white.png"
                                alt="Skill Issue"
                                className="h-9 w-auto transition-transform duration-300 group-hover:scale-105"
                            />
                        </Link>
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="p-2 text-white/70 hover:text-white"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                {mobileOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                                )}
                            </svg>
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileOpen && (
                        <div className="md:hidden pb-6 border-t border-white/5 mt-2 pt-4 space-y-3">
                            {!isHome && (
                                <Link to="/" className="block font-satoshi text-sm text-white/60 hover:text-accent-light py-2">Home</Link>
                            )}
                            <Link to="/browse" className="block font-satoshi text-sm text-white/60 hover:text-accent-light py-2">Browse Skills</Link>
                            <Link to="/community" className={`block font-satoshi text-sm py-2 ${location.pathname === '/community' ? 'text-accent font-medium' : 'text-white/60 hover:text-accent-light'}`}>
                                Community
                            </Link>
                            <Link to="/build" className={`block font-satoshi text-sm py-2 ${location.pathname === '/build' ? 'text-accent font-medium' : 'text-white/60 hover:text-accent-light'}`}>
                                Build a Skill
                            </Link>
                            <Link to="/upload" className={`block font-satoshi text-sm py-2 ${location.pathname === '/upload' ? 'text-accent font-medium' : 'text-white/60 hover:text-accent-light'}`}>
                                Upload Skill
                            </Link>

                            {isLoggedIn ? (
                                <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-white/[0.06]">
                                    <Link
                                        to={profile?.username ? `/user/${profile.username}` : '#'}
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-all"
                                    >
                                        <AvatarImg
                                            src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                                            name={profile?.display_name || user?.user_metadata?.full_name || 'User'}
                                        />
                                        <div>
                                            <p className="font-satoshi text-sm text-white/80 leading-none">
                                                {user?.user_metadata?.full_name ?? 'My Profile'}
                                            </p>
                                            <p className="font-satoshi text-xs text-accent/60 mt-0.5">
                                                @{profile?.username}
                                            </p>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={signOut}
                                        className="font-satoshi text-sm text-white/30 hover:text-white/60 py-1.5 text-left px-3 transition-colors"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={openAuthModal}
                                    className="flex items-center gap-2 mt-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 w-full"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    <span className="font-satoshi text-sm font-medium text-white/80">Sign in with Google</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}
