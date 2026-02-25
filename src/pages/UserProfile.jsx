import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Package, Copy, Download, Star, UserX, Sprout } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getProfileByUsername, getProfileStats } from '../lib/userService'
import { getPublicSkillsByUser, getPrivateSkillsByUser, toggleVisibility } from '../lib/skillService'
import SkillCard from '../components/SkillCard'
import EditProfileModal from '../components/EditProfileModal'

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

// ── Stat chip — premium glass card ─────────────────────────
function StatChip({ label, value, icon, delay = 0 }) {
    return (
        <div
            className="profile-stat-card group relative overflow-hidden"
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Gradient border glow on hover */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/20 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Inner content */}
            <div className="relative flex flex-col items-center gap-1 px-5 py-5 rounded-2xl bg-gradient-to-br from-navy-100/80 to-navy/90 border border-white/[0.06] group-hover:border-accent/30 backdrop-blur-sm transition-all duration-500">
                {/* Ambient glow dot */}
                <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-accent/30 group-hover:bg-accent/60 group-hover:shadow-[0_0_8px_rgba(75,169,255,0.5)] transition-all duration-500" />

                <span className="text-2xl mb-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-300">{icon}</span>

                <span className="font-clash font-medium text-3xl text-white group-hover:text-accent transition-colors duration-300" style={{ textShadow: '0 0 30px rgba(75, 169, 255, 0)' }}>
                    <AnimatedNumber value={value} />
                </span>

                <span className="font-satoshi text-[10px] text-white/25 uppercase tracking-[0.2em] font-medium">{label}</span>
            </div>
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

// ════════════════════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════════════════════
export default function UserProfile() {
    const { username } = useParams()
    const { user: authUser, profile: authProfile } = useAuth()

    const isMockMode = import.meta.env.VITE_MOCK_AUTH === 'true'

    const [profile, setProfile] = useState(null)
    const [stats, setStats] = useState(null)
    const [publicSkills, setPublic] = useState([])
    const [privateSkills, setPrivate] = useState([])
    const [filter, setFilter] = useState('recent')
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [showEdit, setShowEdit] = useState(false)

    const isOwner = authProfile?.username === username

    // ── Fetch profile + stats ─────────────────────────────────
    useEffect(() => {
        async function load() {
            setLoading(true)
            setNotFound(false)
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
                        setPrivate([
                            { id: 'mock-priv-1', title: 'Secret Project Helper', category: 'coding', tags: [], created_at: new Date().toISOString() },
                        ])
                    } else {
                        setNotFound(true)
                    }
                    setLoading(false)
                    return
                }

                // Real mode — fetch from Supabase
                const p = await getProfileByUsername(username)
                if (!p) { setNotFound(true); setLoading(false); return }
                setProfile(p)

                const [s, pub] = await Promise.all([
                    getProfileStats(p.id),
                    getPublicSkillsByUser(p.id, filter),
                ])
                setStats(s)
                setPublic(pub)

                if (isOwner) {
                    const priv = await getPrivateSkillsByUser(p.id)
                    setPrivate(priv)
                }
            } catch (err) {
                console.error('Profile load error:', err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [username, isOwner, isMockMode, authProfile])

    // ── Re-fetch public skills when filter changes ────────────
    useEffect(() => {
        if (!profile) return
        getPublicSkillsByUser(profile.id, filter).then(setPublic)
    }, [filter, profile])

    // ── Make private skill public ─────────────────────────────
    async function handleMakePublic(skillId) {
        await toggleVisibility(skillId, 'public')
        setPrivate(prev => prev.filter(s => s.id !== skillId))
        // Re-fetch public list
        const pub = await getPublicSkillsByUser(profile.id, filter)
        setPublic(pub)
        const s = await getProfileStats(profile.id)
        setStats(s)
    }

    // ── Not found ─────────────────────────────────────────────
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

    const displayName = profile?.display_name || profile?.username || username
    const avatarUrl = profile?.avatar_url || null
    const joinedDate = profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : null

    return (
        <>
            <main className="relative min-h-screen">
                {/* ── Ambient background effects ── */}
                <div className="absolute top-0 left-0 right-0 h-[500px] overflow-hidden pointer-events-none">
                    <div className="absolute top-[-200px] left-[-100px] w-[600px] h-[600px] bg-accent/[0.04] rounded-full blur-[120px]" />
                    <div className="absolute top-[-100px] right-[-150px] w-[500px] h-[500px] bg-accent/[0.03] rounded-full blur-[100px]" />
                    {/* Top gradient wash */}
                    <div className="absolute inset-0 bg-gradient-to-b from-navy-100/50 via-transparent to-transparent" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
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
                                        ) : avatarUrl ? (
                                            <div className="relative group">
                                                {/* Outer glow ring — animated */}
                                                <div className="absolute -inset-2 rounded-full profile-avatar-glow opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
                                                {/* Ring */}
                                                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-accent/40 via-accent/10 to-accent/30 profile-ring-spin" />
                                                <img
                                                    src={avatarUrl}
                                                    alt={displayName}
                                                    className="relative w-32 h-32 rounded-full border-2 border-navy object-cover shadow-[0_0_40px_rgba(75,169,255,0.15)]"
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
                                        <button
                                            onClick={() => setShowEdit(true)}
                                            className="w-full mt-5 flex items-center justify-center gap-2 py-3 rounded-xl border border-accent/15 bg-accent/[0.04] text-accent/70 font-satoshi text-sm font-semibold hover:text-accent hover:border-accent/40 hover:bg-accent/[0.08] hover:shadow-[0_0_20px_rgba(75,169,255,0.12)] transition-all duration-400 group/edit"
                                        >
                                            <svg className="w-3.5 h-3.5 group-hover/edit:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                            </svg>
                                            Edit Profile
                                        </button>
                                    )}
                                </div>
                            </div>
                        </aside>

                        {/* ══ MAIN CONTENT ════════════════════════════════════ */}
                        <div className="flex-1 min-w-0 space-y-10">

                            {/* Stats bar */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {loading || !stats ? (
                                    Array(4).fill(0).map((_, i) => (
                                        <div key={i} className="h-28 rounded-2xl bg-navy-50/50 border border-white/[0.04] animate-pulse" />
                                    ))
                                ) : (
                                    <>
                                        <StatChip icon={<Package className="w-6 h-6 text-accent/80" />} label="Skills" value={stats.total_skills} delay={0} />
                                        <StatChip icon={<Copy className="w-6 h-6 text-accent/80" />} label="Copies" value={stats.total_copies} delay={80} />
                                        <StatChip icon={<Download className="w-6 h-6 text-accent/80" />} label="Downloads" value={stats.total_downloads} delay={160} />
                                        <StatChip icon={<Star className="w-6 h-6 text-accent/80" />} label="Stars" value={stats.total_stars} delay={240} />
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
                                            Public Skills
                                        </h2>
                                        {!loading && (
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 border border-accent/15 font-satoshi font-bold text-xs text-accent/80">
                                                {publicSkills.length}
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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {publicSkills.map((skill, i) => (
                                            <SkillCard key={skill.id} skill={skill} index={i} />
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* ── Private Vault (owner only) ── */}
                            {isOwner && !loading && (
                                <section className="profile-fade-in" style={{ animationDelay: '0.3s' }}>
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

                                    {privateSkills.length === 0 ? (
                                        <p className="font-satoshi text-sm text-white/25 text-center py-10 bg-white/[0.01] rounded-2xl border border-dashed border-white/[0.04]">
                                            No private skills. All saved skills are public.
                                        </p>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {privateSkills.map(skill => (
                                                <div key={skill.id} className="group flex items-center gap-4 px-5 py-4 rounded-xl bg-gradient-to-r from-navy-50/50 to-transparent border border-white/[0.05] hover:border-accent/20 hover:bg-navy-50 transition-all duration-400">
                                                    {/* Lock icon */}
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] group-hover:border-accent/20 transition-colors duration-300">
                                                        <svg className="w-3.5 h-3.5 text-white/20 group-hover:text-accent/40 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                                        </svg>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-satoshi font-bold text-sm text-white/80 truncate">{skill.title}</p>
                                                        {skill.category && (
                                                            <p className="font-satoshi text-[11px] text-white/25 mt-0.5 uppercase tracking-wider">{skill.category}</p>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => handleMakePublic(skill.id)}
                                                        className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.08] text-white/50 font-satoshi text-xs font-medium hover:bg-accent/10 hover:border-accent/25 hover:text-accent hover:shadow-[0_0_12px_rgba(75,169,255,0.1)] transition-all duration-300"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                                        </svg>
                                                        Make Public
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
                    onSave={updated => setProfile(prev => ({ ...prev, ...updated }))}
                />
            )}
        </>
    )
}
