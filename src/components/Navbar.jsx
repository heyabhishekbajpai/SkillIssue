import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const { user, profile, isLoggedIn, openAuthModal, signOut } = useAuth()
    const location = useLocation()
    const isHome = location.pathname === '/'

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false)
    }, [location])

    const NavLink = ({ to, href, children }) => {
        if (href) {
            return (
                <a
                    href={href}
                    className="font-satoshi text-sm text-white/60 hover:text-accent-light transition-colors duration-300"
                >
                    {children}
                </a>
            )
        }
        return (
            <Link
                to={to}
                className={`font-satoshi text-sm transition-colors duration-300 ${location.pathname === to
                    ? 'text-accent font-medium'
                    : 'text-white/60 hover:text-accent-light'
                    }`}
            >
                {children}
            </Link>
        )
    }

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                ? 'bg-navy/80 backdrop-blur-xl border-b border-accent/10 shadow-lg shadow-black/20'
                : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center group">
                        <img
                            src="/skill issue white .png"
                            alt="Skill Issue"
                            className="h-9 w-auto transition-transform duration-300 group-hover:scale-105"
                        />
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-8">
                        {isHome ? (
                            <>
                                <NavLink href="#features">Features</NavLink>
                                <NavLink href="#how-it-works">How it Works</NavLink>
                                <NavLink href="#browse">Browse Skills</NavLink>
                            </>
                        ) : (
                            <>
                                <NavLink to="/">Home</NavLink>
                            </>
                        )}
                        <NavLink to="/build">Build a Skill</NavLink>
                    </div>

                    {/* Auth Button */}
                    <div className="hidden md:block">
                        {isLoggedIn ? (
                            <div className="flex items-center gap-3">
                                {/* Clickable avatar → profile */}
                                <Link
                                    to={profile?.username ? `/user/${profile.username}` : '#'}
                                    title="My Profile"
                                    className="relative group/avatar"
                                >
                                    {user?.user_metadata?.avatar_url ? (
                                        <img
                                            src={user.user_metadata.avatar_url}
                                            alt={user.user_metadata.full_name || 'User'}
                                            className="w-8 h-8 rounded-full border border-accent/30 object-cover hover:border-accent transition-colors"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center hover:border-accent transition-colors">
                                            <span className="font-clash font-bold text-xs text-accent">
                                                {user?.user_metadata?.full_name?.charAt(0) ?? 'U'}
                                            </span>
                                        </div>
                                    )}
                                    {/* Tooltip */}
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

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden p-2 text-white/70 hover:text-white"
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
                        {isHome ? (
                            <>
                                <a href="#features" className="block font-satoshi text-sm text-white/60 hover:text-accent-light py-2">Features</a>
                                <a href="#how-it-works" className="block font-satoshi text-sm text-white/60 hover:text-accent-light py-2">How it Works</a>
                                <a href="#browse" className="block font-satoshi text-sm text-white/60 hover:text-accent-light py-2">Browse Skills</a>
                            </>
                        ) : (
                            <Link to="/" className="block font-satoshi text-sm text-white/60 hover:text-accent-light py-2">Home</Link>
                        )}
                        <Link to="/build" className={`block font-satoshi text-sm py-2 ${location.pathname === '/build' ? 'text-accent font-medium' : 'text-white/60 hover:text-accent-light'}`}>
                            Build a Skill
                        </Link>

                        {isLoggedIn ? (
                            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-white/[0.06]">
                                <Link
                                    to={profile?.username ? `/user/${profile.username}` : '#'}
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-all"
                                >
                                    {user?.user_metadata?.avatar_url ? (
                                        <img
                                            src={user.user_metadata.avatar_url}
                                            alt="Profile"
                                            className="w-8 h-8 rounded-full border border-accent/30 object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
                                            <span className="font-clash font-bold text-xs text-accent">
                                                {user?.user_metadata?.full_name?.charAt(0) ?? 'U'}
                                            </span>
                                        </div>
                                    )}
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
        </nav>
    )
}
