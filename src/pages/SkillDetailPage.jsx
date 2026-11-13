import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
    Star, Copy, Check, Share2, Download, MessageSquare, BookOpen, Bookmark, Lock, Globe,
    Trash2, Tag, Calendar, LogIn, Settings,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getSkillById, deleteSkill, toggleVisibility, starSkill, unstarSkill } from '../lib/skillService'
import { invalidateProfileCache } from '../lib/profileCache'
import { getProfile, toggleSavedSkill } from '../lib/userService'
import { SITE_URL as SITE } from '../lib/site'
import ConfirmDialog from '../components/ConfirmDialog'
import SEO, { jsonLdSchemas } from '../components/SEO'
import SkillViewer from '../components/SkillViewer'
import Toast from '../components/Toast'
import { StandaloneCommentDrawer } from '../components/CommentPanel'
import { useComments } from '../hooks/useComments'
import { SkillRepoHeader, SidebarSection, MetaItem, DetailSkeleton } from '../components/SkillPageLayout'
import { Avatar, Blankslate, CategoryDot, Spinner, formatCount, timeAgo } from '../components/ui/primitives'

function starKey(userId, skillId) { return `starred:${userId}:${skillId}` }
function isStarred(userId, skillId) { return !!localStorage.getItem(starKey(userId, skillId)) }
function setStarred(userId, skillId, val) {
    val ? localStorage.setItem(starKey(userId, skillId), '1') : localStorage.removeItem(starKey(userId, skillId))
}
function slug(title = 'skill') { return title.toLowerCase().replace(/\s+/g, '-') }

export default function SkillDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user: authUser, profile: authProfile, openAuthModal, refreshProfile } = useAuth()

    const [skill, setSkill] = useState(null)
    const [author, setAuthor] = useState(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [viewerContent, setViewerContent] = useState('')
    const [copied, setCopied] = useState(false)
    const [linkCopied, setLinkCopied] = useState(false)
    const [starring, setStarring] = useState(false)
    const [starred, setStarredState] = useState(false)
    const [starCount, setStarCount] = useState(0)
    const [saving, setSaving] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [working, setWorking] = useState(false)
    const [toast, setToast] = useState(null)
    const [commentsOpen, setCommentsOpen] = useState(false)
    const { comments, loadingComments, submitting: commentSubmitting, submitComment, removeComment } = useComments({
        skillId: skill?.id,
        skillType: 'db',
        open: commentsOpen,
        user: authUser,
        profile: authProfile,
    })

    useEffect(() => {
        if (!id) return undefined
        let cancelled = false
        getSkillById(id)
            .then((s) => {
                if (cancelled) return
                setSkill(s)
                setStarCount(s.star_count ?? 0)
                if (s.user_id) getProfile(s.user_id).then((profile) => !cancelled && setAuthor(profile)).catch(() => {})
            })
            .catch(() => !cancelled && setNotFound(true))
            .finally(() => !cancelled && setLoading(false))
        return () => { cancelled = true }
    }, [id])

    useEffect(() => {
        if (authUser && skill) setStarredState(isStarred(authUser.$id, skill.id))
    }, [authUser, skill])

    useEffect(() => {
        if (authProfile && skill) setIsSaved(!!authProfile.saved_skills?.includes(skill.id))
    }, [authProfile, skill])

    const isOwner = !!(authUser && skill && authUser.$id === skill.user_id)
    const isPrivate = skill?.visibility === 'private'
    const isGuest = !authUser

    useEffect(() => {
        if (!loading && skill && isPrivate && !isOwner) setNotFound(true)
    }, [loading, skill, isPrivate, isOwner])

    function showToast(message) {
        setToast(message)
    }

    function handleCopy() {
        if (isGuest) { openAuthModal(); return }
        const src = viewerContent || skill.content
        if (!src) return
        navigator.clipboard.writeText(src)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
    }

    function handleDownload() {
        if (!authUser) { openAuthModal(); return }
        const blob = new Blob([skill.content || ''], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${slug(skill.title)}.md`
        a.click()
        URL.revokeObjectURL(url)
    }

    async function handleShare() {
        const url = `${SITE}/skill/${skill.id}`
        if (navigator.share) {
            try { await navigator.share({ title: skill.title, url }) } catch { /* cancelled */ }
        } else {
            await navigator.clipboard.writeText(url)
            setLinkCopied(true)
            showToast('Link copied to clipboard')
            window.setTimeout(() => setLinkCopied(false), 2000)
        }
    }

    async function handleStar() {
        if (!authUser) { openAuthModal(); return }
        if (starring) return
        setStarring(true)
        try {
            if (starred) {
                const updated = await unstarSkill(skill.id, starCount)
                setStarCount(updated.star_count ?? Math.max(0, starCount - 1))
                setStarredState(false)
                setStarred(authUser.$id, skill.id, false)
            } else {
                const updated = await starSkill(skill.id, starCount)
                setStarCount(updated.star_count ?? starCount + 1)
                setStarredState(true)
                setStarred(authUser.$id, skill.id, true)
            }
        } catch {
            showToast('Failed to update star')
        } finally {
            setStarring(false)
        }
    }

    async function handleSaveSkill() {
        if (!authProfile || saving) return
        setSaving(true)
        try {
            const nextAction = isSaved ? 'unsave' : 'save'
            await toggleSavedSkill(authProfile.id, skill.id, nextAction)
            setIsSaved(!isSaved)
            invalidateProfileCache(authProfile?.username)
            showToast(isSaved ? 'Removed from saved' : 'Saved to your profile')
            await refreshProfile()
        } catch {
            showToast('Failed to update saved skill')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete() {
        setWorking(true)
        try {
            await deleteSkill(skill.id)
            invalidateProfileCache(authProfile?.username)
            navigate(-1)
        } finally {
            setWorking(false)
            setShowDeleteConfirm(false)
        }
    }

    async function handleToggleVisibility() {
        setWorking(true)
        try {
            const next = isPrivate ? 'public' : 'private'
            const updated = await toggleVisibility(skill.id, next)
            setSkill(updated)
            invalidateProfileCache(authProfile?.username)
            showToast(`Skill is now ${next}.`)
        } finally {
            setWorking(false)
        }
    }

    if (loading) return <DetailSkeleton />

    if (notFound || !skill) {
        return (
            <div className="container-page py-16">
                <div className="box mx-auto max-w-xl">
                    <Blankslate icon={Lock} title="Skill not found" action={<Link to="/browse" className="btn-primary">Browse skills</Link>}>
                        This skill doesn’t exist or is private. Only the owner can view private skills.
                    </Blankslate>
                </div>
            </div>
        )
    }

    const authorName = author?.display_name || author?.username || 'Unknown'
    const authorUsername = author?.username
    const tags = Array.isArray(skill.tags) ? skill.tags : typeof skill.tags === 'string' ? skill.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
    const created = skill.$createdAt || skill.created_at

    return (
        <>
            <SEO
                title={skill.title}
                description={skill.description || `${skill.title} - AI skill file on Skill Issue. Copy, save, and use this skill with Claude, ChatGPT, Gemini, Cursor and more.`}
                path={`/skill/${skill.id}`}
                jsonLd={{
                    '@graph': [
                        jsonLdSchemas.skillPage({ ...skill, authorName }),
                        jsonLdSchemas.breadcrumb([
                            { name: 'Home', url: '/' },
                            { name: 'Browse Skills', url: '/browse' },
                            { name: skill.title },
                        ]),
                    ],
                }}
            />

            <SkillRepoHeader
                avatar={author?.avatar_url}
                owner={authorUsername || authorName}
                ownerTo={authorUsername ? `/user/${authorUsername}` : undefined}
                name={skill.title}
                label={isPrivate ? 'Private' : 'Public'}
                actions={
                    <>
                        {!isGuest && !isOwner && (
                            <button type="button" onClick={handleSaveSkill} disabled={saving} className="btn btn-sm" aria-pressed={isSaved}>
                                {saving ? <Spinner size={14} /> : <Bookmark className="h-3.5 w-3.5" fill={isSaved ? 'currentColor' : 'none'} />}
                                {isSaved ? 'Saved' : 'Save'}
                            </button>
                        )}
                        <button type="button" onClick={handleShare} className="btn btn-sm">
                            {linkCopied ? <Check className="h-3.5 w-3.5 !text-success" /> : <Share2 className="h-3.5 w-3.5" />}
                            {linkCopied ? 'Copied' : 'Share'}
                        </button>
                        <div className="inline-flex">
                            <button
                                type="button"
                                onClick={handleStar}
                                disabled={starring}
                                aria-label={starred ? 'Unstar skill' : 'Star skill'}
                                aria-pressed={starred}
                                className="btn btn-sm rounded-r-none"
                            >
                                {starring ? <Spinner size={14} /> : <Star className={`h-3.5 w-3.5 ${starred ? '!text-attention' : ''}`} fill={starred ? 'currentColor' : 'none'} />}
                                {starred ? 'Starred' : 'Star'}
                            </button>
                            <span className="btn btn-sm pointer-events-none -ml-px rounded-l-none px-2 font-semibold">{formatCount(starCount)}</span>
                        </div>
                    </>
                }
                tabs={
                    <nav className="tabnav border-b-0" aria-label="Skill sections">
                        <span className="tabnav-item selected"><BookOpen className="h-4 w-4" />Skill</span>
                        <button type="button" onClick={() => setCommentsOpen(true)} className="tabnav-item">
                            <MessageSquare className="h-4 w-4" />Discussion
                            {comments.length > 0 && <span className="counter">{comments.length}</span>}
                        </button>
                        {isOwner && (
                            <a href="#settings" className="tabnav-item"><Settings className="h-4 w-4" />Settings</a>
                        )}
                    </nav>
                }
            />

            <div className="container-page grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_296px]">
                <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex min-w-0 items-center gap-2 text-sm text-fg-muted">
                            <Avatar src={author?.avatar_url} name={authorName} size={20} />
                            <span className="truncate">
                                <span className="font-semibold text-fg">{authorUsername || authorName}</span>
                                {created && <> published {timeAgo(created)}</>}
                            </span>
                        </span>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={handleCopy} className="btn btn-sm">
                                {copied ? <Check className="h-3.5 w-3.5 !text-success" /> : <Copy className="h-3.5 w-3.5" />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                            <button type="button" onClick={handleDownload} className="btn-primary btn-sm">
                                <Download className="h-3.5 w-3.5" />Download .md
                            </button>
                        </div>
                    </div>

                    {skill.description && <p className="text-[15px] leading-6 text-fg lg:hidden">{skill.description}</p>}
                    <SkillViewer
                        rootName={slug(skill.title)}
                        markdownContent={skill.content || ''}
                        locked={isGuest}
                        showTabs={!isGuest}
                        onLockedAction={openAuthModal}
                        onActiveContentChange={setViewerContent}
                    />

                    {isOwner && (
                        <section id="settings" className="box mt-6 scroll-mt-20 border-danger/40">
                            <header className="box-header bg-transparent">
                                <h2 className="font-sans text-sm font-semibold">Danger zone</h2>
                            </header>
                            <div className="box-row flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-semibold">Change visibility</p>
                                    <p className="text-sm text-fg-muted">This skill is currently {isPrivate ? 'private' : 'public'}.</p>
                                </div>
                                <button type="button" onClick={handleToggleVisibility} disabled={working} className="btn-danger shrink-0">
                                    {isPrivate ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                    {isPrivate ? 'Make public' : 'Make private'}
                                </button>
                            </div>
                            <div className="box-row flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-semibold">Delete this skill</p>
                                    <p className="text-sm text-fg-muted">Once deleted, it cannot be recovered.</p>
                                </div>
                                <button type="button" onClick={() => setShowDeleteConfirm(true)} disabled={working} className="btn-danger shrink-0">
                                    <Trash2 className="h-4 w-4" />Delete this skill
                                </button>
                            </div>
                        </section>
                    )}
                </div>

                <aside className="min-w-0">
                    <SidebarSection title="About">
                        {skill.description
                            ? <p className="hidden text-[15px] leading-6 lg:block">{skill.description}</p>
                            : <p className="hidden text-sm italic text-fg-muted lg:block">No description provided.</p>}
                        {tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                                {tags.map((t) => <Link key={t} to={`/browse?q=${encodeURIComponent(t)}`} className="topic">{t}</Link>)}
                            </div>
                        )}
                        <ul className="space-y-2 lg:mt-4">
                            {skill.category && <li><CategoryDot category={skill.category} className="text-sm" /></li>}
                            <MetaItem icon={Star}><strong className="text-fg">{starCount.toLocaleString()}</strong> stars</MetaItem>
                            <MetaItem icon={Copy}><strong className="text-fg">{(skill.copy_count ?? 0).toLocaleString()}</strong> copies</MetaItem>
                            {created && <MetaItem icon={Calendar}>Published {new Date(created).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</MetaItem>}
                            {tags.length === 0 && skill.category && <MetaItem icon={Tag}>{skill.category}</MetaItem>}
                        </ul>
                    </SidebarSection>

                    <SidebarSection title="Author">
                        {authorUsername ? (
                            <Link to={`/user/${authorUsername}`} className="group flex items-center gap-3">
                                <Avatar src={author?.avatar_url} name={authorName} size={40} />
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold group-hover:text-accent group-hover:underline">{authorName}</span>
                                    <span className="block truncate text-xs text-fg-muted">@{authorUsername}</span>
                                </span>
                            </Link>
                        ) : (
                            <p className="text-sm text-fg-muted">{authorName}</p>
                        )}
                    </SidebarSection>

                    {isGuest && (
                        <SidebarSection>
                            <button type="button" onClick={openAuthModal} className="btn btn-block">
                                <LogIn className="h-4 w-4" />Sign in to save and download
                            </button>
                        </SidebarSection>
                    )}
                </aside>
            </div>

            <Toast message={toast} onDismiss={() => setToast(null)} />

            <StandaloneCommentDrawer
                open={commentsOpen}
                onClose={() => setCommentsOpen(false)}
                skillId={skill.id}
                skillTitle={skill.title}
                user={authUser}
                userProfile={authProfile}
                comments={comments}
                loadingComments={loadingComments}
                submitting={commentSubmitting}
                onSubmitComment={submitComment}
                onDeleteComment={removeComment}
            />

            {showDeleteConfirm && (
                <ConfirmDialog
                    title="Delete skill"
                    message={<><span className="font-semibold text-fg">{skill.title}</span> will be permanently deleted. This cannot be undone.</>}
                    confirmLabel="Delete this skill"
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                    working={working}
                />
            )}
        </>
    )
}
