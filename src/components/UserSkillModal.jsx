import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { X, Lock, BookMarked, ExternalLink } from 'lucide-react'
import { useComments } from '../hooks/useComments'
import ConfirmDialog from './ConfirmDialog'
import ModalShell from './ModalShell'
import SkillActionBar from './SkillActionBar'
import SkillViewer from './SkillViewer'
import CommentPanel from './CommentPanel'
import { useAuth } from '../context/AuthContext'
import { toggleSavedSkill } from '../lib/userService'
import { starSkill, unstarSkill } from '../lib/skillService'
import { invalidateProfileCache } from '../lib/profileCache'

import { SITE_URL as SITE } from '../lib/site'

function starKey(userId, skillId) { return `starred:${userId}:${skillId}` }
function getStarred(userId, skillId) { return !!localStorage.getItem(starKey(userId, skillId)) }
function persistStar(userId, skillId, val) {
    val ? localStorage.setItem(starKey(userId, skillId), '1') : localStorage.removeItem(starKey(userId, skillId))
}
function slug(title = 'skill') { return title.toLowerCase().replace(/\s+/g, '-') }

export default function UserSkillModal({ skill, onClose, isOwner = false, onDelete, onTogglePrivate }) {
    const { signIn, user, profile, refreshProfile } = useAuth()
    const [viewerContent, setViewerContent] = useState('')
    const [copied, setCopied] = useState(false)
    const [linkCopied, setLinkCopied] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [working, setWorking] = useState(false)
    const [saving, setSaving] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const [starring, setStarring] = useState(false)
    const [starred, setStarred] = useState(false)
    const [starCount, setStarCount] = useState(0)
    const [commentsOpen, setCommentsOpen] = useState(false)
    const { comments, loadingComments, submitting: commentSubmitting, submitComment, removeComment } = useComments({
        skillId: skill?.id,
        skillType: 'db',
        open: commentsOpen,
        user,
        profile,
    })

    const isGuest = !user
    const isPrivate = skill?.visibility === 'private'
    const titleId = skill ? `user-skill-modal-${skill.id}` : undefined
    const fileName = `${slug(skill?.title)}.md`

    useEffect(() => {
        setShowDeleteConfirm(false)
        setStarCount(skill?.star_count ?? 0)
    }, [skill])

    useEffect(() => {
        if (profile && skill) setIsSaved(!!profile.saved_skills?.includes(skill.id))
        else setIsSaved(false)
    }, [profile, skill])

    useEffect(() => {
        if (user && skill) setStarred(getStarred(user.$id, skill.id))
        else setStarred(false)
    }, [user, skill])

    if (!skill) return null

    function handleCopy() {
        if (isGuest) { signIn(); return }
        const src = viewerContent || skill.content
        if (!src) return
        navigator.clipboard.writeText(src)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
    }

    function handleDownload() {
        if (isGuest) { signIn(); return }
        const blob = new Blob([skill.content || ''], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
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
            window.setTimeout(() => setLinkCopied(false), 2000)
        }
    }

    async function handleDelete() {
        setWorking(true)
        try {
            await onDelete?.(skill.id)
            invalidateProfileCache(profile?.username)
            onClose()
        } finally {
            setWorking(false)
            setShowDeleteConfirm(false)
        }
    }

    async function handleSaveSkill() {
        if (!profile || saving) return
        setSaving(true)
        try {
            const action = isSaved ? 'unsave' : 'save'
            await toggleSavedSkill(profile.id, skill.id, action)
            setIsSaved(!isSaved)
            invalidateProfileCache(profile?.username)
            await refreshProfile()
        } finally {
            setSaving(false)
        }
    }

    async function handleStar() {
        if (!user || starring) return
        setStarring(true)
        try {
            if (starred) {
                const updated = await unstarSkill(skill.id, starCount)
                setStarCount(updated.star_count ?? Math.max(0, starCount - 1))
                setStarred(false)
                persistStar(user.$id, skill.id, false)
            } else {
                const updated = await starSkill(skill.id, starCount)
                setStarCount(updated.star_count ?? starCount + 1)
                setStarred(true)
                persistStar(user.$id, skill.id, true)
            }
        } finally {
            setStarring(false)
        }
    }

    async function handleTogglePrivate() {
        setWorking(true)
        try {
            const next = skill.visibility === 'public' ? 'private' : 'public'
            await onTogglePrivate?.(skill.id, next)
            invalidateProfileCache(profile?.username)
            onClose()
        } finally {
            setWorking(false)
        }
    }

    return (
        <>
            <ModalShell onClose={() => !showDeleteConfirm && onClose()} titleId={titleId} contentClassName="flex flex-col h-full">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-canvas-subtle px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                        {isPrivate ? <Lock className="h-4 w-4 shrink-0 text-fg-muted" /> : <BookMarked className="h-4 w-4 shrink-0 text-fg-muted" />}
                        <div className="min-w-0">
                            <h2 id={titleId} className="truncate font-sans text-base font-semibold">{skill.title}</h2>
                            {skill.category && <p className="text-xs capitalize text-fg-muted">{skill.category}</p>}
                        </div>
                        <span className="label shrink-0">{isPrivate ? 'Private' : 'Public'}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                        {skill.id && (
                            <Link to={`/skill/${skill.id}`} onClick={onClose} className="btn btn-sm hidden sm:inline-flex" title="Open full page">
                                <ExternalLink className="h-3.5 w-3.5" />Open page
                            </Link>
                        )}
                        <button type="button" onClick={onClose} aria-label="Close skill modal" className="btn-invisible btn-icon">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                    <SkillViewer
                        fill
                        rootName={slug(skill.title)}
                        markdownContent={skill.content || ''}
                        locked={isGuest}
                        showTabs={!isGuest}
                        onLockedAction={signIn}
                        onActiveContentChange={setViewerContent}
                    />
                </div>

                <SkillActionBar
                    className="shrink-0 border-t border-line bg-canvas-subtle px-4 py-3"
                    actions={[
                        !isGuest && { key: 'star', icon: 'star', label: String(starCount), ariaLabel: starred ? 'Unstar skill' : 'Star skill', onClick: handleStar, loading: starring, active: starred },
                        { key: 'copy', icon: 'copy', label: copied ? 'Copied' : 'Copy', ariaLabel: 'Copy skill markdown', onClick: handleCopy, status: copied ? 'success' : undefined },
                        { key: 'share', icon: 'share', label: linkCopied ? 'Link copied' : 'Share', ariaLabel: 'Share skill link', onClick: handleShare, status: linkCopied ? 'success' : undefined },
                        { key: 'download', icon: 'download', label: 'Download .md', ariaLabel: 'Download markdown file', onClick: handleDownload, primary: true },
                        { key: 'comments', icon: 'comments', label: 'Comments', ariaLabel: 'View comments', onClick: () => setCommentsOpen(o => !o), active: commentsOpen },
                    ]}
                    secondaryActions={[
                        isGuest && { key: 'signin', icon: 'signin', label: 'Sign in to save', ariaLabel: 'Sign in to save skill', onClick: signIn },
                        !isGuest && !isOwner && { key: 'save', icon: 'save', label: saving ? 'Saving…' : isSaved ? 'Saved' : 'Save', ariaLabel: isSaved ? 'Remove from saved skills' : 'Save skill', onClick: handleSaveSkill, loading: saving, active: isSaved },
                        isOwner && { key: 'visibility', icon: isPrivate ? 'globe' : 'lock', label: isPrivate ? 'Make public' : 'Make private', ariaLabel: isPrivate ? 'Make skill public' : 'Make skill private', onClick: handleTogglePrivate, disabled: working },
                        isOwner && { key: 'delete', icon: 'trash', label: 'Delete', ariaLabel: 'Delete skill', onClick: () => setShowDeleteConfirm(true), disabled: working, className: 'hover:!text-danger' },
                    ]}
                />
                <CommentPanel
                    open={commentsOpen}
                    onClose={() => setCommentsOpen(false)}
                    skillId={skill.id}
                    skillTitle={skill.title}
                    user={user}
                    userProfile={profile}
                    comments={comments}
                    loadingComments={loadingComments}
                    submitting={commentSubmitting}
                    onSubmitComment={submitComment}
                    onDeleteComment={removeComment}
                />
            </ModalShell>

            {showDeleteConfirm && (
                <ConfirmDialog
                    title="Delete skill"
                    message={<><span className="font-semibold text-fg">{skill.title}</span>{' '}will be permanently deleted. This action cannot be undone.</>}
                    confirmLabel="Delete this skill"
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                    working={working}
                />
            )}
        </>
    )
}
