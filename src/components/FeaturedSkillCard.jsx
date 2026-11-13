import { Star, Download, BadgeCheck, Users, Github } from 'lucide-react'
import { getOrgAvatarUrl, getUserAvatarUrl } from '../lib/githubService'
import { Avatar, Spinner, formatCount } from './ui/primitives'

/**
 * Search-result row for GitHub-sourced skills (official orgs, community
 * collections, OpenClaw and crawler-indexed skills).
 */
export default function FeaturedSkillCard({ skill, onClick, onDownload, isDownloading }) {
    const { displayName, company, stars, repo, isIndexed, isOpenClaw, author } = skill

    const owner = isOpenClaw ? author : (company || repo?.split('/')[0])
    const avatar = isOpenClaw
        ? getUserAvatarUrl(author)
        : isIndexed
            ? (skill.ownerAvatar || `https://avatars.githubusercontent.com/${company}`)
            : getOrgAvatarUrl(repo)
    const description = skill.description || skill.repoDescription
    const kind = isIndexed
        ? { label: 'Discovered', icon: Github, cls: 'label-attention' }
        : isOpenClaw || skill.isCommunity || skill.label
            ? { label: 'Community', icon: Users, cls: 'label-done' }
            : { label: 'Official', icon: BadgeCheck, cls: 'label-success' }
    const KindIcon = kind.icon

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onClick(skill)}
            onKeyDown={(e) => { if (e.key === 'Enter') onClick(skill) }}
            className="box-row box-row-hover flex cursor-pointer gap-3 py-4"
        >
            <Avatar src={avatar} name={owner} size={20} square={!isOpenClaw} className="mt-0.5" />
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="min-w-0 truncate font-sans text-[15px] leading-6">
                        <span className="text-accent">{owner}</span>
                        <span className="text-fg-muted"> / </span>
                        <span className="font-semibold text-accent hover:underline">{displayName}</span>
                    </h3>
                    <span className={`label ${kind.cls}`}><KindIcon className="h-3 w-3" />{kind.label}</span>
                </div>
                {description && <p className="mt-1 line-clamp-2 text-sm text-fg-muted">{description}</p>}
                {skill.topics?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {skill.topics.slice(0, 5).map((t) => <span key={t} className="topic">{t}</span>)}
                    </div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted">
                    {typeof stars === 'number' && (
                        <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" />{formatCount(stars)}</span>
                    )}
                    {skill.language && <span>{skill.language}</span>}
                    <span className="truncate font-mono">{repo}</span>
                    {isOpenClaw && skill.attributionLabel && <span className="truncate">{skill.attributionLabel}</span>}
                </div>
            </div>
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    onClick={() => onDownload(skill)}
                    disabled={isDownloading}
                    className="btn btn-sm"
                    title="Download .zip"
                    aria-label={`Download ${displayName} as zip`}
                >
                    {isDownloading ? <Spinner size={14} /> : <Download className="h-3.5 w-3.5" />}
                    <span className="hidden sm:inline">.zip</span>
                </button>
            </div>
        </div>
    )
}
