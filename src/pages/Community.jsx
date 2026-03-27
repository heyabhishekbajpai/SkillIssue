import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCommunityUsers, getPublicSkillsStatsByUser } from '../lib/userService'
import SEO, { jsonLdSchemas } from '../components/SEO'
import Breadcrumbs from '../components/Breadcrumbs'

// ── Module-level page cache (5 min TTL) ────────────────────────────────
// First 12 users + stats are cached so revisiting the page is instant.
const CACHE_TTL = 5 * 60 * 1000
let _pageCache = null // { users, stats, total, cursor, expiresAt }

// ── Helpers ──────────────────────────────────────────────────

function formatJoined(dateStr) {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    const days = Math.floor((Date.now() - d.getTime()) / 86400000)
    if (days < 1) return 'today'
    if (days === 1) return 'yesterday'
    if (days < 7) return `${days}d ago`
    const weeks = Math.floor(days / 7)
    if (weeks < 52) return `${weeks}w ago`
    const years = Math.floor(weeks / 52)
    return `${years}y ago`
}

// ── Avatar with fallback initials ─────────────────────────────
function Avatar({ src, name }) {
    const [err, setErr] = useState(false)
    useEffect(() => { setErr(false) }, [src])

    const initial = name?.charAt(0)?.toUpperCase() ?? '?'

    return (
        <div
            className="relative shrink-0"
            style={{ width: 64, height: 64 }}
        >
            {/* Glow ring */}
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    background: 'transparent',
                    boxShadow: '0 0 0 2px rgba(75,169,255,0.35), 0 0 18px rgba(75,169,255,0.18)',
                    borderRadius: '50%',
                    zIndex: 1,
                    pointerEvents: 'none',
                }}
            />
            {src && !err ? (
                <img
                    src={src}
                    alt={name}
                    onError={() => setErr(true)}
                    className="w-16 h-16 rounded-full object-cover border-2 border-accent/30 group-hover:border-accent/60 transition-colors duration-300"
                />
            ) : (
                <div className="w-16 h-16 rounded-full bg-accent/10 border-2 border-accent/30 group-hover:border-accent/60 transition-colors duration-300 flex items-center justify-center">
                    <span className="font-clash font-bold text-xl text-accent">{initial}</span>
                </div>
            )}
        </div>
    )
}

// ── Skeleton card ─────────────────────────────────────────────
function SkeletonUserCard() {
    return (
        <div className="flex items-center gap-5 px-6 py-5 rounded-2xl bg-navy-100/60 border border-white/[0.05] animate-pulse">
            <div className="w-16 h-16 rounded-full bg-white/[0.06] shrink-0" />
            <div className="flex-1 min-w-0 space-y-2.5">
                <div className="h-4 w-32 rounded-md bg-white/[0.06]" />
                <div className="h-3 w-20 rounded-md bg-white/[0.04]" />
                <div className="h-3 w-56 rounded-md bg-white/[0.04]" />
                <div className="h-3 w-40 rounded-md bg-white/[0.03] mt-2" />
            </div>
        </div>
    )
}

// ── User card ─────────────────────────────────────────────────
function UserCard({ user, stats, index }) {
    const userStats = stats[user.user_id] || { skills: 0, stars: 0 }

    return (
        <Link
            to={`/user/${user.username}`}
            className="group flex items-center gap-5 px-6 py-5 rounded-2xl border border-white/[0.06] bg-gradient-to-r from-navy-100/70 to-navy/80 hover:border-accent/25 hover:bg-navy-100/90 hover:shadow-[0_0_28px_rgba(75,169,255,0.07)] transition-all duration-300 hover:-translate-y-[1px]"
            style={{ animationDelay: `${index * 40}ms` }}
        >
            {/* Avatar */}
            <Avatar src={user.avatar_url} name={user.display_name || user.username} />

            {/* Info */}
            <div className="flex-1 min-w-0">
                {/* Name + username row */}
                <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-clash font-semibold text-[15px] text-white/90 group-hover:text-white transition-colors duration-200 leading-snug truncate">
                        {user.display_name || user.username}
                    </span>
                    <span className="font-satoshi text-xs text-white/35 shrink-0">
                        @{user.username}
                    </span>
                </div>

                {/* Bio */}
                {user.bio && (
                    <p className="font-satoshi text-sm text-white/45 mt-1 truncate leading-snug">
                        {user.bio}
                    </p>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-0 mt-2.5 flex-wrap">
                    <StatItem
                        icon={
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                            </svg>
                        }
                        label={`${userStats.skills} ${userStats.skills === 1 ? 'skill' : 'skills'}`}
                    />
                    <Dot />
                    <StatItem
                        icon={
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                            </svg>
                        }
                        label={`${userStats.stars} ${userStats.stars === 1 ? 'star' : 'stars'}`}
                    />
                    <Dot />
                    <StatItem
                        icon={
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                        }
                        label={`Joined ${formatJoined(user.created_at)}`}
                    />
                </div>
            </div>

            {/* Chevron */}
            <svg
                className="w-4 h-4 text-white/15 group-hover:text-accent/50 transition-colors duration-300 shrink-0"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
        </Link>
    )
}

function StatItem({ icon, label }) {
    return (
        <span className="flex items-center gap-1 font-satoshi text-[11px] text-white/30">
            <span className="text-accent/35">{icon}</span>
            {label}
        </span>
    )
}

function Dot() {
    return <span className="mx-2 text-white/15 text-[10px] select-none">·</span>
}

// ── Sort options ──────────────────────────────────────────────
const SORT_OPTIONS = [
    { id: 'joined', label: 'Recently Joined' },
    { id: 'stars', label: 'Most Starred' },
    { id: 'skills', label: 'Most Skills' },
]

function sortUsers(users, sortId, stats) {
    const arr = [...users]
    if (sortId === 'stars') {
        return arr.sort((a, b) => (stats[b.user_id]?.stars ?? 0) - (stats[a.user_id]?.stars ?? 0))
    }
    if (sortId === 'skills') {
        return arr.sort((a, b) => (stats[b.user_id]?.skills ?? 0) - (stats[a.user_id]?.skills ?? 0))
    }
    // 'joined' — Appwrite already returns documents ordered by $createdAt DESC.
    // No JS sort needed; return as-is to preserve the server-side order.
    return arr
}

// ── Main Page ───────────────────────────────────────────────────────────────
const PAGE_SIZE = 12

export default function Community() {
    const [allUsers, setAllUsers] = useState([])
    const [stats, setStats] = useState({})
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState(null)
    const [cursor, setCursor] = useState(null)
    const [hasMore, setHasMore] = useState(false)
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState('joined')
    const [sortOpen, setSortOpen] = useState(false)

    // Derived list — filter then sort
    const query = search.trim().toLowerCase()
    const filtered = query
        ? allUsers.filter(u =>
            (u.display_name || '').toLowerCase().includes(query) ||
            (u.username || '').toLowerCase().includes(query)
        )
        : allUsers
    const users = sortUsers(filtered, sort, stats)

    // Initial load
    useEffect(() => {
        let cancelled = false

        async function init() {
            // ── Serve from cache if fresh ─────────────────────────────
            if (_pageCache && Date.now() < _pageCache.expiresAt) {
                console.log('[Community] Cache hit — page loaded from memory')
                setAllUsers(_pageCache.users)
                setStats(_pageCache.stats)
                setCursor(_pageCache.cursor)
                setHasMore(_pageCache.total > _pageCache.users.length)
                setLoading(false)
                return
            }

            setLoading(true)
            setError(null)
            const t0 = performance.now()

            try {
                const [result, skillStats] = await Promise.all([
                    getCommunityUsers({ limit: PAGE_SIZE }),
                    getPublicSkillsStatsByUser(),
                ])
                console.log(`[Community] Users (${result.users.length}/${result.total}): ${(performance.now() - t0).toFixed(0)}ms`)
                if (cancelled) return

                const lastCursor = result.users[result.users.length - 1]?.$id ?? null

                // ── Populate cache ────────────────────────────────────
                _pageCache = {
                    users: result.users,
                    stats: skillStats,
                    total: result.total,
                    cursor: lastCursor,
                    expiresAt: Date.now() + CACHE_TTL,
                }

                setAllUsers(result.users)
                setStats(skillStats)
                setCursor(lastCursor)
                setHasMore(result.users.length < result.total)
            } catch (err) {
                if (!cancelled) setError('Failed to load community members.')
                console.error(err)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        init()
        return () => { cancelled = true }
    }, [])

    async function loadMore() {
        if (!cursor || loadingMore) return
        setLoadingMore(true)
        const t0 = performance.now()
        try {
            const result = await getCommunityUsers({ limit: PAGE_SIZE, cursor })
            console.log(`[Community] Load more (${result.users.length} more, offset ${allUsers.length}): ${(performance.now() - t0).toFixed(0)}ms`)
            const merged = [...allUsers, ...result.users]
            const lastCursor = result.users[result.users.length - 1]?.$id ?? null
            setAllUsers(merged)
            setCursor(lastCursor)
            setHasMore(merged.length < result.total)
            // Update cache with expanded list
            if (_pageCache) {
                _pageCache.users = merged
                _pageCache.cursor = lastCursor
                _pageCache.total = result.total
            }
        } catch (err) {
            console.error('[Community] loadMore error:', err)
        } finally {
            setLoadingMore(false)
        }
    }

    return (
        <div className="min-h-screen pt-28 pb-20 px-6">
            <SEO
                title="AI Skills Community — Discover Skill File Creators"
                description="Meet the community of developers and creators building AI skill files. Browse profiles, discover skills, and connect with fellow AI enthusiasts."
                path="/community"
                jsonLd={jsonLdSchemas.breadcrumb([
                    { name: 'Home', url: '/' },
                    { name: 'Community', url: '/community' },
                ])}
            />
            <div className="max-w-3xl mx-auto">
                <Breadcrumbs items={[{ label: 'Community' }]} />

                {/* Page header */}
                <div className="mb-4">
                    <h1 className="font-clash font-bold text-4xl md:text-5xl text-white mb-3 leading-tight">
                        Community
                    </h1>
                    <p className="font-satoshi text-base text-white/40">
                        Skills made by people, for everyone.
                    </p>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-4" />

                {/* Search + Sort toolbar */}
                <div className="flex items-center gap-3 mb-6">
                    {/* Search */}
                    <div className="relative flex-1">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name or username…"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] focus:border-accent/30 focus:bg-white/[0.05] text-white placeholder:text-white/20 font-satoshi text-sm outline-none transition-all duration-200"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Sort dropdown */}
                    <div className="relative shrink-0">
                        <button
                            onClick={() => setSortOpen(o => !o)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-accent/25 hover:bg-white/[0.05] text-white/50 hover:text-white/80 font-satoshi text-sm transition-all duration-200"
                        >
                            <svg className="w-3.5 h-3.5 text-accent/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                            </svg>
                            <span>{SORT_OPTIONS.find(o => o.id === sort)?.label}</span>
                            <svg className={`w-3.5 h-3.5 text-white/25 transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>

                        {sortOpen && (
                            <>
                                {/* Backdrop */}
                                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-navy-100 border border-white/[0.08] shadow-xl shadow-black/40 z-20 overflow-hidden py-1">
                                    {SORT_OPTIONS.map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => { setSort(opt.id); setSortOpen(false) }}
                                            className={`w-full text-left px-4 py-2.5 font-satoshi text-sm transition-colors duration-150 flex items-center justify-between ${
                                                sort === opt.id
                                                    ? 'text-accent bg-accent/[0.07]'
                                                    : 'text-white/55 hover:text-white/80 hover:bg-white/[0.04]'
                                            }`}
                                        >
                                            {opt.label}
                                            {sort === opt.id && (
                                                <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Error state */}
                {error && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                        </div>
                        <p className="font-satoshi text-sm text-white/40">{error}</p>
                    </div>
                )}

                {/* Loading state */}
                {loading && (
                    <div className="space-y-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <SkeletonUserCard key={i} />
                        ))}
                    </div>
                )}

                {/* Users list */}
                {!loading && !error && (
                    <>
                        {users.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                    </svg>
                                </div>
                                <p className="font-satoshi text-sm text-white/30">No members yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {users.map((user, i) => (
                                    <UserCard
                                        key={user.id || user.$id || user.username}
                                        user={user}
                                        stats={stats}
                                        index={i}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Load more */}
                        {hasMore && (
                            <div className="flex justify-center mt-8">
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-satoshi text-sm font-medium bg-white/[0.04] border border-white/[0.08] hover:border-accent/25 hover:bg-white/[0.07] text-white/50 hover:text-white/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loadingMore ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin text-accent/50" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Loading…
                                        </>
                                    ) : (
                                        'Load more'
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
