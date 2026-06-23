import { useEffect, useState } from 'react'
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

const SITE = 'https://www.skillissue.bajpai.tech'

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
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="min-w-0">
                            <h2 id={titleId} className="font-clash font-bold text-lg text-white truncate">{skill.title}</h2>
                            {skill.category && <p className="font-satoshi text-xs text-white/35 capitalize">{skill.category}</p>}
                        </div>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-satoshi font-bold uppercase tracking-wider shrink-0 ${isPrivate ? 'bg-white/[0.05] border-white/10 text-white/30' : 'bg-accent/10 border-accent/20 text-accent'}`}>
                            {isPrivate ? 'Private' : 'Public'}
                        </span>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close skill modal" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors shrink-0 ml-3">
                        <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 min-h-0 p-3 sm:p-6">
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
                    className="px-3 sm:px-6 py-3 sm:py-4 border-t border-white/[0.06] bg-white/[0.02] shrink-0"
                    actions={[
                        !isGuest && { key: 'star', icon: 'save', label: String(starCount), ariaLabel: starred ? 'Unstar skill' : 'Star skill', onClick: handleStar, loading: starring, active: starred },
                        { key: 'copy', icon: 'copy', label: copied ? 'Copied!' : 'Copy', ariaLabel: 'Copy skill markdown', onClick: handleCopy, status: copied ? 'success' : undefined },
                        { key: 'share', icon: 'share', label: linkCopied ? 'Link copied!' : 'Share', ariaLabel: 'Share skill link', onClick: handleShare, status: linkCopied ? 'success' : undefined },
                        { key: 'download', icon: 'download', label: 'Download .md', ariaLabel: 'Download markdown file', onClick: handleDownload, primary: true },
                        { key: 'comments', icon: 'comments', label: 'Comments', ariaLabel: 'View comments', onClick: () => setCommentsOpen(o => !o), active: commentsOpen },
                    ]}
                    secondaryActions={[
                        isGuest && { key: 'signin', icon: 'save', label: 'Sign in to Save', ariaLabel: 'Sign in to save skill', onClick: signIn },
                        !isGuest && !isOwner && { key: 'save', icon: 'save', label: saving ? 'Saving...' : isSaved ? 'Saved' : 'Save', ariaLabel: isSaved ? 'Remove from saved skills' : 'Save skill', onClick: handleSaveSkill, loading: saving, active: isSaved },
                        isOwner && { key: 'visibility', icon: 'save', label: isPrivate ? 'Make Public' : 'Make Private', ariaLabel: isPrivate ? 'Make skill public' : 'Make skill private', onClick: handleTogglePrivate, disabled: working },
                        isOwner && { key: 'delete', icon: 'copy', label: 'Delete', ariaLabel: 'Delete skill', onClick: () => setShowDeleteConfirm(true), disabled: working, className: 'hover:text-red-400/70 hover:border-red-500/20 hover:bg-red-500/[0.04]' },
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
                    title="Delete Skill"
                    message={<><span className="text-white/70 font-semibold">"{skill.title}"</span>{' '}will be permanently deleted. This action cannot be undone.</>}
                    confirmLabel="Delete"
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                    working={working}
                />
            )}
        </>
    )
}
