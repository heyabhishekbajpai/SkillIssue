import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
    Copy, Check, Share2, Download, MessageSquare, Github, Star, BookOpen, FolderGit2,
    Scale, ExternalLink, AlertCircle, LogIn,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
    fetchSkillFiles,
    fetchFileContentByPath,
    fetchRepoStars,
    downloadSkillAsZip,
    getOrgAvatarUrl,
} from '../lib/githubService'
import SEO, { jsonLdSchemas } from '../components/SEO'
import SkillViewer, { splitFrontmatter } from '../components/SkillViewer'
import Toast from '../components/Toast'
import { StandaloneCommentDrawer } from '../components/CommentPanel'
import { useComments } from '../hooks/useComments'
import { SkillRepoHeader, SidebarSection, MetaItem, DetailSkeleton } from '../components/SkillPageLayout'
import { Blankslate, Spinner, formatCount } from '../components/ui/primitives'

export default function GitHubSkillPage() {
    const [searchParams] = useSearchParams()
    const { user: authUser, profile: authProfile, openAuthModal } = useAuth()

    const repo = searchParams.get('repo') || ''
    const path = searchParams.get('path') || ''

    const rawName = path.split('/').filter(Boolean).pop() || repo
    const displayName = rawName.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    const repoOwner = repo.split('/')[0] || ''
    const avatarUrl = repo ? getOrgAvatarUrl(repo) : null

    const [content, setContent] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [skillFiles, setSkillFiles] = useState([])
    const [stars, setStars] = useState(null)

    const [copied, setCopied] = useState(false)
    const [linkCopied, setLinkCopied] = useState(false)
    const [downloading, setDownloading] = useState(false)
    const [toast, setToast] = useState(null)
    const [viewerContent, setViewerContent] = useState('')
    const [commentsOpen, setCommentsOpen] = useState(false)
    const githubSkillId = repo && path ? `github:${repo}:${path}` : null
    const { comments, loadingComments, submitting: commentSubmitting, submitComment, removeComment } = useComments({
        skillId: githubSkillId,
        skillType: 'github',
        open: commentsOpen,
        user: authUser,
        profile: authProfile,
    })

    const isGuest = !authUser

    useEffect(() => {
        if (!repo || !path) {
            setError('Invalid share link — missing repo or path.')
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)

        fetchSkillFiles(repo, path)
            .then((files) => {
                if (Array.isArray(files)) setSkillFiles(files)
                const skillMd = files.find((f) => f.name.toUpperCase() === 'SKILL.MD')
                const anyMd = files.find((f) => f.name.toLowerCase().endsWith('.md'))
                const target = skillMd || anyMd
                if (!target) throw new Error('No .md file found in this skill folder.')
                return fetchFileContentByPath(repo, target.path)
            })
            .then(setContent)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false))

        fetchRepoStars(repo).then(setStars).catch(() => {})
    }, [repo, path])

    const meta = useMemo(() => {
        const { meta: m } = splitFrontmatter(content || '')
        return Object.fromEntries(m || [])
    }, [content])

    function showToast(msg) {
        setToast(msg)
        setTimeout(() => setToast(null), 3000)
    }

    function handleCopy() {
        if (isGuest) { openAuthModal(); return }
        const src = viewerContent || content
        if (!src) return
        navigator.clipboard.writeText(src)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    async function handleShare() {
        const url = window.location.href
        if (navigator.share) {
            try { await navigator.share({ title: displayName, url }) } catch { /* cancelled */ }
        } else {
            await navigator.clipboard.writeText(url)
            setLinkCopied(true)
            showToast('Link copied to clipboard')
            setTimeout(() => setLinkCopied(false), 2000)
        }
    }

    async function handleDownload() {
        if (!authUser) { openAuthModal(); return }
        if (!repo || !path) return
        setDownloading(true)
        try {
            await downloadSkillAsZip(repo, path, rawName)
        } catch (err) {
            showToast('Download failed: ' + err.message)
        } finally {
            setDownloading(false)
        }
    }

    if (loading) return <DetailSkeleton />

    if (error || !repo || !path) {
        return (
            <div className="container-page py-16">
                <div className="box mx-auto max-w-xl">
                    <Blankslate
                        icon={AlertCircle}
                        title="Skill not found"
                        action={<Link to="/browse" className="btn-primary">Browse skills</Link>}
                    >
                        {error || 'This share link appears to be invalid or the skill has been removed.'}
                    </Blankslate>
                </div>
            </div>
        )
    }

    const githubUrl = `https://github.com/${repo}/tree/main/${path}`
    const description = meta.description

    return (
        <>
            <SEO
                title={`${displayName} — GitHub Skill File`}
                description={description || `${displayName} skill file from ${repoOwner} on GitHub. Browse, copy, and use this AI skill file with Claude, ChatGPT, Gemini, Cursor and more.`}
                path={`/skill/github?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}`}
                jsonLd={jsonLdSchemas.breadcrumb([
                    { name: 'Home', url: '/' },
                    { name: 'Browse Skills', url: '/browse' },
                    { name: displayName },
                ])}
            />

            <SkillRepoHeader
                avatar={avatarUrl}
                avatarSquare
                owner={repoOwner}
                ownerHref={`https://github.com/${repoOwner}`}
                name={displayName}
                label="Public"
                actions={
                    <>
                        <button type="button" onClick={handleShare} className="btn btn-sm">
                            {linkCopied ? <Check className="h-3.5 w-3.5 !text-success" /> : <Share2 className="h-3.5 w-3.5" />}
                            {linkCopied ? 'Copied' : 'Share'}
                        </button>
                        <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                            <Github className="h-3.5 w-3.5" />GitHub
                        </a>
                        {typeof stars === 'number' && (
                            <span className="btn btn-sm pointer-events-none">
                                <Star className="h-3.5 w-3.5" />Stars<span className="counter">{formatCount(stars)}</span>
                            </span>
                        )}
                    </>
                }
                tabs={
                    <nav className="tabnav border-b-0" aria-label="Skill sections">
                        <span className="tabnav-item selected"><BookOpen className="h-4 w-4" />Skill</span>
                        <button type="button" onClick={() => setCommentsOpen(true)} className="tabnav-item">
                            <MessageSquare className="h-4 w-4" />Discussion
                            {comments.length > 0 && <span className="counter">{comments.length}</span>}
                        </button>
                    </nav>
                }
            />

            <div className="container-page grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_296px]">
                <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex min-w-0 items-center gap-2 text-sm">
                            <FolderGit2 className="h-4 w-4 shrink-0 text-fg-muted" />
                            <span className="truncate font-mono text-fg-muted">{path}</span>
                        </span>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={handleCopy} className="btn btn-sm">
                                {copied ? <Check className="h-3.5 w-3.5 !text-success" /> : <Copy className="h-3.5 w-3.5" />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                            <button type="button" onClick={handleDownload} disabled={downloading} className="btn-primary btn-sm">
                                {downloading ? <Spinner size={14} className="text-fg-onemphasis" /> : <Download className="h-3.5 w-3.5" />}
                                {downloading ? 'Zipping…' : 'Download .zip'}
                            </button>
                        </div>
                    </div>

                    <SkillViewer
                        files={skillFiles}
                        rootName={rawName}
                        markdownContent={content || ''}
                        locked={isGuest}
                        showTabs={!isGuest}
                        onLockedAction={openAuthModal}
                        fetchFileContent={(file) => fetchFileContentByPath(repo, file.path)}
                        onActiveContentChange={setViewerContent}
                    />
                </div>

                <aside className="min-w-0">
                    <SidebarSection title="About">
                        {description
                            ? <p className="text-[15px] leading-6 text-fg">{description}</p>
                            : <p className="text-sm italic text-fg-muted">No description provided.</p>}
                        <ul className="mt-4 space-y-2">
                            <MetaItem icon={ExternalLink}>
                                <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent hover:underline">{repo}</a>
                            </MetaItem>
                            {typeof stars === 'number' && <MetaItem icon={Star}><strong className="text-fg">{stars.toLocaleString()}</strong> stars on the repository</MetaItem>}
                            {meta.license && <MetaItem icon={Scale}>{meta.license}</MetaItem>}
                            <MetaItem icon={MessageSquare}>
                                <button type="button" onClick={() => setCommentsOpen(true)} className="hover:text-accent">
                                    {comments.length > 0 ? `${comments.length} comments` : 'Discussion'}
                                </button>
                            </MetaItem>
                        </ul>
                    </SidebarSection>

                    <SidebarSection title="Use this skill">
                        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-fg-muted">
                            <li>Copy the SKILL.md or download the folder.</li>
                            <li>Claude Code: place it in <code className="rounded bg-neutral-subtle px-1 font-mono text-xs text-fg">.claude/skills/{rawName}/</code></li>
                            <li>Cursor: save it under <code className="rounded bg-neutral-subtle px-1 font-mono text-xs text-fg">.cursor/rules/</code></li>
                            <li>Other agents: paste it into the system or project instructions.</li>
                        </ol>
                        {isGuest && (
                            <button type="button" onClick={openAuthModal} className="btn btn-block mt-4">
                                <LogIn className="h-4 w-4" />Sign in to copy and download
                            </button>
                        )}
                    </SidebarSection>

                    <SidebarSection title="Source">
                        <a href={`https://github.com/${repoOwner}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-md hover:text-accent">
                            {avatarUrl && <img src={avatarUrl} alt="" width={32} height={32} loading="lazy" className="h-8 w-8 rounded-md ring-1 ring-line-muted" />}
                            <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold">{repoOwner}</span>
                                <span className="block truncate font-mono text-xs text-fg-muted">{repo}</span>
                            </span>
                        </a>
                    </SidebarSection>
                </aside>
            </div>

            <Toast message={toast} onDismiss={() => setToast(null)} />

            <StandaloneCommentDrawer
                open={commentsOpen}
                onClose={() => setCommentsOpen(false)}
                skillId={githubSkillId}
                skillTitle={displayName}
                user={authUser}
                userProfile={authProfile}
                comments={comments}
                loadingComments={loadingComments}
                submitting={commentSubmitting}
                onSubmitComment={submitComment}
                onDeleteComment={removeComment}
            />
        </>
    )
}
