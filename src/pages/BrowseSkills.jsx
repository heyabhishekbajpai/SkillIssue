import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import JSZip from 'jszip'
import { Search, X, Download, MessageSquare, Star, Copy, Users, ChevronDown, AlertCircle, SearchX } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useDebounce } from '../hooks/useDebounce'
import SEO, { jsonLdSchemas } from '../components/SEO'
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
import ModalShell from '../components/ModalShell'
import SkillViewer from '../components/SkillViewer'
import SkillActionBar from '../components/SkillActionBar'
import CommentPanel, { StandaloneCommentDrawer } from '../components/CommentPanel'
import { useComments } from '../hooks/useComments'
import { Avatar, Blankslate, CategoryDot, Spinner, formatCount, timeAgo } from '../components/ui/primitives'

// ── Skeleton row ────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <div className="box-row flex gap-3 py-4">
            <div className="skeleton-line h-5 w-5" />
            <div className="flex-1 space-y-2">
                <div className="skeleton-line h-4 w-1/3" />
                <div className="skeleton-line h-3 w-2/3" />
                <div className="skeleton-line h-3 w-1/4" />
            </div>
        </div>
    )
}

// ── GitHub skill detail modal ───────────────────────────────────────────
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
    const owner = isOpenClaw ? skill.author : skill.company

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
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-canvas-subtle px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                        src={isOpenClaw ? `https://avatars.githubusercontent.com/${skill.author}` : isIndexed ? (skill.ownerAvatar || `https://avatars.githubusercontent.com/${skill.company}`) : getOrgAvatarUrl(skill.repo)}
                        name={owner}
                        size={24}
                        square={!isOpenClaw}
                    />
                    <div className="min-w-0">
                        <h2 id={titleId} className="truncate font-sans text-base">
                            <span className="text-accent">{owner}</span>
                            <span className="text-fg-muted"> / </span>
                            <span className="font-semibold">{skill.displayName}</span>
                        </h2>
                        <p className="truncate text-xs text-fg-muted">
                            {isOpenClaw ? skill.attributionLabel : `${skill.repo} · ${(skill.stars || 0).toLocaleString()} stars`}
                        </p>
                    </div>
                </div>
                <button type="button" onClick={onClose} aria-label="Close skill modal" className="btn-invisible btn-icon shrink-0">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
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
                    className="shrink-0 border-t border-line bg-canvas-subtle px-4 py-3"
                    actions={[
                        { key: 'copy', icon: 'copy', label: copied ? 'Copied' : 'Copy', ariaLabel: 'Copy skill markdown', onClick: handleCopy, status: copied ? 'success' : undefined },
                        { key: 'share', icon: 'share', label: linkCopied ? 'Link copied' : 'Share', ariaLabel: 'Share skill link', onClick: handleShare, status: linkCopied ? 'success' : undefined },
                        { key: 'download', icon: 'download', label: downloading ? 'Zipping…' : 'Download .zip', ariaLabel: 'Download skill as zip', onClick: handleDownload, loading: downloading, primary: true },
                        { key: 'comments', icon: 'comments', label: 'Comments', ariaLabel: 'View comments', onClick: () => setCommentsOpen((o) => !o), active: commentsOpen },
                    ]}
                    secondaryActions={[
                        { key: 'github', icon: 'github', label: 'View on GitHub', ariaLabel: 'Open skill on GitHub', href: skill.htmlUrl || skill.attributionUrl },
                        { key: 'save', icon: 'save', label: isGuest ? 'Sign in to save' : saved ? 'Saved' : saveError ? 'Already saved' : 'Save', ariaLabel: isGuest ? 'Sign in to save skill' : 'Save skill', onClick: isGuest ? openAuthModal : handleSave, loading: saving, status: saved ? 'success' : undefined, active: saved },
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

// ── Community (Appwrite) skill row ──────────────────────────────────────
function DbSkillCard({ skill, uploaderProfile, onClick }) {
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

    async function handleDownloadZip() {
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
    const tags = Array.isArray(skill.tags) ? skill.tags : []

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onClick(skill)}
            onKeyDown={(e) => { if (e.key === 'Enter') onClick(skill) }}
            className="box-row box-row-hover flex cursor-pointer gap-3 py-4"
        >
            <Avatar src={uploaderProfile?.avatar_url} name={uploaderProfile?.display_name || username} size={20} className="mt-0.5" />
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="min-w-0 truncate font-sans text-[15px] leading-6">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); navigate(`/user/${username}`) }}
                            className="text-accent hover:underline"
                        >
                            {username}
                        </button>
                        <span className="text-fg-muted"> / </span>
                        <span className="font-semibold text-accent hover:underline">{title}</span>
                    </h3>
                    <span className="label label-accent"><Users className="h-3 w-3" />Skill Issue</span>
                </div>
                {description && <p className="mt-1 line-clamp-2 text-sm text-fg-muted">{description}</p>}
                {tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {tags.slice(0, 5).map((t) => <span key={t} className="topic">{t}</span>)}
                    </div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted">
                    <CategoryDot category={category} />
                    <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" />{formatCount(star_count)}</span>
                    <span className="inline-flex items-center gap-1"><Copy className="h-3.5 w-3.5" />{formatCount(copy_count)}</span>
                    {($createdAt || created_at) && <span>Updated {timeAgo($createdAt || created_at)}</span>}
                    <span className="ml-auto flex items-center gap-1 sm:hidden" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => setCommentsOpen(true)} className="-my-2 inline-flex min-h-[36px] items-center gap-1 rounded-md px-2 font-medium text-accent" aria-label="Comments"><MessageSquare className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => { if (!user) { openAuthModal(); return } handleDownloadZip() }} disabled={downloading} className="-my-2 inline-flex min-h-[36px] items-center gap-1 rounded-md px-2 font-medium text-accent">{downloading ? <Spinner size={12} /> : <Download className="h-3.5 w-3.5" />}.zip</button>
                    </span>
                </div>
            </div>
            <div className="hidden shrink-0 items-start gap-1 sm:flex" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    onClick={() => setCommentsOpen(true)}
                    className={`btn btn-sm btn-icon ${commentsOpen ? 'bg-neutral-subtle' : ''}`}
                    title="Comments"
                    aria-label="Comments"
                >
                    <MessageSquare className="h-3.5 w-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => { if (!user) { openAuthModal(); return } handleDownloadZip() }}
                    disabled={downloading}
                    className="btn btn-sm"
                    title="Download .zip"
                >
                    {downloading ? <Spinner size={14} /> : <Download className="h-3.5 w-3.5" />}
                    <span className="hidden sm:inline">.zip</span>
                </button>
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

// ── Result group (bordered box with a header) ───────────────────────────
function ResultGroup({ title, avatar, avatarRound, count, loading, href, children, footer }) {
    return (
        <section className="box overflow-hidden">
            <header className="box-header py-2.5">
                {avatar && <img src={avatar} alt="" width={20} height={20} loading="lazy" className={`h-5 w-5 ${avatarRound ? 'rounded-full' : 'rounded'} ring-1 ring-line-muted`} />}
                {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold hover:text-accent hover:underline">{title}</a>
                ) : (
                    <h2 className="font-sans text-sm font-semibold">{title}</h2>
                )}
                <span className="ml-auto">
                    {loading ? <Spinner size={14} /> : count != null && <span className="counter">{typeof count === 'number' ? count.toLocaleString() : count}</span>}
                </span>
            </header>
            {children}
            {footer && <div className="border-t border-line-muted bg-canvas-subtle px-4 py-2 text-center">{footer}</div>}
        </section>
    )
}

// ── Main page ───────────────────────────────────────────────────────────
export default function BrowseSkills() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const { user: authUser, profile: authProfile, openAuthModal } = useAuth()

    // Per-source state: { [key]: { skills, loading, error } }
    // Keys: company name for official (Anthropic etc), 'OpenClaw', label for community flat
    const [sourceData, setSourceData] = useState(() => {
        const d = {}
        FEATURED_SOURCES.forEach((s) => { d[s.company] = { skills: [], loading: true, error: null } })
        d.OpenClaw = { skills: [], loading: true, error: null }
        COMMUNITY_FLAT_SOURCES.forEach((s) => { d[s.label] = { skills: [], loading: true, error: null } })
        return d
    })
    // "See all" expansion per source (collapses to INITIAL_PER_SOURCE in All mode)
    const [expandedSources, setExpandedSources] = useState(new Set())
    const INITIAL_PER_SOURCE = 6

    const SKILL_ISSUE_FILTER = 'Skill Issue'
    const DISCOVERED_FILTER = 'Discovered'

    const [activeFilter, setActiveFilter] = useState(() => {
        const src = searchParams.get('source')
        if (src === 'github') return DISCOVERED_FILTER
        if (src === 'community') return SKILL_ISSUE_FILTER
        return searchParams.get('filter') || 'All'
    })
    const [selectedSkill, setSelectedSkill] = useState(null)
    const [downloadingId, setDownloadingId] = useState(null)
    const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '')
    const OC_PAGE_SIZE = 48
    const [ocPage, setOcPage] = useState(1)

    const debouncedSearch = useDebounce(searchQuery, 300)
    const isSearchPending = searchQuery !== debouncedSearch

    // Community (Appwrite) skills
    const [dbSkills, setDbSkills] = useState([])
    const [dbProfiles, setDbProfiles] = useState({}) // user_id → profile
    const [dbLoading, setDbLoading] = useState(true)
    const [dbSort, setDbSort] = useState('recent')
    const [selectedDbSkill, setSelectedDbSkill] = useState(null)

    // Indexed skills (GitHub crawler) — page-based pagination
    const [indexedSkills, setIndexedSkills] = useState([])
    const [indexedTotal, setIndexedTotal] = useState(0)
    const [indexedLoading, setIndexedLoading] = useState(true)
    const [indexedHasMore, setIndexedHasMore] = useState(true)
    const [indexedPage, setIndexedPage] = useState(1)
    const prevIndexedSearchRef = useRef(debouncedSearch)
    const INDEXED_PAGE_SIZE = 48

    // Header search navigates here with ?q= — keep local state in sync
    const urlQ = searchParams.get('q') || ''
    const lastUrlQ = useRef(urlQ)
    useEffect(() => {
        if (urlQ !== lastUrlQ.current) {
            lastUrlQ.current = urlQ
            setSearchQuery(urlQ)
        }
    }, [urlQ])

    // Reflect the debounced search + filter in the URL (shareable, back-button friendly)
    useEffect(() => {
        const next = new URLSearchParams(searchParams)
        if (debouncedSearch.trim()) next.set('q', debouncedSearch.trim()); else next.delete('q')
        if (activeFilter !== 'All') next.set('filter', activeFilter); else next.delete('filter')
        next.delete('source')
        if (next.toString() !== searchParams.toString()) {
            lastUrlQ.current = next.get('q') || ''
            setSearchParams(next, { replace: true })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, activeFilter])

    // Backward-compat: redirect old /browse?repo=...&path=... share links
    useEffect(() => {
        const repo = searchParams.get('repo')
        const path = searchParams.get('path')
        if (repo && path) {
            navigate(`/skill/github?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}`, { replace: true })
        }
    }, [searchParams, navigate])

    // Fetch GitHub featured skills — each source resolves independently
    useEffect(() => {
        function resolveSource(key, skills) {
            setSourceData((prev) => ({ ...prev, [key]: { skills, loading: false, error: null } }))
        }
        function rejectSource(key, err) {
            console.error(`[Browse] ${key} failed:`, err.message)
            setSourceData((prev) => ({ ...prev, [key]: { skills: [], loading: false, error: err.message } }))
        }

        FEATURED_SOURCES.forEach((source) => {
            Promise.all([fetchSkillFolders(source), fetchRepoStars(source.repo)])
                .then(([folders, stars]) => resolveSource(source.company, folders.map((f) => ({ ...f, stars }))))
                .catch((err) => rejectSource(source.company, err))
        })

        Promise.all([fetchOpenClawSkills(OPENCLAW_SOURCE), fetchRepoStars(OPENCLAW_SOURCE.repo)])
            .then(([skills, stars]) => resolveSource('OpenClaw', skills.map((s) => ({ ...s, stars }))))
            .catch((err) => rejectSource('OpenClaw', err))

        COMMUNITY_FLAT_SOURCES.forEach((source) => {
            fetchCommunityFlatSkills(source)
                .then((skills) => resolveSource(source.label, skills))
                .catch((err) => rejectSource(source.label, err))
        })
    }, [])

    const officialSkills = FEATURED_SOURCES.flatMap((s) => sourceData[s.company]?.skills ?? [])
    const openClawSkills = sourceData.OpenClaw?.skills ?? []
    const communitySkills = COMMUNITY_FLAT_SOURCES.flatMap((s) => sourceData[s.label]?.skills ?? [])
    const loading = Object.values(sourceData).some((d) => d.loading)
    const errors = Object.entries(sourceData)
        .filter(([, d]) => d.error)
        .map(([company, d]) => ({ company, error: d.error }))

    // Fetch community skills + uploader profiles
    useEffect(() => {
        setDbLoading(true)
        getAllPublicSkills(dbSort, 100, debouncedSearch)
            .then(async (skills) => {
                setDbSkills(skills)
                const userIds = skills.map((s) => s.user_id).filter(Boolean)
                const profiles = await getProfilesByUserIds(userIds)
                setDbProfiles(profiles)
            })
            .catch(console.error)
            .finally(() => setDbLoading(false))
    }, [dbSort, debouncedSearch])

    // Fetch indexed skills — first page, search resets, and load-more
    useEffect(() => {
        if (prevIndexedSearchRef.current !== debouncedSearch) {
            prevIndexedSearchRef.current = debouncedSearch
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
            .then((data) => {
                const shaped = data.skills.map(toFeaturedSkillShape)
                if (indexedPage === 1) setIndexedSkills(shaped)
                else setIndexedSkills((prev) => [...prev, ...shaped])
                setIndexedTotal(data.total)
                setIndexedHasMore(data.hasMore)
            })
            .catch((err) => console.error('[Browse] Indexed skills fetch failed:', err))
            .finally(() => setIndexedLoading(false))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [indexedPage, debouncedSearch])

    useEffect(() => { setOcPage(1) }, [searchQuery, activeFilter])
    useEffect(() => {
        setIndexedHasMore(true)
        setIndexedPage(1)
    }, [activeFilter])

    const communityFilterIds = ['OpenClaw', ...COMMUNITY_FLAT_SOURCES.map((s) => s.label)]
    const isCommunityFilter = communityFilterIds.includes(activeFilter)
    const isSkillIssueFilter = activeFilter === SKILL_ISSUE_FILTER
    const isDiscoveredFilter = activeFilter === DISCOVERED_FILTER

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

    // Server already filters indexed skills by search; only filter by tab here
    const filteredIndexed = indexedSkills.filter(() => isDiscoveredFilter || activeFilter === 'All')

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
    }, [authUser, openAuthModal])

    // ── Sidebar filter definitions ──────────────────────────────────────
    const filterGroups = [
        {
            label: null,
            items: [
                { id: 'All', label: 'All skills', count: totalCount + dbSkills.length },
                { id: SKILL_ISSUE_FILTER, label: 'Skill Issue community', avatar: '/favicon.png', round: true, count: dbSkills.length },
                { id: DISCOVERED_FILTER, label: 'Discovered on GitHub', count: indexedTotal },
            ],
        },
        {
            label: 'Official',
            items: FEATURED_SOURCES.map((s) => ({
                id: s.company,
                label: s.company,
                avatar: getOrgAvatarUrl(s.repo),
                count: sourceData[s.company]?.loading ? null : officialSkills.filter((x) => x.company === s.company).length,
            })),
        },
        {
            label: 'Community collections',
            items: [
                { id: 'OpenClaw', label: 'OpenClaw', avatar: 'https://avatars.githubusercontent.com/openclaw', round: true, count: sourceData.OpenClaw?.loading ? null : openClawSkills.length },
                ...COMMUNITY_FLAT_SOURCES.map((s) => ({
                    id: s.label,
                    label: s.label,
                    avatar: `https://avatars.githubusercontent.com/${s.company}`,
                    round: true,
                    count: sourceData[s.label]?.loading ? null : communitySkills.filter((x) => x.label === s.label).length,
                })),
            ],
        },
    ]
    const allFilterItems = filterGroups.flatMap((g) => g.items)

    const nothingFound = !loading && !dbLoading && !indexedLoading && !isSearchPending &&
        filteredOfficial.length === 0 && filteredCommunity.length === 0 && filteredOpenClaw.length === 0 &&
        filteredDbSkills.length === 0 && filteredIndexed.length === 0

    const showMore = (key, label) => (
        <button type="button" onClick={() => setExpandedSources((prev) => new Set([...prev, key]))} className="link inline-flex items-center gap-1 text-sm">
            <ChevronDown className="h-4 w-4" />{label}
        </button>
    )

    return (
        <div className="container-page py-4 md:py-6">
            <SEO
                title="Explore AI Skills — Skill Files for Claude, ChatGPT, Gemini & Cursor"
                description="Search AI skill files from leading companies, GitHub and the Skill Issue community. Find skills for coding, writing, design, marketing and more."
                path="/browse"
                jsonLd={jsonLdSchemas.breadcrumb([
                    { name: 'Home', url: '/' },
                    { name: 'Browse Skills', url: '/browse' },
                ])}
            />

            <div className="grid gap-4 md:grid-cols-[256px_minmax(0,1fr)] md:gap-6">
                {/* ── Sidebar ─────────────────────────────── */}
                <aside className="hidden md:sticky md:top-20 md:block md:self-start">
                    <h2 className="mb-2 hidden font-sans text-sm font-semibold md:block">Filter by</h2>


                    <nav aria-label="Filter skills" className="hidden md:block">
                        {filterGroups.map((group, gi) => (
                            <div key={gi} className={gi > 0 ? 'mt-3 border-t border-line-muted pt-3' : ''}>
                                {group.label && <p className="mb-1 px-2 text-xs font-semibold text-fg-muted">{group.label}</p>}
                                <ul className="space-y-0.5">
                                    {group.items.map((it) => {
                                        const active = activeFilter === it.id
                                        return (
                                            <li key={it.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveFilter(it.id)}
                                                    aria-current={active ? 'true' : undefined}
                                                    className={`relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-neutral-subtle ${active ? 'bg-neutral-subtle font-semibold text-fg' : 'text-fg'}`}
                                                >
                                                    {active && <span className="absolute -left-2 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-accent-emphasis" />}
                                                    {it.avatar
                                                        ? <img src={it.avatar} alt="" width={16} height={16} loading="lazy" className={`h-4 w-4 ${it.round ? 'rounded-full' : 'rounded'}`} />
                                                        : <span className="h-4 w-4" />}
                                                    <span className="min-w-0 flex-1 truncate">{it.label}</span>
                                                    {it.count == null ? <Spinner size={12} /> : <span className="counter">{formatCount(it.count)}</span>}
                                                </button>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* ── Results ─────────────────────────────── */}
                <div className="min-w-0">
                    <form role="search" onSubmit={(e) => e.preventDefault()} className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search skills"
                            aria-label="Search skills"
                            className="input input-lg pl-9 pr-9"
                        />
                        {searchQuery && (
                            <button type="button" onClick={() => setSearchQuery('')} className="btn-invisible btn-icon btn-sm absolute right-1.5 top-1/2 -translate-y-1/2" aria-label="Clear search">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </form>

                    {/* Phones: swipeable filter chips */}
                    <div className="-mx-4 mt-3 md:hidden" role="group" aria-label="Filter by source">
                        <div className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
                            {allFilterItems.map((it) => {
                                const active = activeFilter === it.id
                                return (
                                    <button
                                        key={it.id}
                                        type="button"
                                        onClick={() => setActiveFilter(it.id)}
                                        aria-pressed={active}
                                        className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors ${active ? 'border-fg bg-fg text-canvas' : 'border-line bg-canvas text-fg'}`}
                                    >
                                        {it.avatar && <img src={it.avatar} alt="" width={16} height={16} loading="lazy" className={`h-4 w-4 ${it.round ? 'rounded-full' : 'rounded'}`} />}
                                        {it.id === 'All' ? 'All' : it.id === SKILL_ISSUE_FILTER ? 'Community' : it.id === DISCOVERED_FILTER ? 'GitHub' : it.label}
                                        {it.count != null && <span className={`text-xs ${active ? 'text-canvas/80' : 'text-fg-muted'}`}>{formatCount(it.count)}</span>}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 md:mt-4">
                        <h1 className="font-sans text-base font-semibold">
                            {isSearchPending || (loading && dbLoading)
                                ? <span className="inline-flex items-center gap-2 text-fg-muted"><Spinner size={14} />Searching…</span>
                                : <>
                                    {(filteredDbSkills.length + filteredOfficial.length + filteredCommunity.length + filteredOpenClaw.length +
                                        (isDiscoveredFilter || activeFilter === 'All' ? indexedTotal : 0)).toLocaleString()} results
                                    {q && <span className="font-normal text-fg-muted"> for “{debouncedSearch.trim()}”</span>}
                                </>}
                        </h1>
                        {(isSkillIssueFilter || activeFilter === 'All') && (
                            <label className="flex items-center gap-2 text-sm text-fg-muted">
                                <span className="hidden sm:inline">Sort community by</span><span className="sm:hidden">Sort</span>
                                <select value={dbSort} onChange={(e) => setDbSort(e.target.value)} className="input h-9 w-auto py-0 text-sm md:h-8">
                                    <option value="recent">Recently added</option>
                                    <option value="most-rated">Most stars</option>
                                    <option value="most-copied">Most copied</option>
                                </select>
                            </label>
                        )}
                    </div>

                    {errors.length > 0 && (
                        <div className="flash flash-warn mt-4 flex items-start gap-2">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-attention" />
                            <div>
                                Some sources could not be loaded right now:{' '}
                                {errors.map((e) => e.company).join(', ')}. Showing everything else.
                            </div>
                        </div>
                    )}

                    <div className="mt-4 space-y-4">
                        {/* Skill Issue community */}
                        {(isSkillIssueFilter || activeFilter === 'All') && (dbLoading || filteredDbSkills.length > 0) && (() => {
                            const isExpanded = expandedSources.has('db') || isSkillIssueFilter || !!q
                            const list = isExpanded ? filteredDbSkills : filteredDbSkills.slice(0, INITIAL_PER_SOURCE)
                            return (
                                <ResultGroup
                                    title="Skill Issue community"
                                    avatar="/favicon.png"
                                    avatarRound
                                    count={filteredDbSkills.length}
                                    loading={dbLoading}
                                    footer={!isExpanded && filteredDbSkills.length > INITIAL_PER_SOURCE && showMore('db', `Show all ${filteredDbSkills.length} community skills`)}
                                >
                                    {dbLoading && filteredDbSkills.length === 0
                                        ? [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
                                        : list.map((skill) => (
                                            <DbSkillCard key={skill.id} skill={skill} uploaderProfile={dbProfiles[skill.user_id]} onClick={setSelectedDbSkill} />
                                        ))}
                                </ResultGroup>
                            )
                        })()}

                        {/* Official sources */}
                        {FEATURED_SOURCES.map((source) => {
                            const srcData = sourceData[source.company]
                            const isSourceLoading = srcData?.loading ?? false
                            const companySkills = filteredOfficial.filter((s) => s.company === source.company)
                            const isExpanded = expandedSources.has(source.company)
                            const showLimit = activeFilter === 'All' && !isExpanded && !q
                            const displaySkills = showLimit ? companySkills.slice(0, INITIAL_PER_SOURCE) : companySkills
                            const hasMore = showLimit && companySkills.length > INITIAL_PER_SOURCE
                            if (isCommunityFilter || isSkillIssueFilter || isDiscoveredFilter) return null
                            if (activeFilter !== 'All' && activeFilter !== source.company) return null
                            if (!isSourceLoading && companySkills.length === 0) return null
                            return (
                                <ResultGroup
                                    key={source.company}
                                    title={source.company}
                                    avatar={getOrgAvatarUrl(source.repo)}
                                    count={companySkills.length}
                                    loading={isSourceLoading}
                                    href={source.github_url || `https://github.com/${source.repo}`}
                                    footer={hasMore && showMore(source.company, `Show all ${companySkills.length} from ${source.company}`)}
                                >
                                    {isSourceLoading
                                        ? [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
                                        : displaySkills.map((skill) => (
                                            <FeaturedSkillCard
                                                key={`${skill.repo}:${skill.path}`}
                                                skill={skill}
                                                onClick={setSelectedSkill}
                                                onDownload={handleDownload}
                                                isDownloading={downloadingId === `${skill.repo}:${skill.path}`}
                                            />
                                        ))}
                                </ResultGroup>
                            )
                        })}

                        {/* Community flat collections (Composio etc.) */}
                        {COMMUNITY_FLAT_SOURCES.map((flatSource) => {
                            const srcData = sourceData[flatSource.label]
                            const isSourceLoading = srcData?.loading ?? false
                            const sourceSkills = filteredCommunity.filter((s) => s.label === flatSource.label)
                            const isExpanded = expandedSources.has(flatSource.label)
                            const showLimit = activeFilter === 'All' && !isExpanded && !q
                            const displaySkills = showLimit ? sourceSkills.slice(0, INITIAL_PER_SOURCE) : sourceSkills
                            const hasMore = showLimit && sourceSkills.length > INITIAL_PER_SOURCE
                            if (isSkillIssueFilter || isDiscoveredFilter) return null
                            if (activeFilter !== 'All' && activeFilter !== flatSource.label) return null
                            if (!isSourceLoading && sourceSkills.length === 0) return null
                            return (
                                <ResultGroup
                                    key={flatSource.label}
                                    title={flatSource.label}
                                    avatar={`https://avatars.githubusercontent.com/${flatSource.company}`}
                                    avatarRound
                                    count={sourceSkills.length}
                                    loading={isSourceLoading}
                                    href={flatSource.github_url}
                                    footer={hasMore && showMore(flatSource.label, `Show all ${sourceSkills.length} from ${flatSource.label}`)}
                                >
                                    {isSourceLoading
                                        ? [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
                                        : displaySkills.map((skill) => (
                                            <FeaturedSkillCard
                                                key={`${skill.repo}:${skill.path}`}
                                                skill={skill}
                                                onClick={setSelectedSkill}
                                                onDownload={handleDownload}
                                                isDownloading={downloadingId === `${skill.repo}:${skill.path}`}
                                            />
                                        ))}
                                </ResultGroup>
                            )
                        })}

                        {/* Discovered on GitHub (crawler index) */}
                        {(isDiscoveredFilter || activeFilter === 'All') && (indexedLoading || filteredIndexed.length > 0) && (() => {
                            const isExpanded = expandedSources.has('Discovered')
                            const showLimit = activeFilter === 'All' && !isExpanded && !q
                            const displaySkills = showLimit ? filteredIndexed.slice(0, INITIAL_PER_SOURCE) : filteredIndexed
                            const hasMoreInitial = showLimit && filteredIndexed.length > INITIAL_PER_SOURCE
                            const hasMorePaged = !showLimit && indexedHasMore
                            const busy = (indexedLoading || isSearchPending)
                            return (
                                <ResultGroup
                                    title="Discovered on GitHub"
                                    count={indexedTotal}
                                    loading={busy && indexedSkills.length === 0}
                                    footer={
                                        hasMoreInitial
                                            ? showMore('Discovered', `Show more discovered skills (${indexedTotal.toLocaleString()} total)`)
                                            : hasMorePaged && (
                                                <button type="button" onClick={() => setIndexedPage((p) => p + 1)} disabled={indexedLoading} className="btn btn-sm">
                                                    {indexedLoading && <Spinner size={14} />}
                                                    Load more · {(indexedTotal - indexedSkills.length).toLocaleString()} remaining
                                                </button>
                                            )
                                    }
                                >
                                    {busy && (indexedSkills.length === 0 || isSearchPending)
                                        ? [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
                                        : displaySkills.map((skill) => (
                                            <FeaturedSkillCard
                                                key={`indexed:${skill.repo}:${skill.path}`}
                                                skill={skill}
                                                onClick={setSelectedSkill}
                                                onDownload={handleDownload}
                                                isDownloading={downloadingId === `${skill.repo}:${skill.path}`}
                                            />
                                        ))}
                                </ResultGroup>
                            )
                        })()}

                        {/* OpenClaw */}
                        {!isSkillIssueFilter && !isDiscoveredFilter && (activeFilter === 'All' || activeFilter === 'OpenClaw') &&
                            (sourceData.OpenClaw?.loading || filteredOpenClaw.length > 0) && (() => {
                            const isExpanded = expandedSources.has('OpenClaw')
                            const showLimit = activeFilter === 'All' && !isExpanded && !q
                            const pagedSkills = showLimit ? filteredOpenClaw.slice(0, INITIAL_PER_SOURCE) : filteredOpenClaw.slice(0, ocPage * OC_PAGE_SIZE)
                            const hasMoreInitial = showLimit && filteredOpenClaw.length > INITIAL_PER_SOURCE
                            const hasMorePaged = !showLimit && filteredOpenClaw.length > ocPage * OC_PAGE_SIZE
                            return (
                                <ResultGroup
                                    title="OpenClaw"
                                    avatar="https://avatars.githubusercontent.com/openclaw"
                                    avatarRound
                                    count={filteredOpenClaw.length}
                                    loading={sourceData.OpenClaw?.loading}
                                    href={OPENCLAW_SOURCE.github_url}
                                    footer={
                                        hasMoreInitial
                                            ? showMore('OpenClaw', `Show all ${filteredOpenClaw.length.toLocaleString()} from OpenClaw`)
                                            : hasMorePaged && (
                                                <button type="button" onClick={() => setOcPage((p) => p + 1)} className="btn btn-sm">
                                                    Load more · {(filteredOpenClaw.length - ocPage * OC_PAGE_SIZE).toLocaleString()} remaining
                                                </button>
                                            )
                                    }
                                >
                                    {sourceData.OpenClaw?.loading
                                        ? [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
                                        : pagedSkills.map((skill) => (
                                            <FeaturedSkillCard
                                                key={`${skill.repo}:${skill.path}`}
                                                skill={skill}
                                                onClick={setSelectedSkill}
                                                onDownload={handleDownload}
                                                isDownloading={downloadingId === `${skill.repo}:${skill.path}`}
                                            />
                                        ))}
                                </ResultGroup>
                            )
                        })()}

                        {nothingFound && (
                            <div className="box">
                                <Blankslate
                                    icon={SearchX}
                                    title="No matching skills"
                                    action={searchQuery && <button type="button" onClick={() => setSearchQuery('')} className="btn">Clear search</button>}
                                >
                                    Try a different keyword, or switch the filter to search every source.
                                </Blankslate>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedSkill && (
                <SkillModal
                    skill={selectedSkill}
                    onClose={() => setSelectedSkill(null)}
                    authUser={authUser}
                    authProfile={authProfile}
                />
            )}

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
