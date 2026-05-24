import { getOrgAvatarUrl, getUserAvatarUrl } from '../lib/githubService'
import { useTheme } from '../context/ThemeContext'

// ── Official card (Anthropic, Vercel, OpenAI, HuggingFace) ──────────────
function OfficialCard({ skill, onClick, onDownload, isDownloading }) {
    const { theme } = useTheme()
    const { displayName, company, stars, repo } = skill

    const companyColors = {
        Anthropic: { badge: 'bg-orange-500/10 text-orange-300 border-orange-500/20', glow: 'group-hover:shadow-[0_0_30px_rgba(249,115,22,0.08)]' },
        Vercel: { badge: 'bg-white/10 text-white/80 border-white/20', glow: 'group-hover:shadow-[0_0_30px_rgba(255,255,255,0.06)]' },
        OpenAI: { badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20', glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.08)]' },
        HuggingFace: { badge: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20', glow: 'group-hover:shadow-[0_0_30px_rgba(234,179,8,0.08)]' },
    }
    const cc = companyColors[company] ?? companyColors.OpenAI

    function formatStars(n) {
        if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
        return String(n)
    }

    return (
        <div
            onClick={() => onClick(skill)}
            className={`group relative ${theme === 'light' ? 'bg-white border-black/10' : 'bg-gradient-to-b from-navy-50 to-navy border-white/[0.06]'} rounded-2xl p-5 hover:border-emerald-400/25 transition-all duration-400 hover:-translate-y-1 flex flex-col gap-4 cursor-pointer ${cc.glow}`}
        >
            {/* Top edge highlight */}
            <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Header row: avatar + verified */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <img
                        src={getOrgAvatarUrl(repo)}
                        alt={company}
                        loading="lazy"
                        width={28}
                        height={28}
                        className="w-7 h-7 rounded-lg border border-white/10 bg-white/5"
                    />
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-satoshi font-bold border ${cc.badge} uppercase tracking-wider`}>
                        {company}
                    </span>
                </div>
                {/* Verified badge */}
                <span className="flex items-center gap-1 text-accent/70 font-satoshi text-[10px] font-medium tracking-wide uppercase">
                    <svg className="w-3.5 h-3.5 text-accent" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" />
                    </svg>
                    Official
                </span>
            </div>

            {/* Skill name */}
            <div className="flex-1 min-w-0">
                <h3 className="font-clash font-bold text-lg text-white leading-snug mb-1 group-hover:text-emerald-200 transition-colors duration-300 line-clamp-2">
                    {displayName}
                </h3>
                <p className="font-satoshi text-sm text-white/35 line-clamp-1">
                    by {company} · {skill.name}
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
                        {formatStars(stars)}
                    </span>
                    {/* GitHub link */}
                    <a
                        href={skill.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 font-satoshi text-xs text-white/25 hover:text-white/50 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                    </a>
                </div>

                {/* Download button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onDownload(skill)
                    }}
                    disabled={isDownloading}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/15 text-emerald-300/80 font-satoshi text-xs font-semibold hover:bg-emerald-500/15 hover:border-emerald-500/30 hover:text-emerald-200 hover:shadow-[0_0_12px_rgba(16,185,129,0.12)] transition-all duration-300 disabled:opacity-50"
                >
                    {isDownloading ? (
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    ) : (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                    )}
                    .zip
                </button>
            </div>
        </div>
    )
}

// ── Community card (OpenClaw) ────────────────────────────────────────────
function CommunityCard({ skill, onClick, onDownload, isDownloading }) {
    const { displayName, author, attributionLabel, attributionUrl, name } = skill

    return (
        <div
            onClick={() => onClick(skill)}
            className="group relative bg-gradient-to-b from-navy-50 to-navy border border-white/[0.06] rounded-2xl p-5 hover:border-violet-400/25 transition-all duration-400 hover:-translate-y-1 flex flex-col gap-4 cursor-pointer group-hover:shadow-[0_0_30px_rgba(139,92,246,0.08)]"
        >
            {/* Top edge highlight */}
            <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-violet-400/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Header row: user avatar + community tag */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <img
                        src={getUserAvatarUrl(author)}
                        alt={author}
                        loading="lazy"
                        width={28}
                        height={28}
                        className="w-7 h-7 rounded-full border border-white/10 bg-white/5"
                    />
                    {/* Attribution: username/skill-name clickable link */}
                    <a
                        href={attributionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-mono text-[11px] text-violet-300/80 hover:text-violet-200 transition-colors truncate max-w-[140px]"
                        title={attributionLabel}
                    >
                        {attributionLabel}
                    </a>
                </div>
                {/* Community tag (no verified badge) */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-satoshi font-bold border bg-violet-500/10 text-violet-300 border-violet-500/20 uppercase tracking-wider">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Community
                </span>
            </div>

            {/* Skill name */}
            <div className="flex-1 min-w-0">
                <h3 className="font-clash font-bold text-lg text-white leading-snug mb-1 group-hover:text-violet-200 transition-colors duration-300 line-clamp-2">
                    {displayName}
                </h3>
                <p className="font-satoshi text-sm text-white/35 line-clamp-1">
                    by @{author} · {name}
                </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                {/* GitHub source link */}
                <a
                    href={attributionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 font-satoshi text-xs text-white/25 hover:text-white/50 transition-colors"
                >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    <span>View source</span>
                </a>

                {/* Download button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onDownload(skill)
                    }}
                    disabled={isDownloading}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-500/[0.06] border border-violet-500/15 text-violet-300/80 font-satoshi text-xs font-semibold hover:bg-violet-500/15 hover:border-violet-500/30 hover:text-violet-200 hover:shadow-[0_0_12px_rgba(139,92,246,0.12)] transition-all duration-300 disabled:opacity-50"
                >
                    {isDownloading ? (
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    ) : (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                    )}
                    .zip
                </button>
            </div>
        </div>
    )
}

// ── Indexed card (Discovered via GitHub crawler) ─────────────────────────
function IndexedCard({ skill, onClick, onDownload, isDownloading }) {
    const { displayName, company, stars, repo, ownerAvatar } = skill

    function formatStars(n) {
        if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
        return String(n)
    }

    return (
        <div
            onClick={() => onClick(skill)}
            className="group relative bg-gradient-to-b from-navy-50 to-navy border border-white/[0.06] rounded-2xl p-5 hover:border-amber-400/25 transition-all duration-400 hover:-translate-y-1 flex flex-col gap-4 cursor-pointer group-hover:shadow-[0_0_30px_rgba(245,158,11,0.08)]"
        >
            {/* Top edge highlight */}
            <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-amber-400/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Header row: avatar + discovered tag */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <img
                        src={ownerAvatar || `https://avatars.githubusercontent.com/${company}`}
                        alt={company}
                        loading="lazy"
                        width={28}
                        height={28}
                        className="w-7 h-7 rounded-lg border border-white/10 bg-white/5"
                    />
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-satoshi font-bold border bg-amber-500/10 text-amber-300 border-amber-500/20 uppercase tracking-wider">
                        {company}
                    </span>
                </div>
                {/* Discovered badge */}
                <span className="flex items-center gap-1 text-amber-400/70 font-satoshi text-[10px] font-medium tracking-wide uppercase">
                    <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>
                    Discovered
                </span>
            </div>

            {/* Skill name */}
            <div className="flex-1 min-w-0">
                <h3 className="font-clash font-bold text-lg text-white leading-snug mb-1 group-hover:text-amber-200 transition-colors duration-300 line-clamp-2">
                    {displayName}
                </h3>
                <p className="font-satoshi text-sm text-white/35 line-clamp-1">
                    by {company} · {skill.name}
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
                        {formatStars(stars)}
                    </span>
                    {/* GitHub link */}
                    <a
                        href={skill.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 font-satoshi text-xs text-white/25 hover:text-white/50 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                    </a>
                </div>

                {/* Download button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onDownload(skill)
                    }}
                    disabled={isDownloading}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/[0.06] border border-amber-500/15 text-amber-300/80 font-satoshi text-xs font-semibold hover:bg-amber-500/15 hover:border-amber-500/30 hover:text-amber-200 hover:shadow-[0_0_12px_rgba(245,158,11,0.12)] transition-all duration-300 disabled:opacity-50"
                >
                    {isDownloading ? (
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    ) : (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                    )}
                    .zip
                </button>
            </div>
        </div>
    )
}

// ── Public export: picks the right variant automatically ─────────────────
export default function FeaturedSkillCard({ skill, onClick, onDownload, isDownloading }) {
    if (skill.isIndexed) {
        return (
            <IndexedCard
                skill={skill}
                onClick={onClick}
                onDownload={onDownload}
                isDownloading={isDownloading}
            />
        )
    }
    if (skill.isOpenClaw) {
        return (
            <CommunityCard
                skill={skill}
                onClick={onClick}
                onDownload={onDownload}
                isDownloading={isDownloading}
            />
        )
    }
    return (
        <OfficialCard
            skill={skill}
            onClick={onClick}
            onDownload={onDownload}
            isDownloading={isDownloading}
        />
    )
}
