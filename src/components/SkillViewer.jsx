import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { File, Folder, Eye, Code2, FolderTree, ChevronLeft, Lock, AlertCircle } from 'lucide-react'
import { GoogleMark, Spinner } from './ui/primitives'

// Links in rendered skills open in a new tab; everything else is styled by .markdown-body
export const markdownComponents = {
    a: ({ href = '', children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
    img: ({ src, alt }) => <img src={src} alt={alt || ''} loading="lazy" />,
}

// Split leading YAML frontmatter into simple key/value pairs (no YAML dependency)
export function splitFrontmatter(md = '') {
    const m = /^﻿?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(md)
    if (!m) return { meta: null, body: md }
    const meta = []
    for (const raw of m[1].split(/\r?\n/)) {
        const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(raw)
        if (kv) meta.push([kv[1], kv[2].replace(/^[>|]-?\s*$/, '').replace(/^["']|["']$/g, '')])
        else if (meta.length && raw.trim()) {
            const last = meta[meta.length - 1]
            last[1] = `${last[1]} ${raw.trim().replace(/^- /, '')}`.trim()
        }
    }
    return { meta: meta.length ? meta : null, body: md.slice(m[0].length) }
}

export function Markdown({ children, className = '' }) {
    const { meta, body } = splitFrontmatter(String(children || ''))
    return (
        <div className={`markdown-body ${className}`}>
            {meta && (
                <table>
                    <thead>
                        <tr>{meta.map(([k]) => <th key={k}>{k}</th>)}</tr>
                    </thead>
                    <tbody>
                        <tr>{meta.map(([k, v]) => <td key={k} className="align-top"><div className="max-w-[48ch]">{v}</div></td>)}</tr>
                    </tbody>
                </table>
            )}
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{body}</ReactMarkdown>
        </div>
    )
}

function splitMarkdown(md = '') {
    const blocks = md.split(/\n{2,}/)
    return { preview: blocks.slice(0, 2).join('\n\n'), rest: blocks.slice(2).join('\n\n') }
}

function formatSize(n) {
    if (n == null) return ''
    if (n < 1024) return `${n} B`
    return `${(n / 1024).toFixed(1)} KB`
}

function Paywall({ markdown, onSignIn }) {
    const { preview } = splitMarkdown(markdown)
    return (
        <div>
            <div className="pointer-events-none select-none p-6">
                <Markdown>{preview}</Markdown>
            </div>
            <div className="relative max-h-28 overflow-hidden px-6" aria-hidden="true">
                <div className="space-y-2.5 opacity-60 blur-[3px]">
                    {[...Array(6)].map((_, i) => <div key={i} className={`h-3 rounded bg-neutral-subtle ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-4/5' : 'w-3/5'}`} />)}
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-canvas" />
            </div>
            <div className="flex flex-col items-center gap-3 border-t border-line-muted bg-canvas-subtle px-6 py-8 text-center">
                <Lock className="h-5 w-5 text-fg-muted" />
                <div>
                    <p className="font-sans text-base font-semibold">Sign in to read the full skill</p>
                    <p className="mt-1 text-sm text-fg-muted">A free account is required to view and copy complete skill files.</p>
                </div>
                <button type="button" onClick={onSignIn} className="btn">
                    <GoogleMark />
                    Continue with Google
                </button>
            </div>
        </div>
    )
}

const TABS = [
    { id: 'files', label: 'Files', icon: FolderTree },
    { id: 'rendered', label: 'Preview', icon: Eye },
    { id: 'raw', label: 'Code', icon: Code2 },
]

export default function SkillViewer({
    files = [],
    rootName = 'skill',
    loading = false,
    error = null,
    markdownContent = '',
    rawContent,
    initialTab = 'rendered',
    showTabs = true,
    locked = false,
    onLockedAction,
    onActiveContentChange,
    fetchFileContent,
    className = '',
    fill = false,
}) {
    const [activeTab, setActiveTab] = useState(initialTab)
    const [activeFile, setActiveFile] = useState(null)
    const [activeContent, setActiveContent] = useState(null)
    const [fileLoading, setFileLoading] = useState(false)
    const requestRef = useRef(0)

    const primaryContent = markdownContent || ''
    const visibleRaw = activeContent ?? rawContent ?? primaryContent
    const hasPaywall = locked && splitMarkdown(primaryContent).rest.trim().length > 0

    useEffect(() => {
        setActiveFile(null)
        setActiveContent(null)
        requestRef.current += 1
    }, [primaryContent])

    useEffect(() => {
        onActiveContentChange?.(visibleRaw)
    }, [onActiveContentChange, visibleRaw])

    const normalizedFiles = useMemo(() => {
        if (files.length > 0) return files
        if (!primaryContent) return []
        return [{ name: `${rootName}.md`, path: `${rootName}.md`, type: 'file', size: primaryContent.length, content: primaryContent }]
    }, [files, primaryContent, rootName])

    async function selectFile(file) {
        if (file.type === 'dir') return
        const requestId = ++requestRef.current
        setActiveFile(file)
        setActiveTab('raw')
        setActiveContent(file.content ?? null)
        if (!fetchFileContent || file.content != null) return
        setFileLoading(true)
        try {
            const text = await fetchFileContent(file)
            if (requestRef.current === requestId) setActiveContent(text)
        } catch {
            if (requestRef.current === requestId) setActiveContent(`// Could not load ${file.name}`)
        } finally {
            if (requestRef.current === requestId) setFileLoading(false)
        }
    }

    function switchTab(tab) {
        setActiveTab(tab)
        if (tab !== 'raw') {
            setActiveFile(null)
            setActiveContent(null)
            requestRef.current += 1
        }
    }

    const lines = activeTab === 'raw' ? String(visibleRaw).split('\n') : []
    const ready = !loading && !error && primaryContent && !hasPaywall

    return (
        <div className={`box overflow-hidden ${fill ? 'flex h-full flex-col' : ''} ${className}`}>
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line bg-canvas-subtle px-3 py-2">
                {showTabs && (
                    <div className="segmented" role="tablist" aria-label="Skill viewer tabs">
                        {TABS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === id}
                                aria-pressed={activeTab === id}
                                aria-label={`${id} view`}
                                title={label}
                                onClick={() => switchTab(id)}
                                className="inline-flex items-center gap-1.5"
                            >
                                <Icon className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{label}</span>
                            </button>
                        ))}
                    </div>
                )}
                <span className="min-w-0 truncate font-mono text-xs text-fg-muted">
                    {activeFile ? (activeFile.path || activeFile.name) : 'SKILL.md'}
                </span>
                {ready && activeTab === 'raw' && (
                    <span className="ml-auto hidden text-xs text-fg-muted sm:inline">
                        {lines.length} lines · {formatSize(String(visibleRaw).length)}
                    </span>
                )}
            </div>

            <div className={`bg-canvas ${fill ? 'min-h-0 flex-1 overflow-auto' : ''}`}>
                {loading && <div className="flex items-center justify-center py-20"><Spinner size={20} /></div>}

                {!loading && error && (
                    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                        <AlertCircle className="h-5 w-5 text-danger" />
                        <p className="text-sm text-fg-muted">{error}</p>
                    </div>
                )}

                {!loading && !error && !primaryContent && (
                    <div className="px-6 py-16 text-center text-sm text-fg-muted">No markdown content is available for this skill.</div>
                )}

                {!loading && !error && primaryContent && hasPaywall && <Paywall markdown={primaryContent} onSignIn={onLockedAction} />}

                {ready && activeTab === 'files' && (
                    <div role="list" className="text-sm">
                        <div className="flex items-center gap-2 border-b border-line-muted px-4 py-2 font-semibold">
                            <Folder className="h-4 w-4 text-accent" fill="currentColor" fillOpacity={0.2} />
                            {rootName}
                        </div>
                        {normalizedFiles.length > 0 ? normalizedFiles.map((file) => (
                            <button
                                key={file.path || file.name}
                                type="button"
                                disabled={file.type === 'dir'}
                                onClick={() => selectFile(file)}
                                className={`flex w-full items-center gap-2 border-b border-line-muted px-4 py-2 text-left last:border-b-0 ${file.type !== 'dir' ? 'hover:bg-canvas-subtle' : 'cursor-default'} ${activeFile?.path === file.path ? 'bg-accent-subtle' : ''}`}
                            >
                                {file.type === 'dir'
                                    ? <Folder className="h-4 w-4 shrink-0 text-accent" fill="currentColor" fillOpacity={0.2} />
                                    : <File className="h-4 w-4 shrink-0 text-fg-muted" />}
                                <span className={`flex-1 truncate ${file.type === 'dir' ? 'text-fg' : 'text-fg hover:text-accent hover:underline'}`}>{file.name}</span>
                                {file.size != null && <span className="text-xs text-fg-muted">{formatSize(file.size)}</span>}
                            </button>
                        )) : <div className="px-4 py-3 text-fg-muted">No files found.</div>}
                    </div>
                )}

                {ready && activeTab === 'rendered' && (
                    <div className="p-5 sm:p-8">
                        <Markdown>{primaryContent}</Markdown>
                    </div>
                )}

                {ready && activeTab === 'raw' && (
                    <div className="flex flex-col">
                        {activeFile && (
                            <div className="flex items-center gap-2 border-b border-line-muted px-3 py-1.5">
                                <button type="button" onClick={() => switchTab('files')} className="btn-invisible btn-icon btn-sm" title="Back to files" aria-label="Back to files">
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="truncate font-mono text-xs text-fg-muted">{activeFile.path || activeFile.name}</span>
                                {fileLoading && <Spinner size={12} className="ml-auto" />}
                            </div>
                        )}
                        <pre className="overflow-x-auto py-3 font-mono text-[12.5px] leading-5 text-fg">
                            <code className="table w-full">
                                {lines.map((line, i) => (
                                    <span key={i} className="table-row hover:bg-canvas-subtle">
                                        <span className="table-cell w-12 select-none pr-4 text-right text-fg-subtle">{i + 1}</span>
                                        <span className="table-cell whitespace-pre-wrap break-words pr-4">{line || ' '}</span>
                                    </span>
                                ))}
                            </code>
                        </pre>
                    </div>
                )}
            </div>
        </div>
    )
}
