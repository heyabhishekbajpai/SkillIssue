import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAuth } from '../context/AuthContext'
import {
    fetchSkillFiles,
    fetchFileContentByPath,
    downloadSkillAsZip,
    getOrgAvatarUrl,
} from '../lib/githubService'
import SEO, { jsonLdSchemas } from '../components/SEO'
import Breadcrumbs from '../components/Breadcrumbs'

// ── Shared markdown component map (mirrors SkillDetailPage) ────────────────
const MD = {
    h1: ({ children }) => <h1 className="font-satoshi font-semibold text-2xl text-white mb-4 mt-6 first:mt-0 pb-2 border-b border-white/10">{children}</h1>,
    h2: ({ children }) => <h2 className="font-satoshi font-semibold text-xl text-white/90 mb-3 mt-5 first:mt-0 pb-1.5 border-b border-white/[0.07]">{children}</h2>,
    h3: ({ children }) => <h3 className="font-satoshi font-medium text-base text-white/85 mb-2 mt-4 first:mt-0">{children}</h3>,
    h4: ({ children }) => <h4 className="font-satoshi font-medium text-sm text-white/80 mb-2 mt-3 first:mt-0">{children}</h4>,
    p: ({ children }) => <p className="font-satoshi text-sm text-white/60 mb-3 leading-relaxed last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-outside pl-5 mb-3 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-outside pl-5 mb-3 space-y-1">{children}</ol>,
    li: ({ children }) => <li className="font-satoshi text-sm text-white/60 leading-relaxed">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold text-white/85">{children}</strong>,
    em: ({ children }) => <em className="italic text-white/70">{children}</em>,
    a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-[#6bbcff] underline underline-offset-2 transition-colors">{children}</a>,
    code: ({ inline, children }) => inline
        ? <code className="font-mono text-[12px] text-accent/90 bg-accent/10 px-1.5 py-0.5 rounded">{children}</code>
        : <code className="block font-mono text-[12px] text-white/70 bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 overflow-x-auto mb-3 leading-relaxed">{children}</code>,
    pre: ({ children }) => <>{children}</>,
    blockquote: ({ children }) => <blockquote className="border-l-2 border-accent/40 pl-4 my-3 italic text-white/45">{children}</blockquote>,
    hr: () => <hr className="border-none h-px bg-white/10 my-5" />,
    table: ({ children }) => <div className="overflow-x-auto mb-3"><table className="w-full text-sm font-satoshi border-collapse">{children}</table></div>,
    thead: ({ children }) => <thead className="border-b border-white/10">{children}</thead>,
    th: ({ children }) => <th className="text-left py-2 px-3 text-white/70 font-semibold text-xs uppercase tracking-wide">{children}</th>,
    td: ({ children }) => <td className="py-2 px-3 text-white/50 border-t border-white/[0.05]">{children}</td>,
    img: ({ src, alt }) => <img src={src} alt={alt} className="max-w-full rounded-lg my-3" />,
}

export default function GitHubSkillPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { user: authUser, signIn } = useAuth()

    const repo = searchParams.get('repo') || ''
    const path = searchParams.get('path') || ''

    // Derive display name from path (last segment, prettified)
    const rawName = path.split('/').filter(Boolean).pop() || repo
    const displayName = rawName.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

    // Derive company from repo owner
    const repoOwner = repo.split('/')[0] || ''
    const avatarUrl = repo ? getOrgAvatarUrl(repo) : null

    const [content, setContent] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [skillFiles, setSkillFiles] = useState([])

    const [viewMode, setViewMode] = useState('rendered')
    const [copied, setCopied] = useState(false)
    const [linkCopied, setLinkCopied] = useState(false)
    const [downloading, setDownloading] = useState(false)
    const [toast, setToast] = useState(null)
    const [activeFile, setActiveFile] = useState(null)
    const [activeContent, setActiveContent] = useState(null)
    const [fileLoading, setFileLoading] = useState(false)

    const isGuest = !authUser

    // ── Fetch markdown content ────────────────────────────────────────────
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
    }, [repo, path])

    function showToast(msg) {
        setToast(msg)
        setTimeout(() => setToast(null), 3000)
    }

    function handleCopy() {
        const src = activeContent || content
        if (!src) return
        navigator.clipboard.writeText(src)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    async function handleFileClick(file) {
        setActiveFile(file)
        setActiveContent(null)
        setFileLoading(true)
        setViewMode('raw')
        try {
            const text = await fetchFileContentByPath(repo, file.path)
            setActiveContent(text)
        } catch {
            setActiveContent(`// Could not load ${file.name}`)
        } finally {
            setFileLoading(false)
        }
    }

    async function handleShare() {
        const url = window.location.href
        if (navigator.share) {
            try { await navigator.share({ title: displayName, url }) } catch { /* cancelled */ }
        } else {
            await navigator.clipboard.writeText(url)
            setLinkCopied(true)
            showToast('Link copied to clipboard!')
            setTimeout(() => setLinkCopied(false), 2000)
        }
    }

    async function handleDownload() {
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

    // ── Split for guest paywall ───────────────────────────────────────────
    function splitMarkdown(md) {
        if (!md) return { preview: '', rest: '' }
        const blocks = md.split(/\n\n+/)
        return {
            preview: blocks.slice(0, 2).join('\n\n'),
            rest: blocks.slice(2).join('\n\n'),
        }
    }

    // ── Loading state ─────────────────────────────────────────────────────
    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <svg className="w-8 h-8 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </main>
        )
    }

    // ── Error / bad link ──────────────────────────────────────────────────
    if (error || !repo || !path) {
        return (
            <main className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-accent/5 border border-accent/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-accent/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                </div>
                <h1 className="font-clash font-bold text-3xl">Skill not found</h1>
                <p className="font-satoshi text-white/40 max-w-sm">
                    {error || 'This share link appears to be invalid or the skill has been removed.'}
                </p>
                <Link to="/browse" className="btn-primary">Browse Skills</Link>
            </main>
        )
    }

    const { preview, rest } = splitMarkdown(content || '')
    const hasMore = rest.trim().length > 0
    const githubUrl = `https://github.com/${repo}/tree/main/${path}`

    return (
        <>
            <SEO
                title={`${displayName} — GitHub Skill File`}
                description={`${displayName} skill file from ${repoOwner} on GitHub. Browse, copy, and use this AI skill file with Claude, ChatGPT, Gemini, Cursor and more.`}
                path={`/skill/github?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}`}
                jsonLd={jsonLdSchemas.breadcrumb([
                    { name: 'Home', url: '/' },
                    { name: 'Browse Skills', url: '/browse' },
                    { name: displayName },
                ])}
            />
            <main className="relative min-h-screen pt-28 pb-24">
                {/* Ambient glow */}
                <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-accent/[0.04] rounded-full blur-[140px] pointer-events-none" />

                <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6">
                    <Breadcrumbs items={[
                        { label: 'Browse Skills', to: '/browse' },
                        { label: displayName },
                    ]} />
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 mb-8 text-white/30 hover:text-white/60 font-satoshi text-sm transition-colors group"
                    >
                        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Back
                    </button>

                    {/* ── Header ── */}
                    <div className="mb-8">
                        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                            <h1 className="font-clash font-bold text-3xl sm:text-4xl text-white leading-tight flex-1">
                                {displayName}
                            </h1>

                            {/* GitHub badge */}
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/40 text-xs font-satoshi font-semibold shrink-0">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                GitHub Skill
                            </span>
                        </div>

                        {/* Repo tag */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-accent text-[11px] font-satoshi font-bold uppercase tracking-wider">
                                Open Source
                            </span>
                            <span className="font-satoshi text-[11px] text-white/20 font-mono">{repo}</span>
                        </div>
                    </div>

                    {/* ── Source card (mirrors author card) ── */}
                    <a
                        href={githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3.5 mb-8 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-accent/20 hover:bg-white/[0.04] transition-all duration-300 group"
                    >
                        {avatarUrl && (
                            <img
                                src={avatarUrl}
                                alt={repoOwner}
                                className="w-10 h-10 rounded-lg border border-white/10 object-cover shrink-0"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-satoshi font-semibold text-sm text-white/80 group-hover:text-white transition-colors truncate">
                                {repoOwner}
                            </p>
                            <p className="font-satoshi text-xs text-white/30 truncate font-mono">{repo}</p>
                        </div>
                        <svg className="w-4 h-4 text-white/20 group-hover:text-accent/50 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                    </a>

                    {/* ── Action bar ── */}
                    <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                            <button onClick={handleCopy} title={copied ? 'Copied!' : 'Copy'} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:border-accent/30 hover:bg-white/[0.05] transition-all duration-200 group">
                                {copied
                                    ? <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                    : <svg className="w-3.5 h-3.5 text-white/35 group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
                                }
                                <span className="font-satoshi text-xs text-white/50 group-hover:text-white/75 transition-colors">{copied ? 'Copied!' : 'Copy'}</span>
                            </button>
                            <button onClick={handleShare} title={linkCopied ? 'Link copied!' : 'Share'} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:border-accent/30 hover:bg-white/[0.05] transition-all duration-200 group">
                                {linkCopied
                                    ? <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                    : <svg className="w-3.5 h-3.5 text-white/35 group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
                                }
                                <span className="font-satoshi text-xs text-white/50 group-hover:text-white/75 transition-colors">{linkCopied ? 'Link copied!' : 'Share'}</span>
                            </button>
                            <button onClick={handleDownload} disabled={downloading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 hover:border-accent/35 transition-all duration-200 disabled:opacity-50">
                                {downloading
                                    ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                }
                                <span className="font-satoshi text-xs font-semibold">{downloading ? 'Zipping…' : '.zip'}</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:border-accent/30 hover:bg-white/[0.05] transition-all duration-200 group">
                                <svg className="w-3.5 h-3.5 text-white/35 group-hover:text-accent transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                <span className="font-satoshi text-xs text-white/50 group-hover:text-white/75 transition-colors">GitHub</span>
                            </a>
                            {isGuest && (
                                <button onClick={signIn} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent/20 bg-accent/[0.06] text-accent font-satoshi font-semibold text-xs hover:bg-accent/15 hover:border-accent/40 transition-all duration-200">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
                                    Sign in to Save
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Content pane ── */}
                    <div className="rounded-2xl border border-accent/15 bg-[#0a0d17] overflow-hidden mb-6">
                        {/* Editor bar */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                            </div>
                            <span className="font-mono text-xs text-white/20">{activeFile ? activeFile.name : 'SKILL.md'}</span>
                            {/* Only show view toggle to logged-in users */}
                            {!isGuest && (
                                <div className="relative flex items-center rounded-lg bg-white/[0.04] border border-white/[0.06] p-0.5">
                                    <span
                                        className="absolute top-0.5 bottom-0.5 rounded-md bg-accent/20 shadow-sm transition-all duration-200 pointer-events-none"
                                        style={{
                                            left: viewMode === 'files' ? '2px' : viewMode === 'rendered' ? 'calc(33.33% + 0.67px)' : 'calc(66.67% - 0.67px)',
                                            width: 'calc(33.33% - 1.33px)'
                                        }}
                                    />
                                    <button title="Files" onClick={() => { setViewMode('files'); setActiveFile(null); setActiveContent(null) }} className={`relative z-10 p-1.5 rounded-md transition-colors duration-200 ${viewMode === 'files' ? 'text-accent' : 'text-white/30 hover:text-white/55'}`}>
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
                                    </button>
                                    <button title="Rendered" onClick={() => { setViewMode('rendered'); setActiveFile(null); setActiveContent(null) }} className={`relative z-10 p-1.5 rounded-md transition-colors duration-200 ${viewMode === 'rendered' ? 'text-accent' : 'text-white/30 hover:text-white/55'}`}>
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </button>
                                    <button title="Raw" onClick={() => { setViewMode('raw'); setActiveFile(null); setActiveContent(null) }} className={`relative z-10 p-1.5 rounded-md transition-colors duration-200 ${viewMode === 'raw' ? 'text-accent' : 'text-white/30 hover:text-white/55'}`}>
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ── Guest: blur paywall ── */}
                        {isGuest && hasMore ? (
                            <div className="relative">
                                {/* Preview */}
                                <div className="p-6 sm:p-8 pointer-events-none select-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>
                                        {preview}
                                    </ReactMarkdown>
                                </div>

                                {/* Blurred continuation */}
                                <div className="relative overflow-hidden max-h-32 pointer-events-none select-none">
                                    <div className="px-8 space-y-2.5 pb-4 opacity-30 blur-sm">
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} className={`h-3 bg-white/20 rounded-full ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-4/5' : 'w-3/5'}`} />
                                        ))}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0d17]/60 to-[#0a0d17]" />
                                </div>

                                {/* CTA overlay */}
                                <div className="relative px-6 pb-8 pt-2 flex flex-col items-center text-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-clash font-bold text-lg text-white mb-1">Sign in to read the full skill</p>
                                        <p className="font-satoshi text-sm text-white/40">Free account required to access the complete content.</p>
                                    </div>
                                    <button
                                        onClick={signIn}
                                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-navy font-satoshi font-bold text-sm hover:bg-[#6bbcff] hover:shadow-[0_0_24px_rgba(75,169,255,0.35)] transition-all duration-300"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" /></svg>
                                        Continue with Google
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Logged-in: full content
                            <>
                                {viewMode === 'files' && (
                                    <div className="p-4 font-mono text-[12px]">
                                        {/* Root folder */}
                                        <div className="flex items-center gap-1.5 px-2 py-1.5 text-violet-300/50">
                                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
                                            <span>{rawName}</span>
                                        </div>
                                        {skillFiles.length > 0 ? skillFiles.map((f) => (
                                            <div key={f.path}
                                                onClick={() => f.type !== 'dir' && handleFileClick(f)}
                                                className={`flex items-center gap-1.5 pl-7 pr-2 py-[5px] rounded transition-colors ${f.type !== 'dir' ? 'cursor-pointer hover:bg-white/[0.04]' : 'cursor-default'} ${activeFile?.path === f.path ? 'bg-accent/[0.07]' : ''}`}
                                            >
                                                {f.type === 'dir'
                                                    ? <svg className="w-3.5 h-3.5 shrink-0 text-violet-300/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
                                                    : <svg className="w-3.5 h-3.5 shrink-0 text-blue-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                                                }
                                                <span className={`flex-1 ${activeFile?.path === f.path ? 'text-accent' : f.type === 'dir' ? 'text-violet-300/50' : 'text-white/60'}`}>{f.name}</span>
                                                {f.size != null && <span className="text-[10px] text-white/15">{f.size}b</span>}
                                            </div>
                                        )) : (
                                            <div className="px-2 py-3 text-white/20">Loading files…</div>
                                        )}
                                    </div>
                                )}
                                {viewMode === 'rendered' && (
                                    <div className="p-6 sm:p-8">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>
                                            {content || ''}
                                        </ReactMarkdown>
                                    </div>
                                )}
                                {viewMode === 'raw' && (
                                    <div className="flex flex-col">
                                        {activeFile && (
                                            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.05] bg-white/[0.01] shrink-0">
                                                <button
                                                    onClick={() => { setViewMode('files'); setActiveFile(null); setActiveContent(null) }}
                                                    className="text-white/30 hover:text-accent transition-colors"
                                                    title="Back to files"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                                    </svg>
                                                </button>
                                                <span className="font-mono text-[11px] text-white/30">{activeFile.path.split('/').slice(-2).join(' / ')}</span>
                                                {fileLoading && (
                                                    <svg className="w-3 h-3 text-accent animate-spin ml-auto" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                    </svg>
                                                )}
                                            </div>
                                        )}
                                        <pre className="p-5 sm:p-6 text-sm font-mono text-white/70 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                                            {activeContent ?? content}
                                        </pre>
                                    </div>
                                )}
                            </>
                        )}

                    </div>
                </div>
            </main>

            {/* ── Toast ── */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9998] animate-fade-in-up pointer-events-none">
                    <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-navy border border-accent/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                        <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span className="font-satoshi text-sm text-white/80">{toast}</span>
                    </div>
                </div>
            )}
        </>
    )
}
