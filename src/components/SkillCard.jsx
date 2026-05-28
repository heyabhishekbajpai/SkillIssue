import { useState } from 'react'
import ConfirmDialog from './ConfirmDialog'

// Reusable skill card for profile pages and explore feeds
export default function SkillCard({ skill, onCopy, onClick, onDelete, onMakePrivate, isPrivate = false, isOwner = false, index = 0 }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [linkCopied, setLinkCopied] = useState(false)

    const {
        id, title, description, category, tags = [],
        star_count = 0, copy_count = 0, $createdAt, created_at,
    } = skill

    const ago = (() => {
        const dateStr = $createdAt || created_at
        if (!dateStr) return 'unknown'
        const diff = Date.now() - new Date(dateStr).getTime()
        const d = Math.floor(diff / 86400000)
        if (Number.isNaN(d) || d < 0) return 'unknown'
        if (d < 1) return 'today'
        if (d === 1) return 'yesterday'
        if (d < 30) return `${d}d ago`
        if (d < 365) return `${Math.floor(d / 30)}mo ago`
        return `${Math.floor(d / 365)}y ago`
    })()

    async function handleShare(e) {
        e.stopPropagation()
        const url = `${import.meta.env.VITE_SITE_URL || 'https://www.skillissue.bajpai.tech'}/skill/${id}`
        if (navigator.share) {
            try { await navigator.share({ title, url }) } catch { /* cancelled */ }
        } else {
            await navigator.clipboard.writeText(url)
            setLinkCopied(true)
            setTimeout(() => setLinkCopied(false), 2000)
        }
    }

    const categoryColors = {
        coding: {
            badge: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
            glow: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.08)]',
        },
        writing: {
            badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
            glow: 'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.08)]',
        },
        research: {
            badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
            glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.08)]',
        },
        analysis: {
            badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
            glow: 'group-hover:shadow-[0_0_30px_rgba(245,158,11,0.08)]',
        },
        design: {
            badge: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
            glow: 'group-hover:shadow-[0_0_30px_rgba(236,72,153,0.08)]',
        },
        other: {
            badge: 'bg-white/5 text-white/40 border-white/10',
            glow: 'group-hover:shadow-[0_0_30px_rgba(75,169,255,0.06)]',
        },
    }
    const cat = categoryColors[category?.toLowerCase()] ?? categoryColors.other

    return (
        <div
            className={`skill-card-enter group relative bg-gradient-to-b from-navy-50 to-navy border border-white/[0.08] rounded-3xl p-6 hover:border-accent/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:scale-[1.02] flex flex-col gap-5 shadow-sm hover:shadow-[0_0_35px_rgba(75,169,255,0.08)] ${cat.glow} ${onClick ? 'cursor-pointer' : ''}`}
            onClick={() => onClick?.(skill)}
        >
            {/* Subtle top edge highlight */}
            <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-accent/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Private badge */}
            {isPrivate && (
                <span className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/25 font-satoshi text-[10px] uppercase tracking-widest font-medium">
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    Private
                </span>
            )}

            {/* Header */}
            <div className="flex-1 min-w-0">
                {category && (
                    <span className={`inline-flex items-center gap-1 mb-4 px-3 py-1.5 rounded-xlg text-[11px] font-satoshi font-bold border ${cat.badge} uppercase tracking-wider`}>
                        <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                        {category}
                    </span>
                )}
     <h3 className="font-clash font-bold text-xl text-white leading-snug mb-3 group-hover:text-accent-light group-hover:drop-shadow-[0_0_8px_rgba(75,169,255,0.2)] transition-colors duration-300 line-clamp-2">          
                    {title}
                </h3>
                {description && (<p className="font-satoshi text-sm text-white/70 leading-relaxed line-clamp-3">
                    
                        {description}
                    </p>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]" onClick={e => e.stopPropagation()}>
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
                    {/* Divider dot + timestamp */}
                    <span className="w-0.5 h-0.5 rounded-full bg-white/15" />
                    <span className="font-satoshi text-xs text-white/20">{ago}</span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5">
                    {/* Copy to clipboard (non-owner public) */}
                    {onCopy && !isPrivate && !isOwner && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onCopy(skill); }}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent/[0.06] border border-accent/15 text-accent/80 font-satoshi text-xs font-semibold hover:bg-accent/15 hover:border-accent/30 hover:text-accent hover:shadow-[0_0_12px_rgba(75,169,255,0.12)] transition-all duration-300"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5a1.125 1.125 0 011.125 1.125v7.5" />
                            </svg>
                            Copy
                        </button>
                    )}

                    {/* Owner: Make private (only on public cards) */}
                    {isOwner && onMakePrivate && !isPrivate && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onMakePrivate(skill.id); }}
                            title="Make private"
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-white/25 hover:text-amber-400/70 hover:border-amber-500/20 hover:bg-amber-500/[0.05] transition-all duration-300"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        </button>
                    )}

                    {/* Share Button */}
                    <button
                        onClick={handleShare}
                        title={linkCopied ? "Link copied!" : "Share skill"}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-white/25 hover:text-accent/80 hover:border-accent/30 hover:bg-accent/[0.05] transition-all duration-300"
                    >
                        {linkCopied ? (
                            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
                        )}
                    </button>

                    {/* Owner: Delete */}
                    {isOwner && onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                            title="Delete skill"
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-white/25 hover:text-red-400/70 hover:border-red-500/20 hover:bg-red-500/[0.05] transition-all duration-300"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Delete confirmation dialog */}
            {showDeleteConfirm && (
                <ConfirmDialog
                    title="Delete Skill"
                    message={
                        <>
                            <span className="text-white/70 font-semibold">"{skill.title}"</span>
                            {' '}will be permanently deleted.{' '}
                            This action cannot be undone.
                        </>
                    }
                    confirmLabel="Delete"
                    working={deleting}
                    onConfirm={async () => {
                        setDeleting(true)
                        try { await onDelete(skill.id) }
                        finally { setDeleting(false); setShowDeleteConfirm(false) }
                    }}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}
        </div>
    )
}
