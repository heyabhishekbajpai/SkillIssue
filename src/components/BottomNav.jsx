import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function AvatarIcon({ src, name }) {
    const [err, setErr] = useState(false)
    useEffect(() => { setErr(false) }, [src])
    if (src && !err) {
        return (
            <img
                src={src}
                alt={name}
                className="w-7 h-7 rounded-full object-cover"
                onError={() => setErr(true)}
            />
        )
    }
    return (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
    )
}

export default function BottomNav() {
    const { user, profile, isLoggedIn, openAuthModal } = useAuth()
    const location = useLocation()
    const p = location.pathname

    const profileHref = isLoggedIn && profile?.username
        ? `/user/${profile.username}`
        : null

    function activeClass(path) {
        return p === path ? 'text-accent' : 'text-white/35'
    }

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-50"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            {/* Thin top border glow */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

            <div className="bg-navy/95 backdrop-blur-xl flex items-center justify-around px-4 py-2">

                {/* Home */}
                <Link to="/" className={`flex items-center justify-center w-10 h-10 ${activeClass('/')}`}>
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={p === '/' ? 2.2 : 1.7}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                </Link>

                {/* Browse */}
                <Link to="/browse" className={`flex items-center justify-center w-10 h-10 ${activeClass('/browse')}`}>
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={p === '/browse' ? 2.2 : 1.7}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                </Link>

                {/* Build — center accent button, within bar */}
                <Link to="/build" className="flex items-center justify-center">
                    <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95 ${
                            p === '/build'
                                ? 'bg-accent shadow-[0_0_20px_rgba(75,169,255,0.5)]'
                                : 'bg-accent shadow-[0_0_12px_rgba(75,169,255,0.3)]'
                        }`}
                    >
                        <svg className="w-6 h-6 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </div>
                </Link>

                {/* Community */}
                <Link to="/community" className={`flex items-center justify-center w-10 h-10 ${activeClass('/community')}`}>
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={p === '/community' ? 2.2 : 1.7}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                </Link>

                {/* Profile */}
                {profileHref ? (
                    <Link
                        to={profileHref}
                        className={`flex items-center justify-center w-10 h-10 ${p.startsWith('/user/') ? 'text-accent' : 'text-white/35'}`}
                    >
                        <div className={`w-7 h-7 rounded-full overflow-hidden flex items-center justify-center border ${p.startsWith('/user/') ? 'border-accent' : 'border-white/20'}`}>
                            <AvatarIcon
                                src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                                name={profile?.display_name || 'User'}
                            />
                        </div>
                    </Link>
                ) : (
                    <button
                        onClick={openAuthModal}
                        className="flex items-center justify-center w-10 h-10 text-white/35"
                    >
                        <AvatarIcon src={null} name="User" />
                    </button>
                )}

            </div>
        </nav>
    )
}
