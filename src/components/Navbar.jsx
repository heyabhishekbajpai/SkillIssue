import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
    Search, Plus, Menu, X, Sun, Moon, Monitor, User, LogOut, Upload, Wand2, ChevronDown,
    BookOpen, Users, Hammer, Compass, Home,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Avatar, Dropdown, GoogleMark, Logo } from './ui/primitives'

const NAV = [
    { to: '/browse', label: 'Explore', icon: Compass },
    { to: '/community', label: 'Community', icon: Users },
    { to: '/build', label: 'Build', icon: Hammer },
    { to: '/about', label: 'Docs', icon: BookOpen },
]

const THEMES = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
]

function HeaderSearch({ className = '', autoFocus = false, onDone }) {
    const navigate = useNavigate()
    const location = useLocation()
    const inputRef = useRef(null)
    const [q, setQ] = useState('')

    // Mirror the current ?q= when on the browse page
    useEffect(() => {
        if (location.pathname === '/browse') {
            setQ(new URLSearchParams(location.search).get('q') || '')
        }
    }, [location.pathname, location.search])

    // "/" focuses search, like most developer tools
    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
            const tag = document.activeElement?.tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return
            e.preventDefault()
            inputRef.current?.focus()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    const submit = (e) => {
        e.preventDefault()
        const term = q.trim()
        navigate(term ? `/browse?q=${encodeURIComponent(term)}` : '/browse')
        inputRef.current?.blur()
        onDone?.()
    }

    return (
        <form role="search" onSubmit={submit} className={`relative ${className}`}>
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input
                ref={inputRef}
                type="search"
                value={q}
                autoFocus={autoFocus}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search skills"
                aria-label="Search skills"
                className="input h-8 bg-canvas pl-8 pr-8 text-sm"
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1.5 font-mono text-[11px] leading-4 text-fg-muted sm:block">
                /
            </kbd>
        </form>
    )
}

function ThemeSwitch() {
    const { preference, resolved, setPreference } = useTheme()
    const Icon = resolved === 'dark' ? Moon : Sun
    return (
        <Dropdown
            trigger={({ toggle }) => (
                <button type="button" onClick={toggle} className="btn btn-icon" aria-label="Change theme" title="Theme">
                    <Icon className="h-4 w-4" />
                </button>
            )}
            menuClassName="min-w-[160px]"
        >
            <p className="px-4 pb-1 text-xs font-semibold text-fg-muted">Theme</p>
            {THEMES.map(({ id, label, icon: I }) => (
                <button
                    key={id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={preference === id}
                    onClick={() => setPreference(id)}
                    className={`menu-item ${preference === id ? 'font-semibold' : ''}`}
                >
                    <I />
                    {label}
                    {preference === id && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
                </button>
            ))}
        </Dropdown>
    )
}

export default function Navbar() {
    const { user, profile, isLoggedIn, openAuthModal, signOut } = useAuth()
    const location = useLocation()
    const [drawer, setDrawer] = useState(false)
    const [mobileSearch, setMobileSearch] = useState(false)
    const { preference, setPreference } = useTheme()

    useEffect(() => { setDrawer(false); setMobileSearch(false) }, [location.pathname, location.search])

    useEffect(() => {
        if (!drawer) return undefined
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const onKey = (e) => { if (e.key === 'Escape') setDrawer(false) }
        window.addEventListener('keydown', onKey)
        return () => {
            document.body.style.overflow = prev
            window.removeEventListener('keydown', onKey)
        }
    }, [drawer])

    const name = profile?.display_name || user?.name || user?.user_metadata?.full_name || 'You'
    const avatarSrc = profile?.avatar_url || user?.user_metadata?.avatar_url
    const profileHref = profile?.username ? `/user/${profile.username}` : null

    return (
        <header className="sticky top-0 z-50 border-b border-header-line bg-header text-header-fg">
            <div className="container-page flex h-14 items-center gap-2 md:h-16 md:gap-3">
                <button
                    type="button"
                    onClick={() => setDrawer(true)}
                    className="btn-invisible btn-icon -ml-2 text-fg md:hidden"
                    aria-label="Open navigation"
                    aria-expanded={drawer}
                >
                    <Menu className="h-5 w-5" />
                </button>

                <Logo className="shrink-0" />

                <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 md:flex">
                    {NAV.map(({ to, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-neutral-subtle ${
                                    isActive ? 'text-fg' : 'text-fg-muted hover:text-fg'
                                }`
                            }
                        >
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-1.5 md:gap-2">
                    <HeaderSearch className="hidden w-56 sm:block lg:w-72" />

                    <button
                        type="button"
                        onClick={() => setMobileSearch((v) => !v)}
                        className="btn-invisible btn-icon text-fg sm:hidden"
                        aria-label="Search skills"
                        aria-expanded={mobileSearch}
                    >
                        <Search className="h-5 w-5" />
                    </button>

                    <Dropdown
                        className="hidden sm:block"
                        trigger={({ toggle }) => (
                            <button type="button" onClick={toggle} className="btn gap-1 px-2" aria-label="Create new">
                                <Plus className="h-4 w-4" />
                                <ChevronDown className="h-3 w-3" />
                            </button>
                        )}
                    >
                        <Link to="/build" className="menu-item"><Wand2 />New skill with AI</Link>
                        <Link to="/upload" className="menu-item"><Upload />Upload a skill</Link>
                    </Dropdown>

                    <div className="hidden md:block"><ThemeSwitch /></div>

                    {isLoggedIn ? (
                        <Dropdown
                            trigger={({ toggle }) => (
                                <button type="button" onClick={toggle} className="flex h-10 w-10 items-center justify-center rounded-full" aria-label="Open user menu">
                                    <Avatar src={avatarSrc} name={name} size={32} />
                                </button>
                            )}
                            menuClassName="w-60"
                        >
                            <div className="flex items-center gap-2 px-4 pb-2">
                                <Avatar src={avatarSrc} name={name} size={32} />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-fg">{name}</p>
                                    {profile?.username && <p className="truncate text-xs text-fg-muted">@{profile.username}</p>}
                                </div>
                            </div>
                            <div className="menu-divider" />
                            {profileHref && <Link to={profileHref} className="menu-item"><User />Your profile</Link>}
                            <Link to="/build" className="menu-item"><Wand2 />New skill</Link>
                            <Link to="/upload" className="menu-item"><Upload />Upload skill</Link>
                            <div className="menu-divider" />
                            <button type="button" onClick={signOut} className="menu-item"><LogOut />Sign out</button>
                        </Dropdown>
                    ) : (
                        <button type="button" onClick={openAuthModal} className="btn btn-sm sm:h-8">
                            <GoogleMark className="h-3.5 w-3.5" />
                            Sign in
                        </button>
                    )}
                </div>
            </div>

            {/* Phone search row */}
            {mobileSearch && (
                <div className="flex items-center gap-2 border-t border-header-line px-4 py-2 sm:hidden">
                    <HeaderSearch className="flex-1" autoFocus onDone={() => setMobileSearch(false)} />
                    <button type="button" onClick={() => setMobileSearch(false)} className="btn-invisible btn-sm shrink-0 text-accent">Cancel</button>
                </div>
            )}

            {/* Mobile navigation drawer */}
            {drawer && createPortal(
                <div className="fixed inset-0 z-[150] md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
                    <div className="absolute inset-0 bg-[rgb(var(--shadow)/0.5)] animate-fade-in" onClick={() => setDrawer(false)} />
                    <div
                        className="absolute inset-y-0 left-0 flex w-[320px] max-w-[85vw] flex-col overflow-y-auto border-r border-line bg-canvas shadow-overlay animate-[drawer-in_200ms_cubic-bezier(0.33,1,0.68,1)]"
                        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
                    >
                        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line-muted px-4">
                            <Logo />
                            <button type="button" autoFocus onClick={() => setDrawer(false)} className="btn-invisible btn-icon -mr-2" aria-label="Close navigation">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {isLoggedIn && (
                            <Link to={profileHref || '#'} className="flex items-center gap-3 border-b border-line-muted px-4 py-4">
                                <Avatar src={avatarSrc} name={name} size={40} />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold">{name}</p>
                                    {profile?.username && <p className="truncate text-sm text-fg-muted">@{profile.username}</p>}
                                </div>
                            </Link>
                        )}

                        <nav className="flex flex-col py-2" aria-label="Mobile">
                            {[{ to: '/', label: 'Home', icon: Home }, ...NAV, { to: '/upload', label: 'Upload a skill', icon: Upload }].map(({ to, label, icon: I }) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    end={to === '/'}
                                    className={({ isActive }) =>
                                        `mx-2 flex items-center gap-3 rounded-md px-3 py-3 text-[15px] ${
                                            isActive ? 'bg-neutral-subtle font-semibold text-fg' : 'text-fg active:bg-neutral-subtle'
                                        }`
                                    }
                                >
                                    <I className="h-5 w-5 text-fg-muted" />
                                    {label}
                                </NavLink>
                            ))}
                        </nav>

                        <div className="border-t border-line-muted px-4 py-4">
                            <p className="mb-2 text-xs font-semibold text-fg-muted">Theme</p>
                            <div className="segmented flex w-full" role="radiogroup" aria-label="Theme">
                                {THEMES.map(({ id, label, icon: I }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        role="radio"
                                        aria-checked={preference === id}
                                        aria-pressed={preference === id}
                                        onClick={() => setPreference(id)}
                                        className="inline-flex flex-1 items-center justify-center gap-1.5"
                                    >
                                        <I className="h-4 w-4" />{label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-auto border-t border-line-muted px-4 py-4">
                            {isLoggedIn ? (
                                <button type="button" onClick={signOut} className="btn btn-block">
                                    <LogOut className="h-4 w-4" />Sign out
                                </button>
                            ) : (
                                <button type="button" onClick={openAuthModal} className="btn-primary btn-block">
                                    Sign in with Google
                                </button>
                            )}
                            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted">
                                <Link to="/terms">Terms</Link>
                                <Link to="/privacy">Privacy</Link>
                                <a href="https://github.com/heyabhishekbajpai" target="_blank" rel="noopener noreferrer">GitHub</a>
                            </div>
                        </div>
                    </div>
                </div>
            , document.body)}
        </header>
    )
}
