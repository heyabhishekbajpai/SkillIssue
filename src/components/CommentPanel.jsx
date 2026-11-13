import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { MessageSquare, X, Trash2 } from 'lucide-react'
import { Avatar, Spinner, timeAgo } from './ui/primitives'

function CommentItem({ comment, currentUserId, onDelete }) {
    const isOwner = !!(currentUserId && comment.user_id === currentUserId)
    const isOptimistic = !!comment._optimistic
    return (
        <div className={`flex gap-2.5 ${isOptimistic ? 'opacity-60' : ''}`}>
            <Avatar src={comment.avatar_url} name={comment.username} size={28} className="mt-0.5" />
            <div className="min-w-0 flex-1 overflow-hidden rounded-md border border-line">
                <div className="flex items-center gap-2 border-b border-line-muted bg-canvas-subtle px-3 py-1.5 text-xs">
                    <span className="font-semibold text-fg">{comment.username}</span>
                    <span className="text-fg-muted">{timeAgo(comment.$createdAt || comment.created_at)}</span>
                    {isOwner && !isOptimistic && (
                        <button
                            type="button"
                            onClick={() => onDelete?.(comment.id)}
                            aria-label="Delete comment"
                            className="btn-invisible btn-icon btn-sm ml-auto h-6 w-6 hover:!text-danger"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
                <p className="whitespace-pre-wrap break-words px-3 py-2 text-sm text-fg">{comment.body}</p>
            </div>
        </div>
    )
}

function CommentComposer({ user, userProfile, draft, setDraft, onSubmit, submitting }) {
    if (!user) {
        return <p className="py-2 text-center text-sm text-fg-muted">Sign in to join the discussion.</p>
    }
    return (
        <div className="flex items-start gap-2.5">
            <Avatar src={userProfile?.avatar_url} name={userProfile?.username || user.email} size={28} className="mt-0.5" />
            <div className="min-w-0 flex-1">
                <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault()
                            onSubmit()
                        }
                    }}
                    placeholder="Leave a comment"
                    aria-label="Write a comment"
                    rows={3}
                    className="input resize-none"
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-fg-muted">Ctrl + Enter to send</span>
                    <button type="button" onClick={onSubmit} disabled={!draft.trim() || submitting} className="btn-primary btn-sm">
                        {submitting && <Spinner size={12} className="text-brand-fg" />}
                        Comment
                    </button>
                </div>
            </div>
        </div>
    )
}

function CommentList({ comments, loadingComments, currentUserId, onDelete }) {
    if (loadingComments) {
        return <div className="flex justify-center py-10"><Spinner size={20} /></div>
    }
    if (comments.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
                <MessageSquare className="h-5 w-5 text-fg-muted" />
                <p className="text-sm font-semibold">No comments yet</p>
                <p className="text-xs text-fg-muted">Start the discussion about this skill.</p>
            </div>
        )
    }
    return (
        <div className="space-y-4">
            {comments.map((c) => <CommentItem key={c.id} comment={c} currentUserId={currentUserId} onDelete={onDelete} />)}
        </div>
    )
}

function useCommentDraft({ open, comments, onSubmitComment, submitting }) {
    const [draft, setDraft] = useState('')
    const listRef = useRef(null)
    useEffect(() => { if (!open) setDraft('') }, [open])
    useEffect(() => {
        if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    }, [comments.length, open])
    function handleSubmit() {
        const text = draft.trim()
        if (!text || submitting) return
        onSubmitComment?.(text)
        setDraft('')
    }
    return { draft, setDraft, listRef, handleSubmit }
}

function PanelBody({ title, count, onClose, children, listRef, composer }) {
    return (
        <>
            <div className="flex shrink-0 items-center gap-2 border-b border-line px-4 py-3">
                <MessageSquare className="h-4 w-4 text-fg-muted" />
                <div className="min-w-0">
                    <h2 className="font-sans text-sm font-semibold">Comments</h2>
                    {title && <p className="truncate text-xs text-fg-muted">{title}</p>}
                </div>
                {count > 0 && <span className="counter">{count}</span>}
                <button type="button" onClick={onClose} aria-label="Close comments" className="btn-invisible btn-icon btn-sm ml-auto">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
            <div className="shrink-0 border-t border-line bg-canvas-subtle px-4 py-3">{composer}</div>
        </>
    )
}

/** Slide-over panel scoped to its positioned parent (used inside modals). */
export default function CommentPanel({
    open,
    onClose,
    skillTitle,
    user,
    userProfile,
    comments = [],
    loadingComments = false,
    onSubmitComment,
    onDeleteComment,
    submitting = false,
}) {
    const { draft, setDraft, listRef, handleSubmit } = useCommentDraft({ open, comments, onSubmitComment, submitting })
    return (
        <>
            <div
                className={`absolute inset-0 z-10 bg-[rgb(var(--shadow)/0.3)] transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                role="complementary"
                aria-label="Comments"
                className={`absolute bottom-0 right-0 top-0 z-20 flex flex-col border-l border-line bg-canvas shadow-overlay transition-transform duration-200 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ width: 'min(380px, 100%)' }}
            >
                <PanelBody
                    title={skillTitle}
                    count={comments.length}
                    onClose={onClose}
                    listRef={listRef}
                    composer={<CommentComposer user={user} userProfile={userProfile} draft={draft} setDraft={setDraft} onSubmit={handleSubmit} submitting={submitting} />}
                >
                    <CommentList comments={comments} loadingComments={loadingComments} currentUserId={user?.$id} onDelete={onDeleteComment} />
                </PanelBody>
            </div>
        </>
    )
}

/** Full-height drawer attached to the viewport (used from list rows and pages). */
export function StandaloneCommentDrawer({
    open,
    onClose,
    skillTitle,
    user,
    userProfile,
    comments = [],
    loadingComments = false,
    onSubmitComment,
    onDeleteComment,
    submitting = false,
}) {
    const { draft, setDraft, listRef, handleSubmit } = useCommentDraft({ open, comments, onSubmitComment, submitting })

    useEffect(() => {
        if (!open) return undefined
        const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    return createPortal(
        // Stop clicks from bubbling (through the React tree) to clickable rows that render this drawer
        <div onClick={(e) => e.stopPropagation()}>
            <div
                className={`fixed inset-0 z-[110] bg-[rgb(var(--shadow)/0.45)] transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                role="complementary"
                aria-label="Comments"
                className={`fixed bottom-0 right-0 top-0 z-[120] flex flex-col border-l border-line bg-canvas shadow-overlay transition-transform duration-200 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ width: 'min(420px, 100vw)' }}
            >
                <PanelBody
                    title={skillTitle}
                    count={comments.length}
                    onClose={onClose}
                    listRef={listRef}
                    composer={<CommentComposer user={user} userProfile={userProfile} draft={draft} setDraft={setDraft} onSubmit={handleSubmit} submitting={submitting} />}
                >
                    <CommentList comments={comments} loadingComments={loadingComments} currentUserId={user?.$id} onDelete={onDeleteComment} />
                </PanelBody>
            </div>
        </div>,
        document.body
    )
}
