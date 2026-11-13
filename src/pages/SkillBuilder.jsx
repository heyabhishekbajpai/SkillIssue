import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import TextareaAutosize from 'react-textarea-autosize'
import {
    Wand2, Upload, ImagePlus, X, Copy, Check, Download, Bookmark, Lock, Globe, Eye, Code2,
    FileText, Sparkles, CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { saveSkill } from '../lib/skillService'
import { invalidateProfileCache } from '../lib/profileCache'
import { submitTestimonial } from '../lib/userService'
import SEO, { jsonLdSchemas } from '../components/SEO'
import ToastBanner from '../components/Toast'
import SaveModal from '../components/SaveSkillModal'
import { Markdown } from '../components/SkillViewer'
import { PageHeader, Spinner } from '../components/ui/primitives'

// ── Generating placeholder ──────────────────────────
function LoadingState() {
    return (
        <div className="p-6" aria-busy="true">
            <div className="mb-6 flex items-center gap-2 text-sm text-fg-muted">
                <Spinner size={14} />
                Generating a structured skill file from your description…
            </div>
            <div className="space-y-3">
                {[100, 85, 92, 60, 88, 75, 95, 50, 80, 70].map((width, i) => (
                    <div key={i} className="skeleton-line h-3" style={{ width: `${width}%`, animationDelay: `${i * 0.1}s` }} />
                ))}
            </div>
        </div>
    )
}

// Adapter keeping the old Toast({ message, onClose }) signature used by this page
function Toast({ message, onClose }) {
    const isError = /fail|error|wrong/i.test(message || '')
    return <ToastBanner message={message} onDismiss={onClose} duration={3500} variant={isError ? 'error' : 'success'} />
}

// ── First-skill testimonial prompt ─────────────────
function TestimonialModal({ onClose, authUser }) {
    const [body, setBody] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    async function handleSubmit() {
        if (!body.trim()) return
        setSubmitting(true)
        try {
            await submitTestimonial({
                name: authUser.user_metadata?.full_name || authUser.name || 'Anonymous',
                username: authUser.name ? authUser.name.replace(/\s+/g, '').toLowerCase() : 'user',
                body: body.trim(),
                img: authUser.avatar_url || 'https://avatar.vercel.sh/user',
            })
            setSubmitted(true)
            setTimeout(onClose, 2000)
        } catch (err) {
            console.error(err)
            onClose()
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div role="dialog" aria-modal="true" aria-labelledby="first-skill-title" className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-line-muted px-4 py-3">
                    <h3 id="first-skill-title" className="font-sans text-sm font-semibold">You built your first skill</h3>
                    <button type="button" onClick={onClose} className="btn-invisible btn-icon btn-sm" aria-label="Close"><X className="h-4 w-4" /></button>
                </div>
                {submitted ? (
                    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                        <CheckCircle2 className="h-6 w-6 text-success" />
                        <p className="font-semibold">Thank you!</p>
                        <p className="text-sm text-fg-muted">Your review has been submitted.</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2 p-4">
                            <label htmlFor="testimonial-body" className="text-sm text-fg-muted">
                                What do you think of Skill Issue so far? Reviews may be featured on the homepage.
                            </label>
                            <textarea
                                id="testimonial-body"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Share your experience…"
                                rows={4}
                                className="input resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-2 border-t border-line-muted bg-canvas-subtle px-4 py-3">
                            <button type="button" onClick={onClose} className="btn">Skip for now</button>
                            <button type="button" onClick={handleSubmit} disabled={submitting || !body.trim()} className="btn-primary">
                                {submitting ? 'Submitting…' : 'Submit review'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════
//  MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════
export default function SkillBuilder() {
    const { isLoggedIn, openAuthModal, user: authUser, profile: authProfile } = useAuth()

    // Form state
    const [skillName, setSkillName] = useState('')
    const [description, setDescription] = useState('')

    // Reference state
    const [referenceImages, setReferenceImages] = useState([]) // [{ base64DataUri, fileName, id }]

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedMarkdown, setGeneratedMarkdown] = useState('')
    const [showOutput, setShowOutput] = useState(false)

    // UI state
    const [showSaveModal, setShowSaveModal] = useState(false)
    const [toast, setToast] = useState(null)
    const [pendingGenerate, setPendingGenerate] = useState(false)
    const [copied, setCopied] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [savedAs, setSavedAs] = useState(null) // null | 'public' | 'private'
    const [refinementInstruction, setRefinementInstruction] = useState('')
    const [isRefining, setIsRefining] = useState(false)
    const [viewMode, setViewMode] = useState('rendered') // 'rendered' | 'raw'
    const [showTestimonialModal, setShowTestimonialModal] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [globalDragActive, setGlobalDragActive] = useState(false)

    const outputRef = useRef(null)
    const fileInputRef = useRef(null)

    // If user just signed in and had a pending generation, trigger it
    useEffect(() => {
        if (isLoggedIn && pendingGenerate) {
            setPendingGenerate(false)
            handleGenerate()
        }
    }, [isLoggedIn, pendingGenerate])

    // Global drag and drop handlers
    useEffect(() => {
        const handleGlobalDragEnter = (e) => {
            e.preventDefault()
            e.stopPropagation()

            // Check if dragging files
            if (e.dataTransfer?.items) {
                for (let item of e.dataTransfer.items) {
                    if (item.kind === 'file') {
                        setGlobalDragActive(true)
                        break
                    }
                }
            }
        }

        const handleGlobalDragLeave = (e) => {
            e.preventDefault()
            e.stopPropagation()
            // Only deactivate if leaving the window
            if (e.clientX === 0 && e.clientY === 0) {
                setGlobalDragActive(false)
            }
        }

        const handleGlobalDragOver = (e) => {
            e.preventDefault()
            e.stopPropagation()
        }

        const handleGlobalDrop = (e) => {
            e.preventDefault()
            e.stopPropagation()
            setGlobalDragActive(false)

            const files = e.dataTransfer.files
            if (files && files.length > 0) {
                // Create a synthetic event to pass to handleImageSelect
                handleImageSelect({ target: { files } })
            }
        }

        document.addEventListener('dragenter', handleGlobalDragEnter)
        document.addEventListener('dragleave', handleGlobalDragLeave)
        document.addEventListener('dragover', handleGlobalDragOver)
        document.addEventListener('drop', handleGlobalDrop)

        return () => {
            document.removeEventListener('dragenter', handleGlobalDragEnter)
            document.removeEventListener('dragleave', handleGlobalDragLeave)
            document.removeEventListener('dragover', handleGlobalDragOver)
            document.removeEventListener('drop', handleGlobalDrop)
        }
    }, [])

    // Convert uploaded files to base64 and append to the list
    function handleImageSelect(e) {
        const files = Array.from(e.target.files || [])
        if (!files.length) return
        files.forEach((file) => {
            const reader = new FileReader()
            reader.onload = (ev) => {
                setReferenceImages((prev) => [
                    ...prev,
                    { base64DataUri: ev.target.result, fileName: file.name, id: `${file.name}-${Date.now()}-${Math.random()}` },
                ])
            }
            reader.readAsDataURL(file)
        })
        // Reset so the same files can be re-selected after removal
        e.target.value = ''
    }

    function removeReferenceImage(id) {
        setReferenceImages((prev) => prev.filter((img) => img.id !== id))
    }

    // Drag and drop handlers for reference images
    function handleDragEnter(e) {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(true)
    }

    function handleDragLeave(e) {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
    }

    function handleDragOver(e) {
        e.preventDefault()
        e.stopPropagation()
    }

    function handleDrop(e) {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        const files = e.dataTransfer.files
        if (files && files.length > 0) {
            handleImageSelect({ target: { files } })
        }
    }

    async function handleGenerate() {
        if (!skillName.trim() || !description.trim()) return

        if (!isLoggedIn) {
            setPendingGenerate(true)
            openAuthModal()
            return
        }

        setIsGenerating(true)
        setShowOutput(false)
        setGeneratedMarkdown('')
        setRefinementInstruction('')

        try {
            const payload = {
                skillName: skillName.trim(),
                description: description.trim(),
            }
            if (referenceImages.length > 0) payload.images = referenceImages.map((img) => img.base64DataUri)

            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()

            if (!res.ok) {
                setToast(data.error || 'Something went wrong. Please try again.')
                setIsGenerating(false)
                return
            }

            setGeneratedMarkdown(data.markdown)
            setIsGenerating(false)
            setShowOutput(true)
            setSavedAs(null)   // reset saved state for each new generation
            setViewMode('rendered')

            // Scroll to output
            setTimeout(() => {
                outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 100)
        } catch (err) {
            setToast('Network error. Please check your connection.')
            setIsGenerating(false)
        }
    }

    async function handleRefine() {
        if (!refinementInstruction.trim() || isRefining) return

        setIsRefining(true)

        try {
            const payload = {
                skillName: skillName.trim(),
                previousMarkdown: generatedMarkdown,
                refinementInstruction: refinementInstruction.trim(),
            }
            if (referenceImages.length > 0) payload.images = referenceImages.map((img) => img.base64DataUri)

            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()

            if (!res.ok) {
                setToast(data.error || 'Something went wrong. Please try again.')
                setIsRefining(false)
                return
            }

            setGeneratedMarkdown(data.markdown)
            setRefinementInstruction('') // Clear refinement input after success
            setIsRefining(false)
            setToast('Skill refined')

            // Scroll to output
            setTimeout(() => {
                outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 100)
        } catch (err) {
            setToast('Network error. Please check your connection.')
            setIsRefining(false)
        }
    }

    function handleSignInFromModal() {
        openAuthModal()
    }

    function handleCopy() {
        navigator.clipboard.writeText(generatedMarkdown)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        setToast('Copied to clipboard')
    }

    function handleDownload() {
        const blob = new Blob([generatedMarkdown], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${skillName.trim().toLowerCase().replace(/\s+/g, '-')}.md`
        a.click()
        URL.revokeObjectURL(url)
        setToast('Downloaded')
    }

    async function handleSave(visibility) {
        setShowSaveModal(false)
        setIsSaving(true)
        try {
            const result = await saveSkill({
                title: skillName.trim(),
                content: generatedMarkdown,
                tags: [],
                visibility,
            })
            setSavedAs(visibility)
            invalidateProfileCache(authProfile?.username)
            setToast(`Skill saved as ${visibility}`)

            if (result.isFirstSkill) {
                setShowTestimonialModal(true)
            }
        } catch (err) {
            console.error('Save error:', err)
            setToast(err.message || 'Failed to save.')
        } finally {
            setIsSaving(false)
        }
    }

    const canSubmit = skillName.trim().length > 0 && description.trim().length > 0
    const canRefine = refinementInstruction.trim().length > 0 && !isRefining

    const fileSlug = (skillName.trim().toLowerCase().replace(/\s+/g, '-') || 'skill')

    return (
        <div className="container-page py-8">
            <SEO
                title="Build Custom AI Skill Files — AI Skill Builder"
                description="Create custom AI skill files in seconds. Describe what you want your AI to do, and our builder generates a ready-to-use .md skill file for Claude, ChatGPT, Gemini, Cursor and more."
                path="/build"
                jsonLd={jsonLdSchemas.breadcrumb([
                    { name: 'Home', url: '/' },
                    { name: 'Skill Builder', url: '/build' },
                ])}
            />

            {/* Window-level drag & drop hint */}
            {globalDragActive && (
                <div className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center bg-[rgb(var(--shadow)/0.55)] p-6">
                    <div className="rounded-xl border-2 border-dashed border-accent bg-canvas px-10 py-12 text-center shadow-overlay">
                        <ImagePlus className="mx-auto h-8 w-8 text-accent" />
                        <p className="mt-3 font-display text-xl font-semibold">Drop images to add them as references</p>
                        <p className="mt-1 text-sm text-fg-muted">JPG, PNG or WEBP · multiple files supported</p>
                    </div>
                </div>
            )}

            <PageHeader
                title="Create a new skill"
                description="Describe what you want your agent to do. The builder drafts a complete SKILL.md you can refine, edit and publish."
                actions={<Link to="/upload" className="btn"><Upload className="h-4 w-4" />Upload a file instead</Link>}
            />

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                {/* ── Form ─────────────────────────── */}
                <div className="min-w-0 space-y-5">
                    <p className="text-xs italic text-fg-muted">Required fields are marked with an asterisk (*).</p>

                    <div>
                        <label htmlFor="sb-name" className="form-label">Skill name <span className="text-danger">*</span></label>
                        <input
                            id="sb-name"
                            type="text"
                            value={skillName}
                            onChange={(e) => setSkillName(e.target.value)}
                            placeholder="e.g. Blog Post Writer, Study Buddy, Brand Designer"
                            className="input"
                        />
                        {skillName.trim() && (
                            <p className="form-hint">Saved as <code className="font-mono text-fg">{fileSlug}.md</code></p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="sb-desc" className="form-label">What should this skill do? <span className="text-danger">*</span></label>
                        <textarea
                            id="sb-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={'Describe the task in detail: who it is for, the tone, rules to follow and the output you expect.\n\nFor example: “Write blog posts in a conversational, friendly tone…”'}
                            rows={showOutput ? 5 : 8}
                            className="input resize-y"
                        />
                        <p className="form-hint">The more specific you are, the better the generated skill.</p>
                    </div>

                    <div>
                        <div className="mb-1.5 flex items-center gap-2">
                            <span className="form-label mb-0">Reference images</span>
                            <span className="label">Optional</span>
                        </div>
                        <div
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            className={`rounded-md border border-dashed p-3 transition-colors ${dragActive ? 'border-accent bg-accent-subtle' : 'border-line'}`}
                        >
                            {referenceImages.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {referenceImages.map((img) => (
                                        <div key={img.id} className="group relative">
                                            <img src={img.base64DataUri} alt={img.fileName} loading="lazy" className="h-16 w-16 rounded-md object-cover ring-1 ring-line" />
                                            <button
                                                type="button"
                                                onClick={() => removeReferenceImage(img.id)}
                                                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-line bg-canvas text-fg-muted shadow hover:text-danger"
                                                aria-label={`Remove ${img.fileName}`}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-line text-fg-muted hover:border-accent hover:text-accent"
                                        title="Add more images"
                                        aria-label="Add more images"
                                    >
                                        <ImagePlus className="h-5 w-5" />
                                    </button>
                                </div>
                            ) : (
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full flex-col items-center gap-1 py-4 text-sm text-fg-muted hover:text-fg">
                                    <ImagePlus className="h-5 w-5" />
                                    <span>{dragActive ? 'Drop images here' : <>Drag images here or <span className="link">browse</span></>}</span>
                                    <span className="text-xs">Screenshots or designs the skill should reproduce · JPG, PNG, WEBP</span>
                                </button>
                            )}
                            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" multiple className="hidden" onChange={handleImageSelect} />
                        </div>
                    </div>

                    <div className="border-t border-line-muted pt-5">
                        <button type="button" onClick={handleGenerate} disabled={!canSubmit || isGenerating} className="btn-primary btn-lg w-full sm:w-auto">
                            {isGenerating ? <Spinner size={14} className="text-brand-fg" /> : <Wand2 className="h-4 w-4" />}
                            {isGenerating ? 'Generating…' : showOutput ? 'Regenerate skill' : 'Generate skill'}
                        </button>
                        {!isLoggedIn && <p className="form-hint">You’ll be asked to sign in before generating.</p>}
                    </div>

                    {showOutput && (
                        <div className="box p-4">
                            <label htmlFor="sb-refine" className="form-label flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-done" />Refine with AI
                            </label>
                            <TextareaAutosize
                                id="sb-refine"
                                value={refinementInstruction}
                                onChange={(e) => setRefinementInstruction(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleRefine() }}
                                placeholder="e.g. Make the tone more professional and add an edge case for empty input"
                                minRows={2}
                                maxRows={6}
                                className="input resize-none"
                            />
                            <div className="mt-2 flex justify-end">
                                <button type="button" onClick={handleRefine} disabled={!canRefine} className="btn btn-sm">
                                    {isRefining && <Spinner size={12} />}
                                    {isRefining ? 'Refining…' : 'Apply refinement'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Output ───────────────────────── */}
                <div ref={outputRef} className="min-w-0 scroll-mt-20 lg:sticky lg:top-20 lg:self-start">
                    <div className="box flex flex-col overflow-hidden lg:h-[calc(100vh-7.5rem)]">
                        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line bg-canvas-subtle px-3 py-2">
                            <div className="segmented" role="tablist" aria-label="Output view">
                                <button type="button" role="tab" aria-selected={viewMode === 'rendered'} aria-pressed={viewMode === 'rendered'} onClick={() => setViewMode('rendered')} disabled={!showOutput} className="inline-flex items-center gap-1.5">
                                    <Eye className="h-3.5 w-3.5" />Preview
                                </button>
                                <button type="button" role="tab" aria-selected={viewMode === 'raw'} aria-pressed={viewMode === 'raw'} onClick={() => setViewMode('raw')} disabled={!showOutput} className="inline-flex items-center gap-1.5">
                                    <Code2 className="h-3.5 w-3.5" />Edit
                                </button>
                            </div>
                            <span className="truncate font-mono text-xs text-fg-muted">{fileSlug}.md</span>
                            {showOutput && (
                                <div className="ml-auto flex items-center gap-1.5">
                                    <button type="button" onClick={handleCopy} className="btn btn-sm" title="Copy markdown">
                                        {copied ? <Check className="h-3.5 w-3.5 !text-success" /> : <Copy className="h-3.5 w-3.5" />}
                                        <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                                    </button>
                                    <button type="button" onClick={handleDownload} className="btn btn-sm" title="Download .md">
                                        <Download className="h-3.5 w-3.5" /><span className="hidden sm:inline">Download</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => savedAs ? null : setShowSaveModal(true)}
                                        disabled={isSaving || !!savedAs}
                                        className="btn-primary btn-sm"
                                    >
                                        {isSaving ? <Spinner size={12} className="text-brand-fg" /> : savedAs ? <Check className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                                        {isSaving ? 'Saving…' : savedAs ? `Saved (${savedAs})` : 'Save'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="min-h-[320px] flex-1 overflow-y-auto bg-canvas">
                            {isGenerating && <LoadingState />}

                            {!isGenerating && !showOutput && (
                                <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 px-8 text-center">
                                    <FileText className="h-6 w-6 text-fg-muted" strokeWidth={1.5} />
                                    <p className="font-semibold">Your skill will appear here</p>
                                    <p className="max-w-xs text-sm text-fg-muted">Fill in the name and description, then select Generate skill.</p>
                                </div>
                            )}

                            {!isGenerating && showOutput && viewMode === 'rendered' && (
                                <div className="p-5 sm:p-8"><Markdown>{generatedMarkdown}</Markdown></div>
                            )}

                            {!isGenerating && showOutput && viewMode === 'raw' && (
                                <textarea
                                    value={generatedMarkdown}
                                    onChange={(e) => setGeneratedMarkdown(e.target.value)}
                                    aria-label="Skill markdown"
                                    spellCheck={false}
                                    className="skill-editor h-full min-h-[480px] resize-none"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showSaveModal && <SaveModal onClose={() => setShowSaveModal(false)} onSave={handleSave} />}
            {toast && <Toast message={toast} onClose={() => setToast(null)} />}
            {showTestimonialModal && <TestimonialModal onClose={() => setShowTestimonialModal(false)} authUser={authUser} />}
        </div>
    )
}
