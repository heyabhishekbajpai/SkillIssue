import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export const markdownComponents = {
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
    a: ({ href = '', children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-[#6bbcff] underline underline-offset-2 transition-colors">{children}</a>,
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
    img: ({ src, alt }) => <img src={src} alt={alt || ''} loading="lazy" className="max-w-full rounded-lg my-3" />,
}

function splitMarkdown(md = '') {
    const blocks = md.split(/\n{2,}/)
    return { preview: blocks.slice(0, 2).join('\n\n'), rest: blocks.slice(2).join('\n\n') }
}

function Spinner({ className = 'w-5 h-5' }) {
    return <svg role="status" aria-label="Loading" className={`${className} text-accent animate-spin`} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
}

function FileIcon({ type }) {
    if (type === 'dir') return <svg className="w-3.5 h-3.5 shrink-0 text-violet-300/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
    return <svg className="w-3.5 h-3.5 shrink-0 text-blue-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
}

function Paywall({ markdown, onSignIn }) {
    const { preview } = splitMarkdown(markdown)
    return (
        <div className="relative">
            <div className="p-6 sm:p-8 pointer-events-none select-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{preview}</ReactMarkdown>
            </div>
            <div className="relative overflow-hidden max-h-32 pointer-events-none select-none">
                <div className="px-8 space-y-2.5 pb-4 opacity-30 blur-sm">
                    {[...Array(6)].map((_, i) => <div key={i} className={`h-3 bg-white/20 rounded-full ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-4/5' : 'w-3/5'}`} />)}
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0d17]/60 to-[#0a0d17]" />
            </div>
            <div className="relative px-6 pb-8 pt-2 flex flex-col items-center text-center gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                </div>
                <div>
                    <p className="font-clash font-bold text-lg text-white mb-1">Sign in to read the full skill</p>
                    <p className="font-satoshi text-sm text-white/40">Free account required to access the complete content.</p>
                </div>
                <button type="button" onClick={onSignIn} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-navy font-satoshi font-bold text-sm hover:bg-[#6bbcff] hover:shadow-[0_0_24px_rgba(75,169,255,0.35)] transition-all duration-300">
                    Continue with Google
                </button>
            </div>
        </div>
    )
}

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

    return (
        <div className={`rounded-2xl border border-accent/15 bg-[#0a0d17] overflow-hidden ${fill ? 'flex flex-col h-full' : ''} ${className}`}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-2" aria-hidden="true"><div className="w-3 h-3 rounded-full bg-red-500/50" /><div className="w-3 h-3 rounded-full bg-yellow-500/50" /><div className="w-3 h-3 rounded-full bg-green-500/50" /></div>
                <span className="font-mono text-xs text-white/20 truncate px-3">{activeFile ? activeFile.name : 'SKILL.md'}</span>
                {showTabs && (
                    <div className="relative flex items-center rounded-lg bg-white/[0.04] border border-white/[0.06] p-0.5" role="tablist" aria-label="Skill viewer tabs">
                        <span aria-hidden="true" className="absolute top-0.5 bottom-0.5 rounded-md bg-accent/20 shadow-sm transition-all duration-200 pointer-events-none" style={{ left: activeTab === 'files' ? '2px' : activeTab === 'rendered' ? 'calc(33.33% + 0.67px)' : 'calc(66.67% - 0.67px)', width: 'calc(33.33% - 1.33px)' }} />
                        {['files', 'rendered', 'raw'].map((tab) => (
                            <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} aria-label={`${tab} view`} title={tab[0].toUpperCase() + tab.slice(1)} onClick={() => switchTab(tab)} className={`relative z-10 p-1.5 rounded-md transition-colors duration-200 ${activeTab === tab ? 'text-accent' : 'text-white/30 hover:text-white/55'}`}>
                                {tab === 'files' && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>}
                                {tab === 'rendered' && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                                {tab === 'raw' && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className={`${fill ? 'flex-1 overflow-hidden flex flex-col' : ''}`}>
                {loading && <div className="flex items-center justify-center py-20"><Spinner /></div>}
                {!loading && error && <div className="flex flex-col items-center justify-center py-20 gap-3 text-center"><div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center"><svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg></div><p className="font-satoshi text-sm text-white/40">{error}</p></div>}
                {!loading && !error && !primaryContent && <div className="flex items-center justify-center py-16 px-6 text-center font-satoshi text-sm text-white/30">No markdown content is available for this skill.</div>}
                {!loading && !error && primaryContent && hasPaywall && <Paywall markdown={primaryContent} onSignIn={onLockedAction} />}
                {!loading && !error && primaryContent && !hasPaywall && activeTab === 'files' && (
                    <div className={`p-4 font-mono text-[12px] modal-view-enter overflow-y-auto styled-scrollbar ${fill ? 'flex-1' : ''}`}>
                        <div className="flex items-center gap-1.5 px-2 py-1.5 text-violet-300/50"><FileIcon type="dir" /><span>{rootName}</span></div>
                        {normalizedFiles.length > 0 ? normalizedFiles.map((file) => (
                            <button key={file.path || file.name} type="button" disabled={file.type === 'dir'} onClick={() => selectFile(file)} className={`flex items-center gap-1.5 pl-7 pr-2 py-[5px] w-full rounded text-left transition-colors ${file.type !== 'dir' ? 'cursor-pointer hover:bg-white/[0.04]' : 'cursor-default'} ${activeFile?.path === file.path ? 'bg-accent/[0.07]' : ''}`}>
                                <FileIcon type={file.type} /><span className={`flex-1 truncate ${activeFile?.path === file.path ? 'text-accent' : file.type === 'dir' ? 'text-violet-300/50' : 'text-white/60'}`}>{file.name}</span>{file.size != null && <span className="text-[10px] text-white/15">{file.size}b</span>}
                            </button>
                        )) : <div className="px-2 py-3 text-white/20">No files found.</div>}
                    </div>
                )}
                {!loading && !error && primaryContent && !hasPaywall && activeTab === 'rendered' && (
                    <div className={`p-6 sm:p-8 overflow-y-auto styled-scrollbar modal-view-enter ${fill ? 'flex-1' : ''}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{primaryContent}</ReactMarkdown>
                    </div>
                )}
                {!loading && !error && primaryContent && !hasPaywall && activeTab === 'raw' && (
                    <div className={`flex flex-col modal-view-enter ${fill ? 'flex-1 min-h-0' : ''}`}>
                        {activeFile && <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.05] bg-white/[0.01] shrink-0"><button type="button" onClick={() => switchTab('files')} className="text-white/30 hover:text-accent transition-colors" title="Back to files" aria-label="Back to files"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg></button><span className="font-mono text-[11px] text-white/30 truncate">{activeFile.path || activeFile.name}</span>{fileLoading && <Spinner className="w-3 h-3 ml-auto" />}</div>}
                        <pre className={`p-5 sm:p-6 text-sm font-mono text-white/70 whitespace-pre-wrap overflow-x-auto leading-relaxed overflow-y-auto styled-scrollbar ${fill ? 'flex-1' : ''}`}>{visibleRaw}</pre>
                    </div>
                )}
            </div>
        </div>
    )
}
