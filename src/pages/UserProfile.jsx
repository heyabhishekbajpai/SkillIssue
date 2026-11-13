import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
    Star, UserX, Users, CalendarDays, Pencil, LogOut, Clock, UserPlus, UserCheck, BookMarked,
    Bookmark, Lock, MessageSquareHeart, Plus, CheckCircle2, X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getProfileByUsername, getProfileStats, getSavedSkillsByIds, submitTestimonial, hasSubmittedTestimonial, getProfilesByUserIds } from '../lib/userService'
import { loadFollowData, sendFollowRequest, unfollowUser, acceptFollowRequest, rejectFollowRequest, getFollowStatus } from '../lib/followService'
import { getPublicSkillsByUser, getPrivateSkillsByUser, toggleVisibility, deleteSkill } from '../lib/skillService'
import SkillCard from '../components/SkillCard'
import EditProfileModal from '../components/EditProfileModal'
import UserSkillModal from '../components/UserSkillModal'
import { profileCache, invalidateProfileCache, isCacheStale } from '../lib/profileCache'
import SEO, { jsonLdSchemas } from '../components/SEO'
import FollowModal from '../components/FollowModal'
import { Avatar, Blankslate, Spinner, formatCount } from '../components/ui/primitives'

const PAGE_SIZE = 12

const FILTERS = [
    { id: 'recent', label: 'Recently published' },
    { id: 'most-rated', label: 'Most stars' },
    { id: 'most-copied', label: 'Most copied' },
]

function SkeletonCard() {
    return (
        <div className="box space-y-3 p-4">
            <div className="skeleton-line h-4 w-1/2" />
            <div className="skeleton-line h-3 w-full" />
            <div className="skeleton-line h-3 w-2/3" />
        </div>
    )
}

// ── Review (testimonial) modal ─────────────────────────────────
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
                img: authUser.avatar_url || 'https://avatar.vercel.sh/user',
            })
            setSubmitted(true)
            onSubmitted()
            setTimeout(onClose, 2000)
        } catch (err) {
            console.error(err)
            onClose()
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div role="dialog" aria-modal="true" aria-labelledby="review-title" className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-line-muted px-4 py-3">
                    <h3 id="review-title" className="font-sans text-sm font-semibold">Leave a review</h3>
                    <button type="button" onClick={onClose} className="btn-invisible btn-icon btn-sm" aria-label="Close"><X className="h-4 w-4" /></button>
                </div>
                {submitted ? (
                    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                        <CheckCircle2 className="h-6 w-6 text-success" />
                        <p className="font-semibold">Thank you!</p>
                        <p className="text-sm text-fg-muted">Your review has been submitted.</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2 p-4">
                            <label htmlFor="review-body" className="text-sm text-fg-muted">
                                What do you think of Skill Issue so far? Reviews may be featured on the homepage.
                            </label>
                            <textarea
                                id="review-body"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Share your experience…"
                                rows={4}
                                className="input resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-2 border-t border-line-muted bg-canvas-subtle px-4 py-3">
                            <button type="button" onClick={onClose} className="btn">Cancel</button>
                            <button type="button" onClick={handleSubmit} disabled={submitting || !body.trim()} className="btn-primary">
                                {submitting ? 'Submitting…' : 'Submit review'}
                            </button>
                        </div>
                    </>
                )}
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

    
    const [followModal, setFollowModal] = useState(null)
    const [followers, setFollowers] = useState([])
    const [following, setFollowing] = useState([])
    const [pendingRequests, setPendingRequests] = useState([])
    const [followStatus, setFollowStatus] = useState('none')
    const [followLoading, setFollowLoading] = useState(false)

    async function handleFollowToggle() {
        if (!profile?.user_id || followLoading) return

        setFollowLoading(true)
        try {
            if (followStatus === 'none') {
                await sendFollowRequest(profile.user_id)
                setFollowStatus('pending')
            } else if (followStatus === 'pending' || followStatus === 'accepted') {
                await unfollowUser(profile.user_id)
                setFollowStatus('none')
                if (followStatus === 'accepted' && authProfile) {
                    setFollowers(prev => prev.filter(f => f.user_id !== authProfile.user_id))
                }
            }
        } catch (err) {
            console.error('Follow toggle error:', err)
        } finally {
            setFollowLoading(false)
        }
    }

    async function handleAcceptRequest(userId) {
        const person = pendingRequests.find(p => p.user_id === userId)
        if (!person?.follow_doc_id) return
        try {
            await acceptFollowRequest(person.follow_doc_id)
            setPendingRequests(prev => prev.filter(p => p.user_id !== userId))
            setFollowers(prev => [...prev, { ...person, status: 'accepted' }])
        } catch (err) {
            console.error('Accept request error:', err)
        }
    }

    async function handleRejectRequest(userId) {
        const person = pendingRequests.find(p => p.user_id === userId)
        if (!person?.follow_doc_id) return
        try {
            await rejectFollowRequest(person.follow_doc_id)
            setPendingRequests(prev => prev.filter(p => p.user_id !== userId))
        } catch (err) {
            console.error('Reject request error:', err)
        }
    }

    const isOwner = authProfile?.username === username

    
    useEffect(() => {
        async function load() {
            setLoading(true)
            setNotFound(false)
            setPublic([])
            setSkillsTotal(0)

            try {
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
                        setPrivate([{ id: 'mock-priv-1', title: 'Secret Project Helper', category: 'coding', tags: [], created_at: new Date().toISOString() }])
                        setSavedSkills([{ id: 'mock-saved-1', title: 'Awesome CSS Tricks', description: 'Some cool CSS tricks I found', category: 'design', tags: ['css'], star_count: 5, copy_count: 10, created_at: new Date().toISOString(), user_id: 'other-user' }])
                    } else {
                        setNotFound(true)
                    }
                    setLoading(false)
                    return
                }

                const cached = profileCache[username]
                if (cached && !isCacheStale(username)) {
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

                const p = await getProfileByUsername(username)
                if (!p) { setNotFound(true); setLoading(false); return }
                setProfile(p)

                const savedIds = p.saved_skills || []
                const parallelCalls = [
                    getProfileStats(p.user_id),
                    getPublicSkillsByUser(p.user_id, filter, PAGE_SIZE, 0),
                    hasSubmittedTestimonial(p.user_id),
                    getSavedSkillsByIds(savedIds),
                    ...(isOwner ? [getPrivateSkillsByUser(p.user_id)] : []),
                ]

                const results = await Promise.all(parallelCalls)
                const [s, pubResult, reviewedStatus, saved, priv] = results

            
                setStats(s ?? { total_skills: 0, total_copies: 0, total_downloads: 0, total_stars: 0 })
                setPublic(pubResult.docs)
                setSkillsTotal(pubResult.total)
                setHasReviewed(reviewedStatus)
                setSavedSkills(saved)
                if (isOwner && priv) setPrivate(priv)

                profileCache[username] = {
                    cachedAt: Date.now(),
                    profile: p,
                    stats: s ?? { total_skills: 0, total_copies: 0, total_downloads: 0, total_stars: 0 },
                    publicSkills: pubResult.docs,
                    skillsTotal: pubResult.total,
                    hasReviewed: reviewedStatus,
                    savedSkills: saved,
                    ...(isOwner ? { privateSkills: priv } : {}),
                }

            } catch (err) {
                console.error('Profile load error:', err)
                
                setStats(prev => prev ?? { total_skills: 0, total_copies: 0, total_downloads: 0, total_stars: 0 })
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [username, isOwner, isMockMode, authProfile])

    useEffect(() => {
        setFollowers([])
        setFollowing([])
        setPendingRequests([])
        setFollowStatus('none')

        if (!profile?.user_id || isMockMode) return

        loadFollowData(profile.user_id, isOwner, getProfilesByUserIds)
            .then(({ followers: f, following: fw, pendingRequests: pr }) => {
                setFollowers(f)
                setFollowing(fw)
                setPendingRequests(pr)
            })
            .catch(err => console.error('loadFollowData error:', err))

        if (!isOwner) {
            getFollowStatus(profile.user_id)
                .then(setFollowStatus)
                .catch(() => setFollowStatus('none'))
        }
    }, [profile?.user_id, isOwner, isMockMode])

    useEffect(() => {
        if (!profile) return
        getPublicSkillsByUser(profile.user_id, filter, PAGE_SIZE, 0).then(({ docs, total }) => {
            setPublic(docs)
            setSkillsTotal(total)
            invalidateProfileCache(username)
        })
    }, [filter, profile])

    const handleLoadMore = useCallback(async () => {
        if (!profile || loadingMore) return
        setLoadingMore(true)
        try {
            const { docs } = await getPublicSkillsByUser(profile.user_id, filter, PAGE_SIZE, publicSkills.length)
            setPublic(prev => { const merged = [...prev, ...docs]; invalidateProfileCache(username); return merged })
        } finally {
            setLoadingMore(false)
        }
    }, [profile, filter, publicSkills.length, loadingMore, username])

    const handleMakePublic = useCallback(async (skillId) => {
        await toggleVisibility(skillId, 'public')
        const [pub, s] = await Promise.all([getPublicSkillsByUser(profile.user_id, filter, PAGE_SIZE, 0), getProfileStats(profile.user_id)])
        setPrivate(prev => prev.filter(s => s.id !== skillId))
        setPublic(pub.docs); setSkillsTotal(pub.total); setStats(s)
        invalidateProfileCache(username)
    }, [profile, filter, username])

    const handleMakePrivate = useCallback(async (skillId) => {
        await toggleVisibility(skillId, 'private')
        const [priv, s] = await Promise.all([getPrivateSkillsByUser(profile.user_id), getProfileStats(profile.user_id)])
        setPublic(prev => prev.filter(s => s.id !== skillId)); setPrivate(priv); setStats(s)
        invalidateProfileCache(username)
    }, [profile, username])

    const handleDelete = useCallback(async (skillId) => {
        await deleteSkill(skillId)
        const [pub, s] = await Promise.all([getPublicSkillsByUser(profile.user_id, filter, PAGE_SIZE, 0), getProfileStats(profile.user_id)])
        setPublic(pub.docs); setSkillsTotal(pub.total)
        setPrivate(prev => prev.filter(s => s.id !== skillId)); setStats(s)
        invalidateProfileCache(username)
    }, [profile, filter, username])

    const handleModalToggle = useCallback(async (skillId, newVisibility) => {
        await toggleVisibility(skillId, newVisibility)
        const [pub, priv, s] = await Promise.all([
            getPublicSkillsByUser(profile.user_id, filter, PAGE_SIZE, 0),
            getPrivateSkillsByUser(profile.user_id),
            getProfileStats(profile.user_id),
        ])
        setPublic(pub.docs); setSkillsTotal(pub.total); setPrivate(priv); setStats(s)
        invalidateProfileCache(username)
    }, [profile, filter, username])

    const displayName = useMemo(() => profile?.display_name || profile?.username || username, [profile, username])
    const avatarUrl = useMemo(() => profile?.avatar_url || authUser?.user_metadata?.avatar_url || null, [profile, authUser])
    const joinedDate = useMemo(() =>
        profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null,
        [profile]
    )
    useEffect(() => { setImgError(false) }, [avatarUrl])
    const [tab, setTab] = useState('skills')
    const vaultSkills = useMemo(() => {
        const savedIds = new Set(savedSkills.map((s) => s.id))
        return privateSkills.filter((s) => !savedIds.has(s.id))
    }, [privateSkills, savedSkills])

    if (!loading && notFound) {
        return (
            <div className="container-page py-16">
                <div className="box mx-auto max-w-xl">
                    <Blankslate icon={UserX} title="User not found" action={<Link to="/community" className="btn">Browse the community</Link>}>
                        <span className="font-semibold text-fg">@{username}</span> doesn’t exist on Skill Issue yet.
                    </Blankslate>
                </div>
            </div>
        )
    }

    const TABS = [
        { id: 'skills', label: 'Skills', icon: BookMarked, count: skillsTotal },
        { id: 'saved', label: 'Saved', icon: Bookmark, count: savedSkills.length },
        ...(isOwner ? [{ id: 'private', label: 'Private', icon: Lock, count: vaultSkills.length }] : []),
    ]

    const followButton = !isOwner && !loading && authUser && (
        <button
            type="button"
            onClick={handleFollowToggle}
            disabled={followLoading}
            className={`${followStatus === 'none' ? 'btn' : 'btn'} btn-block group/follow`}
        >
            {followLoading ? <Spinner size={14} /> : followStatus === 'accepted' ? (
                <>
                    <UserCheck className="h-4 w-4 group-hover/follow:hidden" />
                    <span className="group-hover/follow:hidden">Following</span>
                    <X className="hidden h-4 w-4 group-hover/follow:block" />
                    <span className="hidden group-hover/follow:inline">Unfollow</span>
                </>
            ) : followStatus === 'pending' ? (
                <><Clock className="h-4 w-4" />Request pending</>
            ) : (
                <><UserPlus className="h-4 w-4" />Follow</>
            )}
        </button>
    )

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

            {/* Sticky-ish tab bar spans the page, like a profile header */}
            <div className="border-b border-line">
                <div className="container-page">
                    <div className="md:ml-[calc(296px+1.5rem)]">
                        <nav className="tabnav -mb-px border-b-0" aria-label="Profile sections" role="tablist">
                            {TABS.map(({ id, label, icon: Icon, count }) => (
                                <button
                                    key={id}
                                    type="button"
                                    role="tab"
                                    aria-selected={tab === id}
                                    onClick={() => setTab(id)}
                                    className="tabnav-item"
                                >
                                    <Icon className="h-4 w-4" />
                                    {label}
                                    {!loading && <span className="counter">{formatCount(count)}</span>}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>

            <div className="container-page grid gap-6 py-6 md:grid-cols-[296px_minmax(0,1fr)]">
                {/* ── Sidebar ─────────────────────────── */}
                <aside className="md:-mt-14">
                    {loading ? (
                        <div className="space-y-3">
                            <div className="skeleton-line aspect-square w-24 rounded-full md:w-full" />
                            <div className="skeleton-line h-6 w-2/3" />
                            <div className="skeleton-line h-4 w-1/3" />
                        </div>
                    ) : (
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 md:block">
                                <div className="relative w-20 shrink-0 md:w-full">
                                    {avatarUrl && !imgError ? (
                                        <img
                                            src={avatarUrl}
                                            alt={displayName}
                                            width={296}
                                            height={296}
                                            onError={() => setImgError(true)}
                                            className="avatar aspect-square w-full bg-canvas"
                                        />
                                    ) : (
                                        <span className="avatar flex aspect-square w-full items-center justify-center bg-neutral-subtle font-display text-3xl font-semibold text-fg-muted md:text-7xl">
                                            {displayName?.charAt(0)?.toUpperCase() || '?'}
                                        </span>
                                    )}
                                </div>
                                <div className="min-w-0 md:mt-4">
                                    <h1 className="truncate font-display text-2xl font-semibold leading-tight">{displayName}</h1>
                                    <p className="truncate text-xl font-light text-fg-muted">{profile?.username}</p>
                                </div>
                            </div>

                            {profile?.bio && <p className="mt-4 text-[15px] leading-6">{profile.bio}</p>}

                            <div className="mt-4 space-y-2">
                                {isOwner && (
                                    <button type="button" onClick={() => setShowEdit(true)} className="btn btn-block">
                                        <Pencil className="h-4 w-4" />Edit profile
                                    </button>
                                )}
                                {followButton}
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-fg-muted">
                                <Users className="mr-0.5 h-4 w-4" />
                                <button type="button" onClick={() => setFollowModal('followers')} className="hover:text-accent">
                                    <strong className="text-fg">{formatCount(followers.length)}</strong> followers
                                </button>
                                <span aria-hidden="true">·</span>
                                <button type="button" onClick={() => setFollowModal('following')} className="hover:text-accent">
                                    <strong className="text-fg">{formatCount(following.length)}</strong> following
                                </button>
                            </div>

                            <ul className="mt-4 space-y-2 border-t border-line-muted pt-4 text-sm text-fg-muted">
                                <li className="flex items-center gap-2"><BookMarked className="h-4 w-4" /><strong className="text-fg">{formatCount(stats?.total_skills ?? 0)}</strong> public skills</li>
                                <li className="flex items-center gap-2"><Star className="h-4 w-4" /><strong className="text-fg">{formatCount(stats?.total_stars ?? 0)}</strong> stars received</li>
                                {joinedDate && <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />Joined {joinedDate}</li>}
                            </ul>

                            {isOwner && (
                                <div className="mt-4 space-y-2 border-t border-line-muted pt-4">
                                    {pendingRequests.length > 0 && (
                                        <button type="button" onClick={() => setFollowModal('pending')} className="btn btn-block justify-between">
                                            <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4" />Follow requests</span>
                                            <span className="counter bg-attention-subtle text-attention">{pendingRequests.length}</span>
                                        </button>
                                    )}
                                    {!hasReviewed && (
                                        <button type="button" onClick={() => setShowReviewModal(true)} className="btn btn-block">
                                            <MessageSquareHeart className="h-4 w-4" />Review Skill Issue
                                        </button>
                                    )}
                                    <button type="button" onClick={signOut} className="btn-invisible btn-block md:hidden">
                                        <LogOut className="h-4 w-4" />Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </aside>

                {/* ── Main ────────────────────────────── */}
                <div className="min-w-0">
                    {tab === 'skills' && (
                        <section aria-label="Published skills">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line-muted pb-4">
                                <h2 className="font-sans text-base font-semibold">Published skills</h2>
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 text-sm text-fg-muted">
                                        Sort
                                        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input h-8 w-auto py-0">
                                            {FILTERS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                                        </select>
                                    </label>
                                    {isOwner && <Link to="/build" className="btn-primary"><Plus className="h-4 w-4" />New</Link>}
                                </div>
                            </div>

                            {loading ? (
                                <div className="grid gap-4 sm:grid-cols-2">{Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
                            ) : publicSkills.length === 0 ? (
                                <div className="box">
                                    <Blankslate
                                        icon={BookMarked}
                                        title={isOwner ? 'You haven’t published any skills yet' : `${displayName} hasn’t published any skills yet`}
                                        action={isOwner && <Link to="/build" className="btn-primary">Build a skill</Link>}
                                    >
                                        {isOwner ? 'Build one with AI or upload an existing SKILL.md, then make it public.' : 'Check back later.'}
                                    </Blankslate>
                                </div>
                            ) : (
                                <>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {publicSkills.map((skill) => (
                                            <SkillCard
                                                key={skill.id}
                                                skill={skill}
                                                onClick={setSelectedSkill}
                                                isOwner={isOwner}
                                                onDelete={isOwner ? handleDelete : undefined}
                                                onMakePrivate={isOwner ? handleMakePrivate : undefined}
                                            />
                                        ))}
                                    </div>
                                    {publicSkills.length < skillsTotal && (
                                        <div className="mt-6 flex justify-center">
                                            <button type="button" onClick={handleLoadMore} disabled={loadingMore} className="btn">
                                                {loadingMore ? <><Spinner size={14} />Loading…</> : <>Load more · {skillsTotal - publicSkills.length} remaining</>}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    )}

                    {tab === 'saved' && (
                        <section aria-label="Saved skills">
                            <h2 className="mb-4 border-b border-line-muted pb-4 font-sans text-base font-semibold">Saved skills</h2>
                            {savedSkills.length === 0 ? (
                                <div className="box">
                                    <Blankslate icon={Bookmark} title="No saved skills">
                                        {isOwner ? 'Save skills you want to come back to and they’ll appear here.' : `${displayName} hasn’t saved any skills yet.`}
                                    </Blankslate>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {savedSkills.map((skill) => (
                                        <SkillCard key={skill.id} skill={skill} onClick={(s) => setSelectedSkill({ ...s, _savedByMe: true })} />
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {tab === 'private' && isOwner && (
                        <section aria-label="Private skills">
                            <div className="mb-4 flex items-center justify-between gap-3 border-b border-line-muted pb-4">
                                <h2 className="font-sans text-base font-semibold">Private skills</h2>
                                <span className="label"><Lock className="h-3 w-3" />Only visible to you</span>
                            </div>
                            {vaultSkills.length === 0 ? (
                                <div className="box">
                                    <Blankslate icon={Lock} title="No private skills">All of your skills are public.</Blankslate>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {vaultSkills.map((skill) => (
                                        <SkillCard key={skill.id} skill={skill} isPrivate isOwner onClick={setSelectedSkill} onDelete={handleDelete} onMakePrivate={undefined} />
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </div>

            {showEdit && (
                <EditProfileModal profile={profile} onClose={() => setShowEdit(false)}
                    onSave={(updated) => { setProfile((prev) => ({ ...prev, ...updated })); invalidateProfileCache(username) }} />
            )}

            {selectedSkill && (
                <UserSkillModal skill={selectedSkill} onClose={() => setSelectedSkill(null)}
                    isOwner={!selectedSkill._savedByMe && selectedSkill.user_id === authUser?.$id}
                    onDelete={!selectedSkill._savedByMe && selectedSkill.user_id === authUser?.$id ? async (id) => { await handleDelete(id) } : undefined}
                    onTogglePrivate={!selectedSkill._savedByMe && selectedSkill.user_id === authUser?.$id ? handleModalToggle : undefined} />
            )}

            {showReviewModal && (
                <ReviewModal onClose={() => setShowReviewModal(false)} authUser={authUser} onSubmitted={() => setHasReviewed(true)} />
            )}

            {followModal && (
                <FollowModal
                    type={followModal}
                    people={followModal === 'followers' ? followers : followModal === 'following' ? following : pendingRequests}
                    onClose={() => setFollowModal(null)}
                    onAccept={handleAcceptRequest}
                    onReject={handleRejectRequest}
                />
            )}
        </>
    )
}
