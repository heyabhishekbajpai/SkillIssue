// Reusable skill card for profile pages and explore feeds
export default function SkillCard({ skill, onCopy, isPrivate = false, index = 0 }) {
    const {
        id, title, description, category, tags = [],
        star_count = 0, copy_count = 0, created_at,
    } = skill

    const ago = (() => {
        const diff = Date.now() - new Date(created_at).getTime()
        const d = Math.floor(diff / 86400000)
        if (d < 1) return 'today'
        if (d === 1) return 'yesterday'
        if (d < 30) return `${d}d ago`
        if (d < 365) return `${Math.floor(d / 30)}mo ago`
        return `${Math.floor(d / 365)}y ago`
    })()

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
            className={`skill-card-enter group relative bg-gradient-to-b from-navy-50 to-navy border border-white/[0.06] rounded-2xl p-5 hover:border-accent/25 transition-all duration-400 hover:-translate-y-1 flex flex-col gap-4 ${cat.glow}`}
            style={{ animationDelay: `${index * 80}ms` }}
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
                    <span className={`inline-flex items-center gap-1 mb-3 px-2.5 py-1 rounded-lg text-[11px] font-satoshi font-bold border ${cat.badge} uppercase tracking-wider`}>
                        <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                        {category}
                    </span>
                )}
                <h3 className="font-clash font-bold text-lg text-white leading-snug mb-2 group-hover:text-accent-light transition-colors duration-300 line-clamp-2">
                    {title}
                </h3>
                {description && (
                    <p className="font-satoshi text-sm text-white/40 leading-relaxed line-clamp-2">
                        {description}
                    </p>
                )}
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
                    {/* Divider dot + timestamp */}
                    <span className="w-0.5 h-0.5 rounded-full bg-white/15" />
                    <span className="font-satoshi text-xs text-white/20">{ago}</span>
                </div>

                {onCopy && !isPrivate && (
                    <button
                        onClick={() => onCopy(skill)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent/[0.06] border border-accent/15 text-accent/80 font-satoshi text-xs font-semibold hover:bg-accent/15 hover:border-accent/30 hover:text-accent hover:shadow-[0_0_12px_rgba(75,169,255,0.12)] transition-all duration-300"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5a1.125 1.125 0 011.125 1.125v7.5" />
                        </svg>
                        Copy
                    </button>
                )}
            </div>
        </div>
    )
}
