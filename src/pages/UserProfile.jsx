import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Package, Star, UserX, Sprout } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getProfileByUsername, getProfileStats, getSavedSkills, getSavedSkillsByIds, submitTestimonial, hasSubmittedTestimonial } from '../lib/userService'
import { getPublicSkillsByUser, getPrivateSkillsByUser, toggleVisibility, deleteSkill } from '../lib/skillService'
import SkillCard from '../components/SkillCard'
import EditProfileModal from '../components/EditProfileModal'
import UserSkillModal from '../components/UserSkillModal'
import { profileCache, invalidateProfileCache, CACHE_TTL, isCacheStale } from '../lib/profileCache'
import SEO, { jsonLdSchemas } from '../components/SEO'
import Breadcrumbs from '../components/Breadcrumbs'

const PAGE_SIZE = 12

// ── Animated counter ───────────────────────────────────────
function AnimatedNumber({ value, duration = 1200 }) {
    const [display, setDisplay] = useState(0)

    useEffect(() => {
        if (value === 0) { setDisplay(0); return }
        let start = null
        const animate = (ts) => {
            if (!start) start = ts
            const progress = Math.min((ts - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplay(Math.floor(eased * value))
            if (progress < 1) requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
    }, [value, duration])

    if (value >= 1000) return `${(display / 1000).toFixed(1)}k`
    return display
}

// ── Stat chip — modern inline pill ─────────────────────────
function StatChip({ label, value, icon, delay = 0 }) {
    return (
        <div
            className="group flex items-center gap-4 px-5 py-4 rounded-2xl bg-navy-50/40 border border-white/[0.06] hover:border-accent/25 hover:bg-navy-100/60 transition-all duration-300 backdrop-blur-sm"
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Icon container */}
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent/8 border border-accent/15 flex items-center justify-center group-hover:bg-accent/15 group-hover:border-accent/30 transition-all duration-300">
                {icon}
            </div>

            {/* Text */}
            <div className="flex flex-col">
                <span className="font-clash font-semibold text-2xl text-white leading-none">
                    <AnimatedNumber value={value} />
                </span>
                <span className="font-satoshi text-xs text-white/35 uppercase tracking-[0.15em] mt-0.5">{label}</span>
            </div>

            {/* Subtle right accent */}
            <div className="ml-auto w-1 h-8 rounded-full bg-accent/0 group-hover:bg-accent/30 transition-all duration-300" />
        </div>
    )
}

// ── Filter Tabs ──────────────────────────────────────────────
const FILTERS = [
    { id: 'recent', label: 'Recent', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'most-rated', label: 'Most Rated', icon: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z' },
    { id: 'most-copied', label: 'Most Copied', icon: 'M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5' },
]

// ── Skeleton ─────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="bg-navy-50 border border-white/[0.04] rounded-2xl p-5 space-y-3">
            <div className="skeleton-line w-1/3 h-3" />
            <div className="skeleton-line w-4/5 h-4" />
            <div className="skeleton-line w-full h-3" />
            <div className="skeleton-line w-2/3 h-3" />
        </div>
    )
}

// ── Review Modal ─────────────────────────────────────────────
function ReviewModal({ onClose, authUser, onSubmitted }) {
    const [body, setBody] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    async function handleSubmit() {
        if (!body.trim()) return
        setSubmitting(true)
        try {
            await submitTestimonial({
                name: authUser.user_metadata?.full_name || authUser.name || 'Anonymous',
                username: authUser.name ? authUser.name.replace(/\s+/g, '').toLowerCase() : 'user',
                body: body.trim(),
                img: authUser.avatar_url || 'https://avatar.vercel.sh/user'
            })
            setSubmitted(true)
            onSubmitted()
            setTimeout(onClose, 2000)
        } catch (err) {
            console.error(err)
            onClose()
        }
    }

    if (submitted) {
        return (
            <div className="modal-overlay z-[100]" onClick={onClose}>
                <div className="modal-card text-center relative" onClick={e => e.stopPropagation()}>
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>
                    <h3 className="font-clash font-bold text-2xl mb-2 text-white/90">Thank you!</h3>
                    <p className="font-satoshi text-sm text-white/50">Your testimonial has been submitted.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="modal-overlay z-[100]" onClick={onClose}>
            <div className="modal-card relative" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="text-center mb-6">
                    <h3 className="font-clash font-bold text-2xl mb-2 text-white/90">Leave a Review</h3>
                    <p className="font-satoshi text-sm text-white/50">
                        What do you think of Skill Issue so far? Leave a review for a chance to be featured on the homepage.
                    </p>
                </div>

                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="This app is basically magic. I built a coding assistant in 3 seconds..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:border-accent/40 focus:bg-white/[0.05] text-white placeholder:text-white/20 font-satoshi text-sm outline-none transition-all duration-300 resize-none mb-4"
                />

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl font-satoshi font-semibold text-sm bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !body.trim()}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-satoshi font-semibold text-sm transition-all duration-300 ${body.trim() && !submitting ? 'bg-accent text-navy hover:bg-[#6bbcff] cursor-pointer' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                    >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ════════════════════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════════════════════
export default function UserProfile() {
    const { username } = useParams()
    const { user: authUser, profile: authProfile, signOut } = useAuth()

    const isMockMode = import.meta.env.VITE_MOCK_AUTH === 'true'

    const [profile, setProfile] = useState(null)
    const [stats, setStats] = useState(null)
    const [publicSkills, setPublic] = useState([])
    const [skillsTotal, setSkillsTotal] = useState(0)
    const [loadingMore, setLoadingMore] = useState(false)
    const [privateSkills, setPrivate] = useState([])
    const [savedSkills, setSavedSkills] = useState([])
    const [filter, setFilter] = useState('recent')
    const [selectedSkill, setSelectedSkill] = useState(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [showEdit, setShowEdit] = useState(false)
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [hasReviewed, setHasReviewed] = useState(false)
    const [imgError, setImgError] = useState(false)

    const isOwner = authProfile?.username === username

    // ── Fetch profile + skills (parallelised) ─────────────────
    useEffect(() => {
        async function load() {
            setLoading(true)
            setNotFound(false)
            setPublic([])
            setSkillsTotal(0)

            try {
                // Mock mode — use the auth context profile directly
                if (isMockMode) {
                    if (authProfile && authProfile.username === username) {
                        setProfile(authProfile)
                        setStats({ total_skills: 3, total_copies: 12, total_downloads: 48, total_stars: 7 })
                        setPublic([
                            { id: 'mock-1', title: 'React Best Practices Skill', description: 'Comprehensive guide for writing clean React code', category: 'coding', tags: ['react'], star_count: 4, copy_count: 8, created_at: new Date().toISOString() },
                            { id: 'mock-2', title: 'Technical Writing Assistant', description: 'Helps write clear documentation and blog posts', category: 'writing', tags: ['docs'], star_count: 2, copy_count: 3, created_at: new Date(Date.now() - 86400000).toISOString() },
                            { id: 'mock-3', title: 'Code Review Analyzer', description: 'Analyzes PRs and suggests improvements', category: 'analysis', tags: ['review'], star_count: 1, copy_count: 1, created_at: new Date(Date.now() - 172800000).toISOString() },
                        ])
                        setSkillsTotal(3)
                        setPrivate([
                            { id: 'mock-priv-1', title: 'Secret Project Helper', category: 'coding', tags: [], created_at: new Date().toISOString() },
                        ])
                        setSavedSkills([
                            { id: 'mock-saved-1', title: 'Awesome CSS Tricks', description: 'Some cool CSS tricks I found', category: 'design', tags: ['css'], star_count: 5, copy_count: 10, created_at: new Date().toISOString(), user_id: 'other-user' }
                        ])
                    } else {
                        setNotFound(true)
                    }
                    setLoading(false)
                    return
                }

                // ── Check in-memory cache ──────────────────────────────
                const cached = profileCache[username]
                if (cached && !isCacheStale(username)) {
                    console.log('[Profile] Cache hit for', username)
                    setProfile(cached.profile)
                    setStats(cached.stats)
                    setPublic(cached.publicSkills)
                    setSkillsTotal(cached.skillsTotal)
                    setHasReviewed(cached.hasReviewed)
                    if (cached.privateSkills) setPrivate(cached.privateSkills)
                    if (cached.savedSkills) setSavedSkills(cached.savedSkills)
                    setLoading(false)
                    return
                }

                // ── Step 1: fetch profile (needed to get user_id for everything else) ──
                const t0 = performance.now()
                const p = await getProfileByUsername(username)
                console.log(`[Profile] getProfileByUsername: ${(performance.now() - t0).toFixed(0)}ms`)

                if (!p) { setNotFound(true); setLoading(false); return }
                setProfile(p)

                // ── Step 2: fan-out — run all remaining calls in parallel ──
                const savedIds = p.saved_skills || []
                const t1 = performance.now()

                const parallelCalls = [
                    getProfileStats(p.user_id),                              // [0] stats
                    getPublicSkillsByUser(p.user_id, filter, PAGE_SIZE, 0), // [1] first page of public skills
                    hasSubmittedTestimonial(p.user_id),                      // [2] reviewed?
                    getSavedSkillsByIds(savedIds),                           // [3] saved skills (no extra round-trip)
                    ...(isOwner ? [getPrivateSkillsByUser(p.user_id)] : []), // [4] private skills (owner only)
                ]

                const results = await Promise.all(parallelCalls)

                console.log(`[Profile] parallel fetch (stats+skills+review+saved${isOwner ? '+private' : ''}): ${(performance.now() - t1).toFixed(0)}ms`)

                const [s, pubResult, reviewedStatus, saved, priv] = results

                setStats(s)
                setPublic(pubResult.docs)
                setSkillsTotal(pubResult.total)
                setHasReviewed(reviewedStatus)
                setSavedSkills(saved)
                if (isOwner && priv) setPrivate(priv)

                // ── Populate cache ────────────────────────────────────
                profileCache[username] = {
                    cachedAt: Date.now(),
                    profile: p,
                    stats: s,
                    publicSkills: pubResult.docs,
                    skillsTotal: pubResult.total,
                    hasReviewed: reviewedStatus,
                    savedSkills: saved,
                    ...(isOwner ? { privateSkills: priv } : {}),
                }

            } catch (err) {
                console.error('Profile load error:', err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [username, isOwner, isMockMode, authProfile])

    // ── Re-fetch page 1 of public skills when filter changes ──
    useEffect(() => {
        if (!profile) return
        const t = performance.now()
        getPublicSkillsByUser(profile.user_id, filter, PAGE_SIZE, 0).then(({ docs, total }) => {
            console.log(`[Profile] filter re-fetch (${filter}): ${(performance.now() - t).toFixed(0)}ms`)
            setPublic(docs)
            setSkillsTotal(total)
            invalidateProfileCache(username)
        })
    }, [filter, profile])

    // ── Load next page of public skills ──────────────────────
    const handleLoadMore = useCallback(async () => {
        if (!profile || loadingMore) return
        setLoadingMore(true)
        const t = performance.now()
        try {
            const { docs } = await getPublicSkillsByUser(profile.user_id, filter, PAGE_SIZE, publicSkills.length)
            console.log(`[Profile] load more (offset=${publicSkills.length}): ${(performance.now() - t).toFixed(0)}ms`)
            setPublic(prev => {
                const merged = [...prev, ...docs]
                invalidateProfileCache(username)
                return merged
            })
        } finally {
            setLoadingMore(false)
        }
    }, [profile, filter, publicSkills.length, loadingMore, username])

    // ── Make private skill public ─────────────────────────────
    const handleMakePublic = useCallback(async (skillId) => {
        await toggleVisibility(skillId, 'public')
        const [pub, s] = await Promise.all([
            getPublicSkillsByUser(profile.user_id, filter, PAGE_SIZE, 0),
            getProfileStats(profile.user_id),
        ])
        setPrivate(prev => prev.filter(s => s.id !== skillId))
        setPublic(pub.docs)
        setSkillsTotal(pub.total)
        setStats(s)
        invalidateProfileCache(username)
    }, [profile, filter, username])

    const handleMakePrivate = useCallback(async (skillId) => {
        await toggleVisibility(skillId, 'private')
        const [priv, s] = await Promise.all([
            getPrivateSkillsByUser(profile.user_id),
            getProfileStats(profile.user_id),
        ])
        setPublic(prev => prev.filter(s => s.id !== skillId))
        setPrivate(priv)
        setStats(s)
        invalidateProfileCache(username)
    }, [profile, username])

    const handleDelete = useCallback(async (skillId) => {
        await deleteSkill(skillId)
        const [pub, s] = await Promise.all([
            getPublicSkillsByUser(profile.user_id, filter, PAGE_SIZE, 0),
            getProfileStats(profile.user_id),
        ])
        setPublic(pub.docs)
        setSkillsTotal(pub.total)
        setPrivate(prev => prev.filter(s => s.id !== skillId))
        setStats(s)
        invalidateProfileCache(username)
    }, [profile, filter, username])

    // ── Handle modal skill actions (toggle/delete from modal) ──
    const handleModalToggle = useCallback(async (skillId, newVisibility) => {
        await toggleVisibility(skillId, newVisibility)
        const [pub, priv, s] = await Promise.all([
            getPublicSkillsByUser(profile.user_id, filter, PAGE_SIZE, 0),
            getPrivateSkillsByUser(profile.user_id),
            getProfileStats(profile.user_id),
        ])
        setPublic(pub.docs)
        setSkillsTotal(pub.total)
        setPrivate(priv)
        setStats(s)
        invalidateProfileCache(username)
    }, [profile, filter, username])

    // ── Derived display values (memoised) ─────────────────────
    const displayName = useMemo(() => profile?.display_name || profile?.username || username, [profile, username])
    const avatarUrl = useMemo(() => profile?.avatar_url || authUser?.user_metadata?.avatar_url || null, [profile, authUser])
    const joinedDate = useMemo(() =>
        profile?.created_at
            ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : null,
        [profile]
    )
    // Reset imgError whenever the avatarUrl changes (e.g. after profile edit)
    useEffect(() => { setImgError(false) }, [avatarUrl])

    if (!loading && notFound) {
        return (
            <main className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-accent/10 rounded-full blur-2xl scale-150" />
                    <div className="relative flex justify-center items-center w-24 h-24 rounded-full bg-accent/5 border border-accent/20">
                        <UserX className="w-12 h-12 text-accent/60" />
                    </div>
                </div>
                <h1 className="font-clash font-medium text-3xl mb-3">User not found</h1>
                <p className="font-satoshi text-white/40 mb-8">
                    <span className="text-accent">@{username}</span> doesn't exist on Skill Issue yet.
                </p>
                <Link to="/" className="btn-primary">Go Home</Link>
            </main>
        )
    }

    return (
        <>
            <SEO
                title={displayName ? `${displayName} (@${profile?.username || username})` : `@${username}`}
                description={profile?.bio || `View ${displayName || username}'s AI skill files and profile on Skill Issue.`}
                path={`/user/${username}`}
                image={avatarUrl || undefined}
                jsonLd={profile ? {
                    '@graph': [
                        jsonLdSchemas.profilePage(profile),
                        jsonLdSchemas.breadcrumb([
                            { name: 'Home', url: '/' },
                            { name: 'Community', url: '/community' },
                            { name: displayName || username },
                        ]),
                    ],
                } : undefined}
            />
            <main className="relative min-h-screen">
                {/* ── Ambient background effects ── */}
                <div className="absolute top-0 left-0 right-0 h-[500px] overflow-hidden pointer-events-none">
                    <div className="absolute top-[-200px] left-[-100px] w-[600px] h-[600px] bg-accent/[0.04] rounded-full blur-[120px]" />
                    <div className="absolute top-[-100px] right-[-150px] w-[500px] h-[500px] bg-accent/[0.03] rounded-full blur-[100px]" />
                    {/* Top gradient wash */}
                    <div className="absolute inset-0 bg-gradient-to-b from-navy-100/50 via-transparent to-transparent" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
                    <Breadcrumbs items={[
                        { label: 'Community', to: '/community' },
                        { label: displayName || username },
                    ]} />
                    <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 profile-fade-in">

                        {/* ══ LEFT SIDEBAR ════════════════════════════════════ */}
                        <aside className="lg:w-80 flex-shrink-0">
                            <div className="lg:sticky lg:top-28 space-y-7">
                                {/* Profile card container */}
                                <div className="relative p-6 rounded-3xl bg-gradient-to-b from-navy-50/80 to-navy/50 border border-white/[0.06] backdrop-blur-sm">
                                    {/* Decorative corner accents */}
                                    <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none">
                                        <div className="absolute top-4 left-4 w-6 h-[1px] bg-accent/20" />
                                        <div className="absolute top-4 left-4 w-[1px] h-6 bg-accent/20" />
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none">
                                        <div className="absolute bottom-4 right-4 w-6 h-[1px] bg-accent/20" />
                                        <div className="absolute bottom-4 right-4 w-[1px] h-6 bg-accent/20" />
                                    </div>

                                    <div className="flex flex-col items-center gap-5">
                                        {/* Avatar */}
                                        {loading ? (
                                            <div className="w-32 h-32 rounded-full bg-white/[0.04] animate-pulse" />
                                        ) : avatarUrl && !imgError ? (
                                            <div className="relative group">
                                                {/* Outer glow ring — animated */}
                                                <div className="absolute -inset-2 rounded-full profile-avatar-glow opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
                                                {/* Ring */}
                                                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-accent/40 via-accent/10 to-accent/30 profile-ring-spin" />
                                                <img
                                                    src={avatarUrl}
                                                    alt={displayName}
                                                    className="relative w-32 h-32 rounded-full border-2 border-navy object-cover shadow-[0_0_40px_rgba(75,169,255,0.15)]"
                                                    onError={() => setImgError(true)}
                                                />
                                                {isOwner && (
                                                    <span className="absolute bottom-1 right-1 w-6 h-6 bg-accent rounded-full border-[3px] border-navy shadow-[0_0_12px_rgba(75,169,255,0.6)] flex items-center justify-center">
                                                        <svg className="w-2.5 h-2.5 text-navy" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="relative group">
                                                <div className="absolute -inset-2 rounded-full profile-avatar-glow opacity-40 group-hover:opacity-80 transition-opacity duration-700" />
                                                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-accent/30 via-accent/5 to-accent/20 profile-ring-spin" />
                                                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-navy-200 to-navy-100 border-2 border-navy flex items-center justify-center shadow-[0_0_40px_rgba(75,169,255,0.15)]">
                                                    <span className="font-clash font-medium text-5xl text-accent drop-shadow-[0_0_12px_rgba(75,169,255,0.5)]">
                                                        {displayName?.charAt(0)?.toUpperCase() || '?'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Name / username */}
                                        {loading ? (
                                            <div className="space-y-2.5 w-44">
                                                <div className="skeleton-line h-5 w-full" />
                                                <div className="skeleton-line h-3 w-2/3 mx-auto" />
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <h1 className="font-clash font-medium text-2xl text-white leading-tight tracking-tight">
                                                    {displayName}
                                                </h1>
                                                <p className="font-satoshi text-sm text-accent/60 mt-1 font-medium">
                                                    @{profile?.username}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bio */}
                                    {!loading && profile?.bio && (
                                        <div className="mt-5 pt-5 border-t border-white/[0.05]">
                                            <p className="font-satoshi text-sm text-white/45 leading-relaxed text-center">
                                                {profile.bio}
                                            </p>
                                        </div>
                                    )}

                                    {/* Meta info */}
                                    {!loading && joinedDate && (
                                        <div className="flex items-center justify-center gap-2 mt-4 font-satoshi text-xs text-white/20">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                            </svg>
                                            Joined {joinedDate}
                                        </div>
                                    )}

                                    {/* Edit profile button */}
                                    {isOwner && !loading && (
                                        <div className="w-full mt-5 flex flex-col gap-3">
                                            <button
                                                onClick={() => setShowEdit(true)}
                                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-accent/15 bg-accent/[0.04] text-accent/70 font-satoshi text-sm font-semibold hover:text-accent hover:border-accent/40 hover:bg-accent/[0.08] hover:shadow-[0_0_20px_rgba(75,169,255,0.12)] transition-all duration-400 group/edit"
                                            >
                                                <svg className="w-3.5 h-3.5 group-hover/edit:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                                </svg>
                                                Edit Profile
                                            </button>

                                            {!hasReviewed && (
                                                <button
                                                    onClick={() => setShowReviewModal(true)}
                                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 font-satoshi text-sm font-semibold hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all duration-400 group/review"
                                                >
                                                    <svg className="w-3.5 h-3.5 group-hover/review:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                                    </svg>
                                                    Add Review
                                                </button>
                                            )}

                                            {/* Sign out — visible on mobile where navbar logout is hidden */}
                                            <button
                                                onClick={signOut}
                                                className="md:hidden w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/15 bg-red-500/[0.04] text-red-400/70 font-satoshi text-sm font-semibold hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/[0.08] transition-all duration-400 group/logout"
                                            >
                                                <svg className="w-3.5 h-3.5 group-hover/logout:translate-x-0.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                                </svg>
                                                Sign Out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </aside>

                        {/* ══ MAIN CONTENT ════════════════════════════════════ */}
                        <div className="flex-1 min-w-0 space-y-10">

                            {/* Stats bar */}
                            <div className="grid grid-cols-2 gap-3">
                                {loading || !stats ? (
                                    Array(2).fill(0).map((_, i) => (
                                        <div key={i} className="h-[68px] rounded-2xl bg-navy-50/50 border border-white/[0.04] animate-pulse" />
                                    ))
                                ) : (
                                    <>
                                        <StatChip icon={<Package className="w-4 h-4 text-accent/80" />} label="Skills" value={stats.total_skills} delay={0} />
                                        <StatChip icon={<Star className="w-4 h-4 text-accent/80" />} label="Stars" value={stats.total_stars} delay={80} />
                                    </>
                                )}
                            </div>

                            {/* Public Skills section */}
                            <section>
                                {/* Section header + tabs */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-7">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1 h-6 rounded-full bg-accent/60" />
                                        <h2 className="font-clash font-medium text-xl text-white tracking-tight">
                                            Published Skills
                                        </h2>
                                        {!loading && (
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 border border-accent/15 font-satoshi font-bold text-xs text-accent/80">
                                                {skillsTotal}
                                            </span>
                                        )}
                                    </div>

                                    {/* Filter tabs */}
                                    <div className="flex items-center gap-1.5 sm:ml-auto p-1 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                        {FILTERS.map(f => (
                                            <button
                                                key={f.id}
                                                onClick={() => setFilter(f.id)}
                                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-satoshi text-sm font-medium transition-all duration-300 ${filter === f.id
                                                    ? 'bg-accent/15 text-accent border border-accent/25 shadow-[0_0_12px_rgba(75,169,255,0.15)]'
                                                    : 'text-white/35 hover:text-white/60 border border-transparent'
                                                    }`}
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                                                </svg>
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}
                                    </div>
                                ) : publicSkills.length === 0 ? (
                                    <div className="relative text-center py-20 rounded-2xl border border-dashed border-white/[0.06] bg-gradient-to-b from-white/[0.01] to-transparent overflow-hidden">
                                        {/* Decorative empty state */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-40 h-40 bg-accent/[0.03] rounded-full blur-3xl" />
                                        </div>
                                        <div className="relative flex flex-col items-center">
                                            <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-accent/5 border border-accent/10">
                                                <Sprout className="w-8 h-8 text-accent/50" />
                                            </div>
                                            <p className="font-satoshi text-sm text-white/30 max-w-xs mx-auto">
                                                {isOwner ? 'No public skills yet — save a skill and make it public!' : 'No public skills yet.'}
                                            </p>
                                            {isOwner && (
                                                <Link to="/build" className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-accent/10 border border-accent/20 text-accent font-satoshi text-sm font-bold hover:bg-accent/20 hover:border-accent/30 hover:shadow-[0_0_20px_rgba(75,169,255,0.15)] transition-all duration-300">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                    </svg>
                                                    Build a Skill
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {publicSkills.map((skill, i) => (
                                                <SkillCard
                                                    key={skill.id}
                                                    skill={skill}
                                                    index={i}
                                                    onClick={setSelectedSkill}
                                                    isOwner={isOwner}
                                                    onDelete={isOwner ? handleDelete : undefined}
                                                    onMakePrivate={isOwner ? handleMakePrivate : undefined}
                                                />
                                            ))}
                                        </div>
                                        {publicSkills.length < skillsTotal && (
                                            <div className="flex justify-center mt-6">
                                                <button
                                                    onClick={handleLoadMore}
                                                    disabled={loadingMore}
                                                    className="flex items-center gap-2 px-6 py-3 rounded-xl border border-accent/20 bg-accent/[0.06] text-accent font-satoshi text-sm font-semibold hover:bg-accent/[0.12] hover:border-accent/35 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {loadingMore ? (
                                                        <>
                                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                            </svg>
                                                            Loading…
                                                        </>
                                                    ) : (
                                                        <>Load more <span className="text-accent/50 font-normal">({skillsTotal - publicSkills.length} remaining)</span></>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </section>

                            {/* ── Saved Skills ── */}
                            {!loading && savedSkills.length > 0 && (
                                <section className="profile-fade-in" style={{ animationDelay: '0.3s' }}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-1 h-6 rounded-full bg-emerald-500/60" />
                                        <h2 className="font-clash font-medium text-xl text-white tracking-tight">
                                            Saved Skills
                                        </h2>
                                        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15 font-satoshi font-bold text-xs text-emerald-400">
                                            {savedSkills.length}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {savedSkills.map((skill, i) => (
                                            <SkillCard
                                                key={skill.id}
                                                skill={skill}
                                                index={i}
                                                onClick={(s) => setSelectedSkill({ ...s, _savedByMe: true })}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* ── Private Vault (owner only) ── */}
                            {isOwner && !loading && (
                                <section className="profile-fade-in" style={{ animationDelay: '0.4s' }}>
                                    {/* Vault header */}
                                    <div className="relative flex items-center gap-3 mb-6 py-4 px-5 rounded-2xl overflow-hidden">
                                        {/* Background gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-navy-100 via-navy-50 to-transparent border border-white/[0.05] rounded-2xl" />

                                        {/* Lock icon with glow */}
                                        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                                            <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                            </svg>
                                        </div>

                                        <div className="relative flex-1">
                                            <h2 className="font-clash font-medium text-base text-white/60">
                                                Private Vault
                                            </h2>
                                        </div>

                                        <span className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] font-satoshi text-[11px] text-white/20">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Only you
                                        </span>
                                    </div>

                                    {/* Exclude externally-saved skills — those live in Saved Skills above */}
                                    {(() => {
                                        const savedIds = new Set(savedSkills.map(s => s.id))
                                        const vaultSkills = privateSkills.filter(s => !savedIds.has(s.id))
                                        return vaultSkills.length === 0 ? (
                                            <p className="font-satoshi text-sm text-white/25 text-center py-10 bg-white/[0.01] rounded-2xl border border-dashed border-white/[0.04]">
                                                No private skills. All saved skills are public.
                                            </p>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {vaultSkills.map((skill, i) => (
                                                    <SkillCard
                                                        key={skill.id}
                                                        skill={skill}
                                                        index={i}
                                                        isPrivate
                                                        isOwner
                                                        onClick={setSelectedSkill}
                                                        onDelete={handleDelete}
                                                        onMakePrivate={undefined}
                                                    />
                                                ))}
                                            </div>
                                        )
                                    })()}
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Edit Profile Modal */}
            {showEdit && (
                <EditProfileModal
                    profile={profile}
                    onClose={() => setShowEdit(false)}
                    onSave={updated => {
                        setProfile(prev => ({ ...prev, ...updated }))
                        // Bust cache so re-visiting the profile re-fetches fresh data
                        invalidateProfileCache(username)
                    }}
                />
            )}

            {/* Skill Detail Modal */}
            {selectedSkill && (
                <UserSkillModal
                    skill={selectedSkill}
                    onClose={() => setSelectedSkill(null)}
                    isOwner={!selectedSkill._savedByMe && selectedSkill.user_id === authUser?.$id}
                    onDelete={!selectedSkill._savedByMe && selectedSkill.user_id === authUser?.$id ? async (id) => { await handleDelete(id) } : undefined}
                    onTogglePrivate={!selectedSkill._savedByMe && selectedSkill.user_id === authUser?.$id ? handleModalToggle : undefined}
                />
            )}
            {showReviewModal && (
                <ReviewModal
                    onClose={() => setShowReviewModal(false)}
                    authUser={authUser}
                    onSubmitted={() => setHasReviewed(true)}
                />
            )}
        </>
    )
}
