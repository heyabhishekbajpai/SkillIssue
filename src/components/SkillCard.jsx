import { useState } from 'react'
import { BookMarked, Star, Copy, Share2, Check, Lock, Trash2 } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog'
import { CategoryDot, formatCount, timeAgo } from './ui/primitives'
import { SITE_URL } from '../lib/site'

// Repository-style card for profile pages and explore feeds
export default function SkillCard({ skill, onCopy, onClick, onDelete, onMakePrivate, isPrivate = false, isOwner = false }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [linkCopied, setLinkCopied] = useState(false)

    const {
        id, title, description, category, tags = [],
        star_count = 0, copy_count = 0, $createdAt, created_at,
        username, display_name,
    } = skill

    async function handleShare(e) {
        e?.stopPropagation()
        const url = `${SITE_URL}/skill/${id}`
        if (navigator.share) {
            try { await navigator.share({ title, url }) } catch { /* cancelled */ }
        } else {
            await navigator.clipboard.writeText(url)
            setLinkCopied(true)
            setTimeout(() => setLinkCopied(false), 2000)
        }
    }

    const normalizedTags = Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
            ? tags.split(',').map((t) => t.trim()).filter(Boolean)
            : []

    const owner = username || display_name

    return (
        <article
            className={`box flex h-full flex-col p-4 transition-colors ${onClick ? 'cursor-pointer hover:border-fg-subtle/60' : ''}`}
            onClick={() => onClick?.(skill)}
        >
            <div className="flex items-start gap-2">
                {isPrivate ? <Lock className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" /> : <BookMarked className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" />}
                <h3 className="min-w-0 flex-1 truncate font-sans text-sm font-semibold">
                    {owner && <span className="font-normal text-accent">{owner} / </span>}
                    <span className="text-accent group-hover:underline">{title}</span>
                </h3>
                <span className="label shrink-0">{isPrivate ? 'Private' : 'Public'}</span>
            </div>

            {description && (
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-fg-muted">{description}</p>
            )}

            {normalizedTags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                    {normalizedTags.slice(0, 4).map((t) => <span key={t} className="topic">{t}</span>)}
                </div>
            )}

            <div className="mt-auto flex items-center gap-4 pt-3 text-xs text-fg-muted" onClick={(e) => e.stopPropagation()}>
                <CategoryDot category={category} />
                <span className="inline-flex items-center gap-1" title="Stars"><Star className="h-3.5 w-3.5" />{formatCount(star_count)}</span>
                <span className="inline-flex items-center gap-1" title="Copies"><Copy className="h-3.5 w-3.5" />{formatCount(copy_count)}</span>
                <span className="hidden truncate sm:inline">Updated {timeAgo($createdAt || created_at)}</span>

                <div className="ml-auto flex items-center gap-1">
                    {onCopy && !isPrivate && !isOwner && (
                        <button type="button" onClick={() => onCopy(skill)} className="btn btn-sm" title="Copy skill">
                            <Copy className="h-3.5 w-3.5" />Copy
                        </button>
                    )}
                    {isOwner && onMakePrivate && !isPrivate && (
                        <button type="button" onClick={() => onMakePrivate(skill.id)} className="btn-invisible btn-icon btn-sm" title="Make private" aria-label="Make private">
                            <Lock className="h-3.5 w-3.5" />
                        </button>
                    )}
                    <button type="button" onClick={handleShare} className="btn-invisible btn-icon btn-sm" title={linkCopied ? 'Link copied' : 'Share'} aria-label="Share skill">
                        {linkCopied ? <Check className="h-3.5 w-3.5 text-success" /> : <Share2 className="h-3.5 w-3.5" />}
                    </button>
                    {isOwner && onDelete && (
                        <button type="button" onClick={() => setShowDeleteConfirm(true)} className="btn-invisible btn-icon btn-sm hover:!text-danger" title="Delete skill" aria-label="Delete skill">
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {showDeleteConfirm && (
                <ConfirmDialog
                    title="Delete skill"
                    message={<><span className="font-semibold text-fg">{skill.title}</span> will be permanently deleted. This cannot be undone.</>}
                    confirmLabel="Delete this skill"
                    working={deleting}
                    onConfirm={async () => {
                        setDeleting(true)
                        try { await onDelete(skill.id) }
                        finally { setDeleting(false); setShowDeleteConfirm(false) }
                    }}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}
        </article>
    )
}
