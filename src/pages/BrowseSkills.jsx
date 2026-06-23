import { useState, useEffect, useCallback, useRef, Fragment } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import JSZip from 'jszip'
import { useAuth } from '../context/AuthContext'
import { useDebounce } from '../hooks/useDebounce' 
import SEO, { jsonLdSchemas } from '../components/SEO'
import Breadcrumbs from '../components/Breadcrumbs'
import {
    fetchSkillFolders,
    fetchOpenClawSkills,
    fetchCommunityFlatSkills,
    fetchRepoStars,
    fetchSkillFiles,
    fetchFileContentByPath,
    downloadSkillAsZip,
    getOrgAvatarUrl,
    FEATURED_SOURCES,
    COMMUNITY_FLAT_SOURCES,
    OPENCLAW_SOURCE,
} from '../lib/githubService'
import FeaturedSkillCard from '../components/FeaturedSkillCard'
import { fetchIndexedSkills, toFeaturedSkillShape } from '../lib/indexedSkillService'
import { saveSkill, getAllPublicSkills } from '../lib/skillService'
import { toggleSavedSkill, getProfilesByUserIds } from '../lib/userService'
import { invalidateProfileCache } from '../lib/profileCache'
import UserSkillModal from '../components/UserSkillModal'
import SkillHoverPreview from '../components/SkillHoverPreview'
import ModalShell from '../components/ModalShell'
import SkillViewer from '../components/SkillViewer'
import SkillActionBar from '../components/SkillActionBar'
import CommentPanel, { StandaloneCommentDrawer } from '../components/CommentPanel'
import { useComments } from '../hooks/useComments'

// ── Skeleton loader ─────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-navy-50 to-navy p-5 animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white/5" />
                    <div className="w-16 h-5 rounded-lg bg-white/5" />
                </div>
                <div className="w-14 h-4 rounded bg-white/5" />
            </div>
            <div className="w-3/4 h-5 rounded bg-white/5 mb-2" />
            <div className="w-1/2 h-4 rounded bg-white/[0.03] mb-4" />
            <div className="border-t border-white/[0.04] pt-3 flex justify-between">
                <div className="w-16 h-4 rounded bg-white/[0.03]" />
                <div className="w-12 h-6 rounded-lg bg-white/5" />
            </div>
        </div>
    )
}

// ── Skill Detail Modal ───────────────────────────────────────────────────────────
function SkillModal({ skill, onClose, authUser, authProfile }) {
    const [content, setContent] = useState('')
    const [viewerContent, setViewerContent] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [skillFiles, setSkillFiles] = useState([])
    const [copied, setCopied] = useState(false)
    const [linkCopied, setLinkCopied] = useState(false)
    const [downloading, setDownloading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [saveError, setSaveError] = useState(null)
    const [commentsOpen, setCommentsOpen] = useState(false)
    const { openAuthModal } = useAuth()
    const skillId = skill ? `github:${skill.repo}:${skill.path}` : null
    const { comments, loadingComments, submitting: commentSubmitting, submitComment, removeComment } = useComments({
        skillId,
        skillType: 'github',
        open: commentsOpen,
        user: authUser,
        profile: authProfile,
    })

    useEffect(() => {
        if (!skill) return undefined
        let cancelled = false
        setLoading(true)
        setError(null)
        setContent('')
        setSkillFiles([])

        fetch(`https://api.github.com/repos/${skill.repo}/contents/${skill.path}`)
            .then((r) => r.json())
            .then((items) => { if (!cancelled && Array.isArray(items)) setSkillFiles(items) })
            .catch(() => {})

        fetchSkillFiles(skill.repo, skill.path)
            .then((files) => {
                if (cancelled) return ''
                if (Array.isArray(files)) setSkillFiles((prev) => prev.length ? prev : files)
                const target = files.find((f) => f.name.toUpperCase() === 'SKILL.MD') || files.find((f) => f.name.toLowerCase().endsWith('.md'))
                if (!target) throw new Error('No .md file found in this skill folder.')
                return fetchFileContentByPath(skill.repo, target.path)
            })
            .then((text) => { if (!cancelled) setContent(text || '') })
            .catch((err) => { if (!cancelled) setError(err.message) })
            .finally(() => { if (!cancelled) setLoading(false) })

        return () => { cancelled = true }
    }, [skill])

    if (!skill) return null

    const isGuest = !authUser
    const isOpenClaw = skill.isOpenClaw
    const isIndexed = skill.isIndexed
    const titleId = `github-skill-modal-${skill.repo}-${skill.path}`.replace(/[^a-z0-9_-]/gi, '-')

    async function handleCopy() {
        if (isGuest) { openAuthModal(); return }
        const src = viewerContent || content
        if (!src) return
        await navigator.clipboard.writeText(src)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
    }

    async function handleShare() {
        const params = new URLSearchParams({ repo: skill.repo, path: skill.path })
        const url = `${window.location.origin}/skill/github?${params.toString()}`
        if (navigator.share) {
            try { await navigator.share({ title: skill.displayName, url }) } catch { /* cancelled */ }
        } else {
            await navigator.clipboard.writeText(url)
            setLinkCopied(true)
            window.setTimeout(() => setLinkCopied(false), 2000)
        }
    }

    async function handleDownload() {
        if (isGuest) { openAuthModal(); return }
        setDownloading(true)
        try {
            await downloadSkillAsZip(skill.repo, skill.path, skill.name)
        } catch (err) {
            console.error('Download failed:', err)
        } finally {
            setDownloading(false)
        }
    }

    async function handleSave() {
        if (!authUser) { openAuthModal(); return }
        if (!content || saving) return
        setSaving(true)
        setSaveError(null)
        try {
            const newSkill = await saveSkill({
                title: skill.displayName,
                content,
                tags: [],
                visibility: 'private',
                description: `Saved from GitHub: ${skill.repo}`,
                category: '',
            })
            if (authProfile?.id) await toggleSavedSkill(authProfile.id, newSkill.id, 'save')
            setSaved(true)
            invalidateProfileCache(authProfile?.username)
            window.setTimeout(() => setSaved(false), 2500)
        } catch (err) {
            setSaveError(err.message || 'Failed to save')
            window.setTimeout(() => setSaveError(null), 3500)
        } finally {
            setSaving(false)
        }
    }

    return (
        <ModalShell onClose={onClose} titleId={titleId} contentClassName="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <img
                        src={isOpenClaw ? `https://avatars.githubusercontent.com/${skill.author}` : isIndexed ? (skill.ownerAvatar || `https://avatars.githubusercontent.com/${skill.company}`) : getOrgAvatarUrl(skill.repo)}
                        alt={isOpenClaw ? skill.author : skill.company}
                        loading="lazy"
                        width={32}
                        height={32}
                        className={`w-8 h-8 border border-white/10 ${isOpenClaw ? 'rounded-full' : 'rounded-lg'}`}
                    />
                    <div className="min-w-0">
                        <h2 id={titleId} className="font-clash font-bold text-lg text-white truncate">{skill.displayName}</h2>
                        <p className="font-satoshi text-xs text-white/35 truncate">{isOpenClaw ? skill.attributionLabel : `${skill.company} · ${skill.stars?.toLocaleString() || 0} stars`}</p>
                    </div>
                </div>
                <button type="button" onClick={onClose} aria-label="Close skill modal" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors shrink-0 ml-3">
                    <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="flex-1 min-h-0 p-3 sm:p-6">
                <SkillViewer
                    fill
                    files={skillFiles}
                    rootName={skill.path?.split('/').pop() || skill.name}
                    loading={loading}
                    error={error}
                    markdownContent={content}
                    locked={isGuest}
                    showTabs={!isGuest}
                    onLockedAction={openAuthModal}
                    fetchFileContent={(file) => fetchFileContentByPath(skill.repo, file.path)}
                    onActiveContentChange={setViewerContent}
                />
            </div>
            {content && (
                <SkillActionBar
                    className="px-3 sm:px-6 py-3 sm:py-4 border-t border-white/[0.06] bg-white/[0.02] shrink-0"
                    actions={[
                        { key: 'copy', icon: 'copy', label: copied ? 'Copied!' : 'Copy', ariaLabel: 'Copy skill markdown', onClick: handleCopy, status: copied ? 'success' : undefined },
                        { key: 'share', icon: 'share', label: linkCopied ? 'Link copied!' : 'Share', ariaLabel: 'Share skill link', onClick: handleShare, status: linkCopied ? 'success' : undefined },
                        { key: 'download', icon: 'download', label: downloading ? 'Zipping...' : 'Download .zip', ariaLabel: 'Download skill as zip', onClick: handleDownload, loading: downloading, primary: true },
                        { key: 'comments', icon: 'comments', label: 'Comments', ariaLabel: 'View comments', onClick: () => setCommentsOpen(o => !o), active: commentsOpen },
                    ]}
                    secondaryActions={[
                        { key: 'github', icon: 'github', label: 'View on GitHub', ariaLabel: 'Open skill on GitHub', href: skill.htmlUrl || skill.attributionUrl },
                        { key: 'save', icon: 'save', label: isGuest ? 'Sign in to Save' : saved ? 'Saved!' : saveError ? 'Already saved' : 'Save', ariaLabel: isGuest ? 'Sign in to save skill' : 'Save skill', onClick: isGuest ? openAuthModal : handleSave, loading: saving, status: saved ? 'success' : undefined, active: saved },
                    ]}
                />
            )}
            <CommentPanel
                open={commentsOpen}
                onClose={() => setCommentsOpen(false)}
                skillId={skillId}
                skillTitle={skill.displayName}
                user={authUser}
                userProfile={authProfile}
                comments={comments}
                loadingComments={loadingComments}
                submitting={commentSubmitting}
                onSubmitComment={submitComment}
                onDeleteComment={removeComment}
            />
        </ModalShell>
    )
}

// ── Community DB Skill Card ───────────────────────────────────────────────────
/** Card for skills stored in Appwrite (user-uploaded). Matches OpenClaw CommunityCard design. */
function DbSkillCard({ skill, uploaderProfile, onClick, index = 0 }) {
    const navigate = useNavigate()
    const { user, profile, openAuthModal } = useAuth()
    const [downloading, setDownloading] = useState(false)
    const [commentsOpen, setCommentsOpen] = useState(false)
    const { comments, loadingComments, submitting: commentSubmitting, submitComment, removeComment } = useComments({
        skillId: skill?.$id || skill?.id,
        skillType: 'db',
        open: commentsOpen,
        user,
        profile,
    })
    const { title, description, category, star_count = 0, copy_count = 0, $createdAt, created_at } = skill

    async function handleDownloadZip(e) {
        e.stopPropagation()
        if (downloading) return
        setDownloading(true)
        try {
            const zip = new JSZip()
            zip.file('SKILL.md', skill.content || `# ${title}\n\n${description || ''}`)
            const blob = await zip.generateAsync({ type: 'blob' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${(title || 'skill').replace(/[^a-z0-9_-]/gi, '_')}.zip`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Download failed:', err)
        } finally {
            setDownloading(false)
        }
    }
    const username = uploaderProfile?.username || 'unknown'
    const displayName = uploaderProfile?.display_name || username
    const avatarUrl = uploaderProfile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}`

    const ago = (() => {
        const dateStr = $createdAt || created_at
        if (!dateStr) return ''
        const diff = Date.now() - new Date(dateStr).getTime()
        const d = Math.floor(diff / 86400000)
        if (Number.isNaN(d) || d < 0) return ''
        if (d < 1) return 'today'
        if (d === 1) return 'yesterday'
        if (d < 30) return `${d}d ago`
        if (d < 365) return `${Math.floor(d / 30)}mo ago`
        return `${Math.floor(d / 365)}y ago`
    })()

    const categoryColors = {
        coding: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
        writing: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
        research: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
        analysis: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
        design: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
        marketing: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
        education: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
        productivity: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
        business: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
        devops: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
        security: 'bg-red-500/10 text-red-300 border-red-500/20',
        'data science': 'bg-violet-500/10 text-violet-300 border-violet-500/20',
    }
    const catStyle = categoryColors[category?.toLowerCase()] ?? 'bg-white/5 text-white/40 border-white/10'

    return (
        <div
            onClick={() => onClick(skill)}
            className="skill-card-enter skill-card-hover-wrap group relative bg-gradient-to-b from-navy-50 to-navy border border-white/[0.06] rounded-2xl p-5 hover:border-accent/20 hover:shadow-[0_0_30px_rgba(75,169,255,0.06)] transition-all duration-400 hover:-translate-y-1 flex flex-col gap-4 cursor-pointer"
            style={{ animationDelay: `${index * 60}ms` }}
        >
            {/* Top edge highlight */}
            <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-accent/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* ── Hover Preview Overlay ── */}
            <SkillHoverPreview
                title={title}
                description={description}
                subtitle={`by @${username}${category ? ` · ${category}` : ''}`}
                author={`@${username}`}
                avatarUrl={avatarUrl}
                tags={Array.isArray(skill.tags) ? skill.tags : []}
                category={category}
                onDownload={() => handleDownloadZip({ stopPropagation: () => {} })}
                position="top"
            />

            {/* Header row: user avatar + username + community tag */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <img
                        src={avatarUrl}
                        alt={username}
                        loading="lazy"
                        width={28}
                        height={28}
                        className="w-7 h-7 rounded-full border border-white/10 bg-white/5 object-cover"
                    />
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/user/${username}`)
                        }}
                        className="font-mono text-[11px] text-accent/80 hover:text-accent transition-colors truncate max-w-[140px]"
                        title={`@${username}`}
                    >
                        @{username}
                    </button>
                </div>
                {/* Community tag */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-satoshi font-bold border bg-accent/10 text-accent border-accent/20 uppercase tracking-wider">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Community
                </span>
            </div>

            {/* Skill name + description */}
            <div className="flex-1 min-w-0">
                <h3 className="font-clash font-bold text-lg text-white leading-snug mb-1 group-hover:text-accent-light transition-colors duration-300 line-clamp-2">
                    {title}
                </h3>
                <p className="font-satoshi text-sm text-white/35 line-clamp-1">
                    {description || `by ${displayName}`}
                </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                <div className="flex items-center gap-3">
                    {/* Stars */}
                    <span className="flex items-center gap-1.5 font-satoshi text-xs text-white/30 group-hover:text-white/40 transition-colors">
                        <svg className="w-3.5 h-3.5 text-amber-400/50 group-hover:text-amber-400/70 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        {star_count}
                    </span>
                    {/* Copies */}
                    <span className="flex items-center gap-1.5 font-satoshi text-xs text-white/30 group-hover:text-white/40 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5" />
                        </svg>
                        {copy_count}
                    </span>
                    {ago && <span className="text-white/20 font-satoshi text-[10px]">{ago}</span>}
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Download zip */}
                    <button
                        onClick={(e) => { e.stopPropagation(); if (!user) { openAuthModal(); return; } handleDownloadZip(e); }}
                        title="Download .zip"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/[0.06] border border-accent/15 text-accent/80 font-satoshi text-xs font-semibold hover:bg-accent/15 hover:border-accent/30 hover:text-accent hover:shadow-[0_0_12px_rgba(75,169,255,0.12)] transition-all duration-300 disabled:opacity-40"
                        disabled={downloading}
                    >
                        {downloading ? (
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                        )}
                        <span>.zip</span>
                    </button>
                    
                    <button
                        onClick={(e) => { e.stopPropagation(); setCommentsOpen(true); }}
                        title="Comments"
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-satoshi text-xs font-semibold transition-all duration-300 ${commentsOpen ? 'bg-accent/20 border-accent/40 text-accent' : 'bg-white/[0.03] border-white/10 text-white/50 hover:border-accent/25 hover:bg-white/[0.06] hover:text-white/70'}`}
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                        </svg>
                        <span>Comments</span>
                    </button>
                    {/* Category badge */}
                    {category && (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-satoshi font-bold border ${catStyle} uppercase tracking-wider`}>
                            {category}
                        </span>
                    )}
                </div>
            </div>

            
            {commentsOpen && (
                <StandaloneCommentDrawer
                    open={commentsOpen}
                    onClose={() => setCommentsOpen(false)}
                    skillId={skill.$id || skill.id}
                    skillTitle={title}
                    user={user}
                    userProfile={profile}
                    comments={comments}
                    loadingComments={loadingComments}
                    submitting={commentSubmitting}
                    onSubmitComment={submitComment}
                    onDeleteComment={removeComment}
                />
            )}
        </div>
    )
}

// ── Main Page ───────────────────────────────────────────────────────────
export default function BrowseSkills() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { user: authUser, profile: authProfile, openAuthModal } = useAuth()
    const chipsRef = useRef(null)
    const [activeDot, setActiveDot] = useState(0)
    const totalDots = 6

    // ── Per-source state: { [key]: { skills, loading, error } } ──────────
    // Keys: company name for official (Anthropic etc), 'OpenClaw', label for community flat
    const [sourceData, setSourceData] = useState(() => {
        const d = {}
        FEATURED_SOURCES.forEach(s => { d[s.company] = { skills: [], loading: true, error: null } })
        d.OpenClaw = { skills: [], loading: true, error: null }
        COMMUNITY_FLAT_SOURCES.forEach(s => { d[s.label] = { skills: [], loading: true, error: null } })
        return d
    })
    // "See all" expansion per source (collapses to INITIAL_PER_SOURCE in All mode)
    const [expandedSources, setExpandedSources] = useState(new Set())
    const INITIAL_PER_SOURCE = 6

    const [activeFilter, setActiveFilter] = useState('All')
    const [selectedSkill, setSelectedSkill] = useState(null)
    const [downloadingId, setDownloadingId] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const OC_PAGE_SIZE = 48
    const [ocPage, setOcPage] = useState(1)

    // Clean custom hook for search debouncing (applied to both API and local filters)
    const debouncedSearch = useDebounce(searchQuery, 300)
    
    // True while user is still typing and UI hasn't updated yet
    const isSearchPending = searchQuery !== debouncedSearch

    // ─ DB community skills state
    const [dbSkills, setDbSkills] = useState([])
    const [dbProfiles, setDbProfiles] = useState({}) // user_id → profile
    const [dbLoading, setDbLoading] = useState(true)
    const [dbSort, setDbSort] = useState('recent')
    const [selectedDbSkill, setSelectedDbSkill] = useState(null)

    // ─ Indexed skills state (GitHub crawler) — cursor-based pagination
    const [indexedSkills, setIndexedSkills] = useState([])
    const [indexedTotal, setIndexedTotal] = useState(0)
    const [indexedLoading, setIndexedLoading] = useState(true)
    const [indexedHasMore, setIndexedHasMore] = useState(true)
    const [indexedPage, setIndexedPage] = useState(1)          // current page (MongoDB page-based)
    const prevIndexedSearchRef = useRef(debouncedSearch)
    const INDEXED_PAGE_SIZE = 48

    // Backward-compat: redirect old /browse?repo=...&path=... share links
    useEffect(() => {
        const repo = searchParams.get('repo')
        const path = searchParams.get('path')
        if (repo && path) {
            navigate(`/skill/github?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}`, { replace: true })
        }
    }, [searchParams, navigate])

    // Fetch GitHub featured skills — each source fires independently so cards appear
    // as soon as that source resolves, not after ALL sources have finished.
    useEffect(() => {
        const t0 = performance.now()
        console.log('[Browse] Starting parallel GitHub fetches for all sources…')

        function resolveSource(key, skills) {
            console.log(`[Browse] ${key}: ${(performance.now() - t0).toFixed(0)}ms — ${skills.length} skills loaded`)
            setSourceData(prev => ({ ...prev, [key]: { skills, loading: false, error: null } }))
        }
        function rejectSource(key, err) {
            console.error(`[Browse] ${key} failed (${(performance.now() - t0).toFixed(0)}ms):`, err.message)
            setSourceData(prev => ({ ...prev, [key]: { skills: [], loading: false, error: err.message } }))
        }

        // Official sources — all kicked off simultaneously
        FEATURED_SOURCES.forEach(source => {
            Promise.all([fetchSkillFolders(source), fetchRepoStars(source.repo)])
                .then(([folders, stars]) => resolveSource(source.company, folders.map(f => ({ ...f, stars }))))
                .catch(err => rejectSource(source.company, err))
        })

        // OpenClaw (tree-based single API call)
        Promise.all([fetchOpenClawSkills(OPENCLAW_SOURCE), fetchRepoStars(OPENCLAW_SOURCE.repo)])
            .then(([skills, stars]) => resolveSource('OpenClaw', skills.map(s => ({ ...s, stars }))))
            .catch(err => rejectSource('OpenClaw', err))

        // Community flat sources (Composio etc.)
        COMMUNITY_FLAT_SOURCES.forEach(source => {
            fetchCommunityFlatSkills(source)
                .then(skills => resolveSource(source.label, skills))
                .catch(err => rejectSource(source.label, err))
        })
    }, [])

    // Derive flat arrays + loading/errors from per-source state
    const officialSkills = FEATURED_SOURCES.flatMap(s => sourceData[s.company]?.skills ?? [])
    const openClawSkills = sourceData.OpenClaw?.skills ?? []
    const communitySkills = COMMUNITY_FLAT_SOURCES.flatMap(s => sourceData[s.label]?.skills ?? [])
    const loading = Object.values(sourceData).some(d => d.loading)
    const errors = Object.entries(sourceData)
        .filter(([, d]) => d.error)
        .map(([company, d]) => ({ company, error: d.error }))

    // Fetch DB community skills + uploader profiles
    useEffect(() => {
        setDbLoading(true)
        getAllPublicSkills(dbSort, 100, debouncedSearch)
            .then(async (skills) => {
                setDbSkills(skills)
                const userIds = skills.map(s => s.user_id).filter(Boolean)
                const profiles = await getProfilesByUserIds(userIds)
                setDbProfiles(profiles)
            })
            .catch(console.error)
            .finally(() => setDbLoading(false))
    }, [dbSort, debouncedSearch])

    // Fetch indexed skills (from GitHub crawler via MongoDB API) — page-based pagination
    // Single effect: handles first page, search resets, and load-more.
    useEffect(() => {
        // Detect search change → reset to page 1
        if (prevIndexedSearchRef.current !== debouncedSearch) {
            prevIndexedSearchRef.current = debouncedSearch
            // If already on page 1, fetch still runs via the dependency.
            // Otherwise, setting page=1 triggers the effect.
            if (indexedPage !== 1) { setIndexedPage(1); return }
        }

        setIndexedLoading(true)
        fetchIndexedSkills({
            limit: INDEXED_PAGE_SIZE,
            page: indexedPage,
            sort: 'stars',
            search: debouncedSearch,
            min_stars: 0,
        })
            .then(data => {
                const shaped = data.skills.map(toFeaturedSkillShape)
                if (indexedPage === 1) {
                    // First page (or reset) — replace
                    setIndexedSkills(shaped)
                } else {
                    // Subsequent page — append
                    setIndexedSkills(prev => [...prev, ...shaped])
                }
                setIndexedTotal(data.total)    // ← real count from MongoDB, no cap
                setIndexedHasMore(data.hasMore)
            })
            .catch(err => console.error('[Browse] Indexed skills fetch failed:', err))
            .finally(() => setIndexedLoading(false))
    }, [indexedPage, debouncedSearch])

    // Reset pagination when search/filter changes
    useEffect(() => { setOcPage(1) }, [searchQuery, activeFilter])
    // Reset indexed pagination when filter changes (search reset handled inside effect)
    useEffect(() => {
        setIndexedHasMore(true)
        setIndexedPage(1)
    }, [activeFilter])

    // Special Skill Issue filter ID
    const SKILL_ISSUE_FILTER = 'Skill Issue'
    const DISCOVERED_FILTER = 'Discovered'

    // All community filter IDs (OpenClaw + flat community labels)
    const communityFilterIds = ['OpenClaw', ...COMMUNITY_FLAT_SOURCES.map((s) => s.label)]
    const isCommunityFilter = communityFilterIds.includes(activeFilter)
    const isSkillIssueFilter = activeFilter === SKILL_ISSUE_FILTER
    const isDiscoveredFilter = activeFilter === DISCOVERED_FILTER

    const companies = ['All', SKILL_ISSUE_FILTER, DISCOVERED_FILTER, ...FEATURED_SOURCES.map((s) => s.company), ...communityFilterIds]

const q = debouncedSearch.toLowerCase().trim()

    const filteredOfficial = officialSkills.filter((s) => {
        if (isCommunityFilter || isSkillIssueFilter || isDiscoveredFilter) return false
        const matchesCompany = activeFilter === 'All' || s.company === activeFilter
        const matchesSearch = !q || s.displayName.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.company.toLowerCase().includes(q) || s.repo?.toLowerCase().includes(q) || s.repoDescription?.toLowerCase().includes(q)
        return matchesCompany && matchesSearch
    })

    const filteredCommunity = communitySkills.filter((s) => {
        if (isSkillIssueFilter || isDiscoveredFilter) return false
        const matchesFilter = activeFilter === 'All' || activeFilter === s.label
        return matchesFilter && (!q || s.displayName.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.author?.toLowerCase().includes(q) || s.attributionLabel?.toLowerCase().includes(q))
    })

    const filteredOpenClaw = openClawSkills.filter((s) => {
        if (isSkillIssueFilter || isDiscoveredFilter) return false
        const matchesFilter = activeFilter === 'All' || activeFilter === 'OpenClaw'
        return matchesFilter && (!q || s.displayName.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.author.toLowerCase().includes(q) || s.attributionLabel.toLowerCase().includes(q))
    })

    // Filter DB community skills — only show for All or Skill Issue filter
    const filteredDbSkills = dbSkills.filter((s) => {
        if (!isSkillIssueFilter && activeFilter !== 'All') return false
        if (!q) return true
        const profile = dbProfiles[s.user_id]
        return (
            s.title?.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q) ||
            s.category?.toLowerCase().includes(q) ||
            profile?.username?.toLowerCase().includes(q) ||
            profile?.display_name?.toLowerCase().includes(q)
        )
    })

    // Filter indexed skills — show for All or Discovered filter
    // Server (MongoDB) already does text search via debouncedSearch, so we
    // ONLY filter by tab here. No client-side search filtering — that caused
    // results to flash/disappear while typing because q (instant) diverged
    // from debouncedSearch (delayed).
    const filteredIndexed = indexedSkills.filter((s) => {
        if (!isDiscoveredFilter && activeFilter !== 'All') return false
        return true
    })

    const totalCount = officialSkills.length + communitySkills.length + openClawSkills.length + indexedTotal

    const handleDownload = useCallback(async (skill) => {
        if (!authUser) { openAuthModal(); return }
        const id = `${skill.repo}:${skill.path}`
        setDownloadingId(id)
        try {
            await downloadSkillAsZip(skill.repo, skill.path, skill.name)
        } catch (err) {
            console.error('Download failed:', err)
        } finally {
            setDownloadingId(null)
        }
    }, [authUser])
    
    // Scroll Dots track 
    const handleChipScroll = () => {
        const el = chipsRef.current
        if (!el) return
    
        const maxScroll = el.scrollWidth - el.clientWidth
    
        if (maxScroll <= 0) {
            setActiveDot(0)
            return
        }
    
        const progress = el.scrollLeft / maxScroll
        const index = Math.round(progress * (totalDots - 1))
    
        setActiveDot(index)
    }

    return (
        <div className="relative min-h-screen pt-32 pb-20">
            <SEO
                title="Browse AI Skills — Discover Skill Files for Claude, ChatGPT, Gemini & Cursor"
                description="Explore 50,000+ AI skill files from leading companies and the community. Find skills for coding, writing, design, marketing and more."
                path="/browse"
                jsonLd={jsonLdSchemas.breadcrumb([
                    { name: 'Home', url: '/' },
                    { name: 'Browse Skills', url: '/browse' },
                ])}
            />
            {/* Ambient glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/[0.04] rounded-full blur-[140px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <Breadcrumbs items={[{ label: 'Browse Skills' }]} />

                {/* ── Header ─────────────────────────── */}
                <div className="text-center mb-12 max-w-3xl mx-auto">
                    <span className="inline-block font-satoshi text-sm font-medium tracking-widest uppercase text-accent/70 mb-4">
                        Marketplace
                    </span>
                    <h1 className="font-clash font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] mb-5">
                        Featured{' '}
                        <span className="italic text-accent glow-text">Skills</span>
                    </h1>
                    <p className="font-satoshi text-lg text-white/40 max-w-xl mx-auto">
                        Official skill packages from the world's leading AI companies — always fresh from GitHub.
                    </p>
                </div>

                {/* ── Search bar ──────────────────────── */}
                <div className="max-w-lg mx-auto mb-8">
                    <div className="relative">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search skills by name, company, or author..."
                            className="w-full pl-11 pr-11 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:border-accent/40 focus:bg-white/[0.05] text-white placeholder:text-white/20 font-satoshi text-sm outline-none transition-all duration-300"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Filter tabs ─────────────── */}
                <div className="relative mb-10">
                    <div 
                        ref={chipsRef}
                        onScroll={handleChipScroll} 
                        className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide" 
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {companies.map((name) => {
                            const isActive = activeFilter === name
                            const isOC = name === 'OpenClaw'
                            const isSkillIssueTab = name === SKILL_ISSUE_FILTER
                            const flatSource = COMMUNITY_FLAT_SOURCES.find((s) => s.label === name)
                            const isCommunityTab = isOC || !!flatSource
                            // Pipe separator before first GitHub/official tab
                            const isFirstOfficial = name === FEATURED_SOURCES[0]?.company
                            // Pipe separator before first community tab
                            const isFirstCommunity = name === communityFilterIds[0]
                            const officialSource = FEATURED_SOURCES.find((s) => s.company === name)
    
                            const isDiscoveredTab = name === DISCOVERED_FILTER
    
                            const count = isSkillIssueTab
                                ? dbSkills.length
                                : isDiscoveredTab
                                    ? indexedTotal
                                    : isOC
                                        ? openClawSkills.length
                                        : flatSource
                                            ? communitySkills.filter((s) => s.label === name).length
                                            : name === 'All'
                                                ? totalCount + dbSkills.length
                                                : officialSkills.filter((s) => s.company === name).length
    
                            const activeStyle = (isSkillIssueTab || name === 'All') && isActive
                                ? 'bg-accent/15 border-accent/30 text-accent shadow-[0_0_15px_rgba(75,169,255,0.1)]'
                                : isDiscoveredTab && isActive
                                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                                    : isCommunityTab && isActive
                                        ? 'bg-violet-500/15 border-violet-500/30 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                                        : isActive
                                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                            : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:border-white/15 hover:text-white/60'
                            const countStyle = (isSkillIssueTab || name === 'All') && isActive
                                ? 'bg-accent/20 text-accent'
                                : isDiscoveredTab && isActive
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : isCommunityTab && isActive
                                        ? 'bg-violet-500/20 text-violet-300'
                                        : isActive
                                            ? 'bg-emerald-500/20 text-emerald-300'
                                            : 'bg-white/5 text-white/25'
    
                            const avatarSrc = isSkillIssueTab
                                ? '/favicon.png'
                                : isDiscoveredTab
                                    ? null
                                    : isOC
                                    ? 'https://avatars.githubusercontent.com/openclaw'
                                    : flatSource
                                        ? `https://avatars.githubusercontent.com/${flatSource.company}`
                                        : officialSource
                                            ? getOrgAvatarUrl(officialSource.repo)
                                            : null
    
                            return (
                                <div key={name} className="flex items-center gap-2 shrink-0">
                                    {/* Pipe separator before first official tab */}
                                    {isFirstOfficial && (
                                        <span className="w-px h-5 bg-white/10 rounded-full mx-1 shrink-0" />
                                    )}
                                    {/* Pipe separator before first community tab */}
                                    {isFirstCommunity && (
                                        <span className="w-px h-5 bg-white/10 rounded-full mx-1 shrink-0" />
                                    )}
                                    {/* Pipe separator before Discovered tab */}
                                    {isDiscoveredTab && (
                                        <span className="w-px h-5 bg-white/10 rounded-full mx-1 shrink-0" />
                                    )}
                                    <button
                                        onClick={() => setActiveFilter(name)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-satoshi text-sm font-medium transition-all duration-300 border ${activeStyle}`}
                                    >
                                        {isDiscoveredTab ? (
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                                            </svg>
                                        ) : avatarSrc ? (
                                            <img
                                                src={avatarSrc}
                                                alt={name}
                                                loading="lazy"
                                                width={16}
                                                height={16}
                                                className={`w-4 h-4 ${isSkillIssueTab ? 'rounded-md' : isCommunityTab ? 'rounded-full' : 'rounded'}`}
                                            />
                                        ) : null}
                                        {name}
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${countStyle}`}>
                                            {count}
                                        </span>
                                    </button>
                                </div>
                            )
                        })}
                    </div>

                    {/* Scroll Dots track */}
                    <div className="flex items-center justify-center gap-1.5 mt-3">
                        {Array.from({ length: totalDots }).map((_, i) => (
                            <div
                                key={i}
                                className={`rounded-full transition-all duration-300 ${
                                    i === activeDot
                                        ? 'w-5 h-1.5 bg-accent'
                                        : 'w-1.5 h-1.5 bg-white/15'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* ── Error notices (per-source) ─────── */}
                {errors.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-8 justify-center">
                        {errors.map((err, i) => (
                            <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/5 border border-red-500/15 text-red-300/70 font-satoshi text-xs">
                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                </svg>
                                <span><strong>{err.company}</strong> — {err.error}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Loading skeleton (GitHub) — only shown before DB skills exist ── */}
                {loading && filteredDbSkills.length === 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                )}

                {/* ── Unified skills grid ─────────────────────────────────── */}
                {(loading || filteredOfficial.length > 0 || filteredCommunity.length > 0 || filteredOpenClaw.length > 0 || filteredDbSkills.length > 0 || filteredIndexed.length > 0 || !dbLoading) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                        {/* ── From the Community (Skill Issue DB) — first, leftmost ── */}
                        {!dbLoading && filteredDbSkills.length > 0 && (
                            <>
                                <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex items-center gap-4 py-2">
                                    <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                                    <div className="flex items-center gap-2 shrink-0">
                                        <img
                                            src="/skill-issue-white.png"
                                            alt="Skill Issue"
                                            className="h-6 w-auto object-contain opacity-60"
                                        />
                                        <span className="text-emerald-500/20 select-none">·</span>
                                        <span className="font-satoshi text-[11px] font-semibold text-white/20 tracking-widest uppercase">{filteredDbSkills.length} skills</span>
                                    </div>
                                    <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                                </div>
                                {/* Sort controls — above the cards, only in Skill Issue filter */}
                                {isSkillIssueFilter && (
                                <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex items-center gap-2">
                                    <span className="font-satoshi text-xs text-white/25 mr-1">Sort:</span>
                                    {[['recent', 'Recent'], ['most-rated', 'Top Rated'], ['most-copied', 'Most Copied']].map(([val, label]) => (
                                        <button
                                            key={val}
                                            onClick={() => setDbSort(val)}
                                            className={`px-3 py-1.5 rounded-lg font-satoshi text-xs font-semibold transition-all duration-200 border ${dbSort === val
                                                ? 'bg-accent/15 border-accent/30 text-accent'
                                                : 'bg-white/[0.02] border-white/[0.06] text-white/35 hover:text-white/55 hover:border-white/15'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                )}
                                {filteredDbSkills.map((skill, i) => (
                                    <DbSkillCard
                                        key={skill.id}
                                        skill={skill}
                                        uploaderProfile={dbProfiles[skill.user_id]}
                                        onClick={setSelectedDbSkill}
                                        index={i}
                                    />
                                ))}
                                {/* Separator after DB skills before GitHub skills */}
                                {(loading || filteredOfficial.length > 0 || filteredCommunity.length > 0 || filteredOpenClaw.length > 0) && (
                                    <div className="col-span-1 sm:col-span-2 lg:col-span-3 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent my-1" />
                                )}
                            </>
                        )}

                        {/* Official cards — grouped by company with per-source skeleton + limit */}
                        {FEATURED_SOURCES.map((source) => {
                            const srcData = sourceData[source.company]
                            const isSourceLoading = srcData?.loading ?? false
                            const companySkills = filteredOfficial.filter((s) => s.company === source.company)
                            const isExpanded = expandedSources.has(source.company)
                            const showLimit = activeFilter === 'All' && !isExpanded && !q
                            const displaySkills = showLimit ? companySkills.slice(0, INITIAL_PER_SOURCE) : companySkills
                            const hasMore = showLimit && companySkills.length > INITIAL_PER_SOURCE

                            if (!isSourceLoading && companySkills.length === 0) return null
                            return (
                                <Fragment key={source.company}>
                                    <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex items-center gap-4 py-2">
                                        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                                        <div className="flex items-center gap-2 shrink-0">
                                            <img
                                                src={getOrgAvatarUrl(source.repo)}
                                                alt={source.company}
                                                loading="lazy"
                                                width={20}
                                                height={20}
                                                className="w-5 h-5 rounded object-cover opacity-70"
                                            />
                                            <span className="font-satoshi text-[11px] font-semibold text-white/20 tracking-widest uppercase">{source.company}</span>
                                            <span className="text-emerald-500/20 select-none">·</span>
                                            {isSourceLoading ? (
                                                <svg className="w-3 h-3 text-white/15 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                            ) : (
                                                <span className="font-satoshi text-[11px] font-semibold text-white/20 tracking-widest uppercase">{companySkills.length} skills</span>
                                            )}
                                        </div>
                                        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                                    </div>
                                    {isSourceLoading ? (
                                        Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={`sk-${source.company}-${i}`} />)
                                    ) : (
                                        <>
                                            {displaySkills.map((skill) => (
                                                <FeaturedSkillCard
                                                    key={`${skill.repo}:${skill.path}`}
                                                    skill={skill}
                                                    onClick={setSelectedSkill}
                                                    onDownload={handleDownload}
                                                    isDownloading={downloadingId === `${skill.repo}:${skill.path}`}
                                                />
                                            ))}
                                            {hasMore && (
                                                <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex justify-center py-1">
                                                    <button
                                                        onClick={() => setExpandedSources(prev => new Set([...prev, source.company]))}
                                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-300/70 hover:text-emerald-200 hover:border-emerald-500/35 hover:bg-emerald-500/10 font-satoshi text-sm font-medium transition-all duration-300"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                        See all {companySkills.length} from {source.company}
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                                                            +{companySkills.length - INITIAL_PER_SOURCE} more
                                                        </span>
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </Fragment>
                            )
                        })}

                        {/* Composio (community flat) — skeleton while loading + 6-initial limit */}
                        {COMMUNITY_FLAT_SOURCES.map((flatSource) => {
                            const srcData = sourceData[flatSource.label]
                            const isSourceLoading = srcData?.loading ?? false
                            const sourceSkills = filteredCommunity.filter((s) => s.label === flatSource.label)
                            const isExpanded = expandedSources.has(flatSource.label)
                            const showLimit = activeFilter === 'All' && !isExpanded && !q
                            const displaySkills = showLimit ? sourceSkills.slice(0, INITIAL_PER_SOURCE) : sourceSkills
                            const hasMore = showLimit && sourceSkills.length > INITIAL_PER_SOURCE

                            if (!isSourceLoading && sourceSkills.length === 0) return null
                            return (
                                <Fragment key={flatSource.label}>
                                    {(filteredOfficial.length > 0 || FEATURED_SOURCES.some(s => !sourceData[s.company]?.loading)) && (
                                        <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex items-center gap-4 py-2">
                                            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
                                            <div className="flex items-center gap-2 shrink-0">
                                                <img
                                                    src={`https://avatars.githubusercontent.com/${flatSource.company}`}
                                                    alt={flatSource.label}
                                                    loading="lazy"
                                                    width={20}
                                                    height={20}
                                                    className="w-5 h-5 rounded-full border border-violet-500/30"
                                                />
                                                <span className="font-satoshi text-[11px] font-semibold text-white/30 tracking-widest uppercase">Community</span>
                                                <span className="text-white/15 select-none">·</span>
                                                {isSourceLoading ? (
                                                    <svg className="w-3 h-3 text-white/15 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                    </svg>
                                                ) : (
                                                    <a href={flatSource.github_url} target="_blank" rel="noopener noreferrer"
                                                        className="font-satoshi text-[11px] font-semibold text-violet-400/60 hover:text-violet-300 transition-colors tracking-widest uppercase">
                                                        {flatSource.label}
                                                    </a>
                                                )}
                                            </div>
                                            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
                                        </div>
                                    )}
                                    {isSourceLoading ? (
                                        Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={`sk-${flatSource.label}-${i}`} />)
                                    ) : (
                                        <>
                                            {displaySkills.map((skill) => (
                                                <FeaturedSkillCard
                                                    key={`${skill.repo}:${skill.path}`}
                                                    skill={skill}
                                                    onClick={setSelectedSkill}
                                                    onDownload={handleDownload}
                                                    isDownloading={downloadingId === `${skill.repo}:${skill.path}`}
                                                />
                                            ))}
                                            {hasMore && (
                                                <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex justify-center py-1">
                                                    <button
                                                        onClick={() => setExpandedSources(prev => new Set([...prev, flatSource.label]))}
                                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-violet-500/20 bg-violet-500/[0.05] text-violet-300/70 hover:text-violet-200 hover:border-violet-500/35 hover:bg-violet-500/10 font-satoshi text-sm font-medium transition-all duration-300"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                        See all {sourceSkills.length} from {flatSource.label}
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400">
                                                            +{sourceSkills.length - INITIAL_PER_SOURCE} more
                                                        </span>
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </Fragment>
                            )
                        })}

                        {/* ── Discovered Skills (from GitHub crawler) ── */}
                        {(indexedLoading || filteredIndexed.length > 0) && (
                            <>
                                {/* Section divider */}
                                <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex items-center gap-4 py-2">
                                    <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                                    <div className="flex items-center gap-2 shrink-0">
                                        <svg className="w-5 h-5 text-amber-400/60" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                                        </svg>
                                        <span className="font-satoshi text-[11px] font-semibold text-white/20 tracking-widest uppercase">Discovered on GitHub</span>
                                        <span className="text-amber-500/20 select-none">·</span>
                                        {indexedLoading && indexedSkills.length === 0 ? (
                                            <svg className="w-3 h-3 text-white/15 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                        ) : (
                                            <span className="font-satoshi text-[11px] font-semibold text-white/20 tracking-widest uppercase">
                                                {indexedTotal.toLocaleString()} skills
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                                </div>
                                {/* Cards */}
                                {(indexedLoading || isSearchPending) && indexedSkills.length === 0 ? (
                                    Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`sk-indexed-${i}`} />)
                                ) : (() => {
                                    const isExpanded = expandedSources.has('Discovered')
                                    const showLimit = activeFilter === 'All' && !isExpanded && !q
                                    const displaySkills = showLimit ? filteredIndexed.slice(0, INITIAL_PER_SOURCE) : filteredIndexed
                                    const hasMoreInitial = showLimit && filteredIndexed.length > INITIAL_PER_SOURCE
                                    const hasMorePaged = !showLimit && indexedHasMore
                                    // Show a subtle loading overlay when search is in-flight
                                    // but we still have stale results to display (avoids blank screen)
                                    const showSearchingOverlay = (indexedLoading || isSearchPending) && indexedSkills.length > 0

                                    return (
                                        <>
                                            {showSearchingOverlay ? (
                                                <div className="col-span-1 sm:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`sk-search-${i}`} />)}
                                                </div>
                                            ) : (
                                                <>
                                                    {displaySkills.map((skill) => (
                                                        <FeaturedSkillCard
                                                            key={`indexed:${skill.repo}:${skill.path}`}
                                                            skill={skill}
                                                            onClick={setSelectedSkill}
                                                            onDownload={handleDownload}
                                                            isDownloading={downloadingId === `${skill.repo}:${skill.path}`}
                                                        />
                                                    ))}
                                                </>
                                            )}
                                            {hasMoreInitial && (
                                                <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex justify-center py-1">
                                                    <button
                                                        onClick={() => setExpandedSources(prev => new Set([...prev, 'Discovered']))}
                                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] text-amber-300/70 hover:text-amber-200 hover:border-amber-500/35 hover:bg-amber-500/10 font-satoshi text-sm font-medium transition-all duration-300"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                        See all Discovered skills
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                                                            {indexedTotal.toLocaleString()} total
                                                        </span>
                                                    </button>
                                                </div>
                                            )}
                                            {hasMorePaged && (
                                                <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex justify-center pt-2 pb-1">
                                                    <button
                                                        onClick={() => setIndexedPage(p => p + 1)}
                                                        disabled={indexedLoading}
                                                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] text-amber-300/70 hover:text-amber-200 hover:border-amber-500/35 hover:bg-amber-500/10 font-satoshi text-sm font-medium transition-all duration-300 disabled:opacity-50"
                                                    >
                                                        {indexedLoading ? (
                                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        )}
                                                        Load more Discovered skills
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                                                            {(indexedTotal - indexedSkills.length).toLocaleString()} remaining
                                                        </span>
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )
                                })()}
                            </>
                        )}

                        {/* OpenClaw — skeleton while loading, then paginated (or 6 in All mode) */}
                        {(sourceData.OpenClaw?.loading || filteredOpenClaw.length > 0) && (
                            <>
                                {(filteredOfficial.length > 0 || filteredCommunity.length > 0 ||
                                    FEATURED_SOURCES.some(s => !sourceData[s.company]?.loading) ||
                                    COMMUNITY_FLAT_SOURCES.some(s => !sourceData[s.label]?.loading)) && (
                                    <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex items-center gap-4 py-2">
                                        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
                                        <div className="flex items-center gap-2 shrink-0">
                                            <img
                                                src="https://avatars.githubusercontent.com/openclaw"
                                                alt="OpenClaw"
                                                loading="lazy"
                                                width={20}
                                                height={20}
                                                className="w-5 h-5 rounded-full border border-violet-500/30"
                                            />
                                            <span className="font-satoshi text-[11px] font-semibold text-white/30 tracking-widest uppercase">Community</span>
                                            <span className="text-white/15 select-none">·</span>
                                            {sourceData.OpenClaw?.loading ? (
                                                <svg className="w-3 h-3 text-white/15 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                            ) : (
                                                <a
                                                    href={OPENCLAW_SOURCE.github_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-satoshi text-[11px] font-semibold text-violet-400/60 hover:text-violet-300 transition-colors tracking-widest uppercase"
                                                >
                                                    OpenClaw
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
                                    </div>
                                )}
                                {sourceData.OpenClaw?.loading ? (
                                    Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={`sk-openclaw-${i}`} />)
                                ) : (() => {
                                    const isExpanded = expandedSources.has('OpenClaw')
                                    const showLimit = activeFilter === 'All' && !isExpanded && !q
                                    const pagedSkills = showLimit
                                        ? filteredOpenClaw.slice(0, INITIAL_PER_SOURCE)
                                        : filteredOpenClaw.slice(0, ocPage * OC_PAGE_SIZE)
                                    const hasMoreInitial = showLimit && filteredOpenClaw.length > INITIAL_PER_SOURCE
                                    const hasMorePaged = !showLimit && filteredOpenClaw.length > ocPage * OC_PAGE_SIZE

                                    return (
                                        <>
                                            {pagedSkills.map((skill) => (
                                                <FeaturedSkillCard
                                                    key={`${skill.repo}:${skill.path}`}
                                                    skill={skill}
                                                    onClick={setSelectedSkill}
                                                    onDownload={handleDownload}
                                                    isDownloading={downloadingId === `${skill.repo}:${skill.path}`}
                                                />
                                            ))}
                                            {hasMoreInitial && (
                                                <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex justify-center pt-2 pb-1">
                                                    <button
                                                        onClick={() => setExpandedSources(prev => new Set([...prev, 'OpenClaw']))}
                                                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-violet-500/20 bg-violet-500/[0.05] text-violet-300/70 hover:text-violet-200 hover:border-violet-500/35 hover:bg-violet-500/10 font-satoshi text-sm font-medium transition-all duration-300"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                        See all from OpenClaw
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400">
                                                            {filteredOpenClaw.length.toLocaleString()} skills
                                                        </span>
                                                    </button>
                                                </div>
                                            )}
                                            {hasMorePaged && (
                                                <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex justify-center pt-2 pb-1">
                                                    <button
                                                        onClick={() => setOcPage((p) => p + 1)}
                                                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-violet-500/20 bg-violet-500/[0.05] text-violet-300/70 hover:text-violet-200 hover:border-violet-500/35 hover:bg-violet-500/10 font-satoshi text-sm font-medium transition-all duration-300"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                        Load more from OpenClaw
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400">
                                                            {filteredOpenClaw.length - ocPage * OC_PAGE_SIZE} remaining
                                                        </span>
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )
                                })()}
                            </>
                        )}
                    </div>
                )}

                {/* ── Empty state ─────────────────────────────────────────── */}
{!loading &&
  !dbLoading &&
  !indexedLoading &&
  !isSearchPending &&
  filteredOfficial.length === 0 &&
  filteredCommunity.length === 0 &&
  filteredOpenClaw.length === 0 &&
  filteredDbSkills.length === 0 &&
  filteredIndexed.length === 0 && (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      
      <div className="w-20 h-20 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-lg">
        <svg
          className="w-10 h-10 text-accent/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      </div>

      <h2 className="font-clash font-semibold text-white text-2xl">
        No matching skills found
      </h2>

      <p className="font-satoshi text-sm text-white/50 max-w-md mx-auto">
  We couldn't find any matching skills. Try a different keyword or reset your search to explore more skills.
</p>

      {searchQuery && (
        <button
          onClick={() => setSearchQuery("")}
          className="mt-2 px-5 py-2 rounded-xl bg-accent text-black font-medium hover:scale-105 transition-all duration-300"
        >
          Clear Search
        </button>
      )}
    </div>
)}
            </div>

            {/* ── GitHub Skill Detail Modal ────────── */}
            {selectedSkill && (
                <SkillModal
                    skill={selectedSkill}
                    onClose={() => setSelectedSkill(null)}
                    authUser={authUser}
                    authProfile={authProfile}
                />
            )}

            {/* ── DB Community Skill Modal ────────── */}
            {selectedDbSkill && (
                <UserSkillModal
                    skill={selectedDbSkill}
                    onClose={() => setSelectedDbSkill(null)}
                    isOwner={authUser?.$id === selectedDbSkill.user_id || authProfile?.user_id === selectedDbSkill.user_id}
                    onDelete={authUser?.$id === selectedDbSkill.user_id || authProfile?.user_id === selectedDbSkill.user_id ? async () => { setSelectedDbSkill(null) } : undefined}
                    onTogglePrivate={undefined}
                />
            )}
        </div>
    )
}
