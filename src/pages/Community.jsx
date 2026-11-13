import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, X, BookMarked, Star, CalendarDays, UserPlus, Clock, UserCheck, Users, AlertCircle } from 'lucide-react'
import { getCommunityUsers, getPublicSkillsStatsByUser } from '../lib/userService'
import { getFollowStatus, sendFollowRequest, unfollowUser } from '../lib/followService'
import { useAuth } from '../context/AuthContext'
import SEO, { jsonLdSchemas } from '../components/SEO'
import { Avatar, Blankslate, PageHeader, Spinner, formatCount, timeAgo } from '../components/ui/primitives'

// ── Module-level page cache (5 min TTL) ────────────────────────────────
// First page of users + stats is cached so revisiting the page is instant.
const CACHE_TTL = 5 * 60 * 1000
let _pageCache = null // { users, stats, total, cursor, expiresAt }

function SkeletonRow() {
    return (
        <div className="box-row flex items-center gap-4 py-4">
            <div className="skeleton-line h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
                <div className="skeleton-line h-4 w-40" />
                <div className="skeleton-line h-3 w-64 max-w-full" />
            </div>
        </div>
    )
}

function FollowButton({ userId, currentUserId }) {
    const [status, setStatus] = useState('none')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!currentUserId || userId === currentUserId) return
        setLoading(true)
        getFollowStatus(userId)
            .then((s) => setStatus(s === 'accepted' ? 'following' : s))
            .catch(() => setStatus('none'))
            .finally(() => setLoading(false))
    }, [userId, currentUserId])

    if (!currentUserId || userId === currentUserId) return null

    async function handleClick(e) {
        e.preventDefault()
        e.stopPropagation()
        if (loading) return
        setLoading(true)
        try {
            if (status === 'none') {
                await sendFollowRequest(userId)
                setStatus('pending')
            } else if (status === 'pending' || status === 'following') {
                await unfollowUser(userId)
                setStatus('none')
            }
        } catch (err) {
            console.error('FollowButton error:', err)
        } finally {
            setLoading(false)
        }
    }

    const labels = { none: 'Follow', pending: 'Requested', following: 'Following' }
    const hoverLabels = { none: 'Follow', pending: 'Cancel', following: 'Unfollow' }
    const Icon = status === 'none' ? UserPlus : status === 'pending' ? Clock : UserCheck

    return (
        <button type="button" onClick={handleClick} disabled={loading} className="btn btn-sm group/fb shrink-0">
            {loading ? <Spinner size={12} /> : <Icon className="h-3.5 w-3.5" />}
            <span className="group-hover/fb:hidden">{labels[status]}</span>
            <span className="hidden group-hover/fb:inline">{hoverLabels[status]}</span>
        </button>
    )
}

function UserRow({ user, stats, currentUserId }) {
    const s = stats[user.user_id] || { skills: 0, stars: 0 }
    return (
        <div className="box-row flex items-start gap-4 py-4">
            <Link to={`/user/${user.username}`} className="shrink-0">
                <Avatar src={user.avatar_url} name={user.display_name || user.username} size={48} />
            </Link>
            <div className="min-w-0 flex-1">
                <Link to={`/user/${user.username}`} className="group inline-flex flex-wrap items-baseline gap-x-2">
                    <span className="font-semibold text-accent group-hover:underline">{user.display_name || user.username}</span>
                    <span className="text-sm text-fg-muted">{user.username}</span>
                </Link>
                {user.bio && <p className="mt-0.5 line-clamp-2 text-sm text-fg-muted">{user.bio}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted">
                    <span className="inline-flex items-center gap-1"><BookMarked className="h-3.5 w-3.5" />{s.skills} {s.skills === 1 ? 'skill' : 'skills'}</span>
                    <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" />{formatCount(s.stars)} {s.stars === 1 ? 'star' : 'stars'}</span>
                    {user.created_at && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Joined {timeAgo(user.created_at)}</span>}
                </div>
            </div>
            <FollowButton userId={user.user_id} currentUserId={currentUserId} />
        </div>
    )
}

const SORT_OPTIONS = [
    { id: 'joined', label: 'Recently joined' },
    { id: 'stars', label: 'Most stars' },
    { id: 'skills', label: 'Most skills' },
]

function sortUsers(users, sortId, stats) {
    const arr = [...users]
    if (sortId === 'stars') return arr.sort((a, b) => (stats[b.user_id]?.stars ?? 0) - (stats[a.user_id]?.stars ?? 0))
    if (sortId === 'skills') return arr.sort((a, b) => (stats[b.user_id]?.skills ?? 0) - (stats[a.user_id]?.skills ?? 0))
    // 'joined' — Appwrite already returns documents ordered by $createdAt DESC
    return arr
}

const PAGE_SIZE = 12

export default function Community() {
    const { profile: authProfile } = useAuth()
    const currentUserId = authProfile?.user_id ?? null
    const [allUsers, setAllUsers] = useState([])
    const [stats, setStats] = useState({})
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState(null)
    const [cursor, setCursor] = useState(null)
    const [hasMore, setHasMore] = useState(false)
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState('joined')

    const query = search.trim().toLowerCase()
    const filtered = query
        ? allUsers.filter((u) => (u.display_name || '').toLowerCase().includes(query) || (u.username || '').toLowerCase().includes(query))
        : allUsers
    const users = sortUsers(filtered, sort, stats)

    useEffect(() => {
        let cancelled = false

        async function init() {
            if (_pageCache && Date.now() < _pageCache.expiresAt) {
                setAllUsers(_pageCache.users)
                setStats(_pageCache.stats)
                setCursor(_pageCache.cursor)
                setTotal(_pageCache.total)
                setHasMore(_pageCache.total > _pageCache.users.length)
                setLoading(false)
                return
            }

            setLoading(true)
            setError(null)
            try {
                const [result, skillStats] = await Promise.all([
                    getCommunityUsers({ limit: PAGE_SIZE }),
                    getPublicSkillsStatsByUser(),
                ])
                if (cancelled) return
                const lastCursor = result.users[result.users.length - 1]?.$id ?? null
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
                setTotal(result.total)
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
        try {
            const result = await getCommunityUsers({ limit: PAGE_SIZE, cursor })
            const merged = [...allUsers, ...result.users]
            const lastCursor = result.users[result.users.length - 1]?.$id ?? null
            setAllUsers(merged)
            setCursor(lastCursor)
            setTotal(result.total)
            setHasMore(merged.length < result.total)
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
        <div className="container-page max-w-[1012px] py-8">
            <SEO
                title="AI Skills Community — Discover Skill File Creators"
                description="Meet the community of developers and creators building AI skill files. Browse profiles, discover skills, and connect with fellow AI enthusiasts."
                path="/community"
                jsonLd={jsonLdSchemas.breadcrumb([
                    { name: 'Home', url: '/' },
                    { name: 'Community', url: '/community' },
                ])}
            />

            <PageHeader
                title="Community"
                description="People building and sharing skills on Skill Issue."
            />

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Find a member by name or username"
                        aria-label="Find a member"
                        className="input pl-8 pr-8"
                    />
                    {search && (
                        <button type="button" onClick={() => setSearch('')} className="btn-invisible btn-icon btn-sm absolute right-1 top-1/2 -translate-y-1/2" aria-label="Clear search">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <label className="flex items-center gap-2 text-sm text-fg-muted">
                    <span className="shrink-0">Sort</span>
                    <select value={sort} onChange={(e) => setSort(e.target.value)} className="input sm:w-44">
                        {SORT_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                </label>
            </div>

            <div className="box mt-4 overflow-hidden">
                <div className="box-header py-2.5 text-sm">
                    <Users className="h-4 w-4 text-fg-muted" />
                    <span className="font-semibold">{loading ? 'Loading members…' : `${(query ? users.length : total || users.length).toLocaleString()} members`}</span>
                </div>

                {error && (
                    <Blankslate icon={AlertCircle} title="Something went wrong">{error}</Blankslate>
                )}

                {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

                {!loading && !error && (users.length === 0 ? (
                    <Blankslate icon={Users} title={query ? 'No matching members' : 'No members yet'}>
                        {query ? 'Try a different name or username. Only loaded members are searched.' : 'Be the first to join.'}
                    </Blankslate>
                ) : (
                    users.map((user) => (
                        <UserRow key={user.id || user.$id || user.username} user={user} stats={stats} currentUserId={currentUserId} />
                    ))
                ))}

                {!loading && !error && hasMore && (
                    <div className="box-footer flex justify-center bg-canvas-subtle py-2">
                        <button type="button" onClick={loadMore} disabled={loadingMore} className="btn btn-sm">
                            {loadingMore && <Spinner size={12} />}
                            {loadingMore ? 'Loading…' : 'Load more members'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
