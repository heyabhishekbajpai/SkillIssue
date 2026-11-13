import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileUp, FileText, X, CheckCircle2, AlertTriangle, Pencil, Eye, Code2, Wand2, RotateCcw, Upload } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { saveSkill } from '../lib/skillService'
import { invalidateProfileCache } from '../lib/profileCache'
import { submitTestimonial } from '../lib/userService'
import { parseSkillFile, validateSkillFile } from '../lib/parseSkillFile'
import SEO, { jsonLdSchemas } from '../components/SEO'
import ToastBanner from '../components/Toast'
import SaveModal from '../components/SaveSkillModal'
import { Markdown } from '../components/SkillViewer'
import { PageHeader, Spinner } from '../components/ui/primitives'

function Toast({ message, onClose }) {
    return <ToastBanner message={message} onDismiss={onClose} duration={3000} variant="success" />
}

function ErrorToast({ message, onClose }) {
    return <ToastBanner message={message} onDismiss={onClose} duration={4500} variant="error" />
}

// ── Success dialog (with optional first-skill feedback) ─────────
function SuccessModal({ onClose, isFirstSkill, authUser }) {
    const [showTestimonial, setShowTestimonial] = useState(false)
    const [testimonialBody, setTestimonialBody] = useState('')
    const [submittingTestimonial, setSubmittingTestimonial] = useState(false)

    async function handleTestimonialSubmit() {
        if (!testimonialBody.trim()) return
        setSubmittingTestimonial(true)
        try {
            await submitTestimonial({
                name: authUser.user_metadata?.full_name || authUser.name || 'Anonymous',
                username: authUser.name ? authUser.name.replace(/\s+/g, '').toLowerCase() : 'user',
                body: testimonialBody.trim(),
                img: authUser.avatar_url || 'https://avatar.vercel.sh/user',
            })
            setTimeout(() => {
                setSubmittingTestimonial(false)
                onClose()
            }, 1500)
        } catch (err) {
            console.error(err)
            setSubmittingTestimonial(false)
            onClose()
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div role="dialog" aria-modal="true" aria-labelledby="upload-success-title" className="modal-card max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-line-muted px-4 py-3">
                    <h3 id="upload-success-title" className="font-sans text-sm font-semibold">{showTestimonial ? 'Share your feedback' : 'Skill uploaded'}</h3>
                    <button type="button" onClick={onClose} className="btn-invisible btn-icon btn-sm" aria-label="Close"><X className="h-4 w-4" /></button>
                </div>
                {showTestimonial ? (
                    <>
                        <div className="space-y-2 p-4">
                            <label htmlFor="upload-feedback" className="text-sm text-fg-muted">What do you think of Skill Issue so far?</label>
                            <textarea id="upload-feedback" value={testimonialBody} onChange={(e) => setTestimonialBody(e.target.value)} rows={4} className="input resize-none" placeholder="Share your experience…" />
                        </div>
                        <div className="flex justify-end gap-2 border-t border-line-muted bg-canvas-subtle px-4 py-3">
                            <button type="button" onClick={onClose} className="btn">Skip for now</button>
                            <button type="button" onClick={handleTestimonialSubmit} disabled={submittingTestimonial || !testimonialBody.trim()} className="btn-primary">
                                {submittingTestimonial ? 'Submitting…' : 'Submit review'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
                            <CheckCircle2 className="h-6 w-6 text-success" />
                            <p className="font-semibold">Your skill has been saved</p>
                            <p className="text-sm text-fg-muted">You can find it on your profile.</p>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-line-muted bg-canvas-subtle px-4 py-3">
                            {isFirstSkill && <button type="button" onClick={() => setShowTestimonial(true)} className="btn">Share feedback</button>}
                            <button type="button" onClick={onClose} className="btn-primary">Done</button>
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
export default function SkillUploader() {
    const { isLoggedIn, openAuthModal, user: authUser, profile: authProfile, refreshProfile } = useAuth()

    // Upload state
    const [selectedFile, setSelectedFile] = useState(null)
    const [fileContent, setFileContent] = useState('')
    const [parseError, setParseError] = useState('')
    const [validationErrors, setValidationErrors] = useState([])
    const [validationWarnings, setValidationWarnings] = useState([])

    // Extracted skill data
    const [extractedSkill, setExtractedSkill] = useState(null)
    const [editMode, setEditMode] = useState(false)

    // UI state
    const [step, setStep] = useState('upload') // 'upload' | 'preview' | 'save'
    const [toast, setToast] = useState(null)
    const [errorToast, setErrorToast] = useState(null)
    const [isSaving, setIsSaving] = useState(false)
    const [showSaveModal, setShowSaveModal] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [globalDragActive, setGlobalDragActive] = useState(false)
    const [viewMode, setViewMode] = useState('rendered') // 'rendered' | 'raw'
    const [dragActive, setDragActive] = useState(false)

    const fileInputRef = useRef(null)
    const stepRef = useRef(step)
    stepRef.current = step
    const processFileRef = useRef(null)

    // Global drag and drop handlers
    useEffect(() => {
        const handleGlobalDragEnter = (e) => {
            e.preventDefault()
            e.stopPropagation()

            // Check if dragging files — only show overlay during upload step
            if (e.dataTransfer?.items && stepRef.current === 'upload') {
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
            if (files && files.length > 0 && stepRef.current === 'upload') {
                processFileRef.current?.(files[0])
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

    // Drag and drop handlers
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
        setGlobalDragActive(false)
        if (!isLoggedIn) {
            openAuthModal()
            setDragActive(false)
            return
        }
        setDragActive(false)

        const files = e.dataTransfer.files
        if (files && files.length > 0) {
            processFile(files[0])
        }
    }

    // Handle file selection
    function handleFileSelect(e) {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        const file = files[0]
        processFile(file)
        e.target.value = ''
    }

    // Process uploaded file
    // Keep ref in sync so global drop handler always uses latest function
    processFileRef.current = processFile

    function processFile(file) {
        setParseError('')
        setValidationErrors([])
        setValidationWarnings([])
        setEditMode(false)

        // Read file
        const reader = new FileReader()
        reader.onload = (ev) => {
            const content = ev.target.result

            // Validate
            const validation = validateSkillFile(file, content)
            setValidationErrors(validation.errors)
            setValidationWarnings(validation.warnings)

            if (validation.errors.length > 0) {
                setErrorToast(validation.errors[0])
                setSelectedFile(null)
                setFileContent('')
                return
            }

            // Parse
            try {
                const parsed = parseSkillFile(content, file.name)
                setExtractedSkill(parsed)
                setSelectedFile(file)
                setFileContent(content)
                setStep('preview')
                setToast('File parsed')
            } catch (err) {
                setErrorToast('Failed to parse file: ' + err.message)
                setSelectedFile(null)
            }
        }

        reader.onerror = () => {
            setErrorToast('Failed to read file')
        }

        reader.readAsText(file)
    }

    // Handle skill save
    async function handleSave(visibility) {
        setShowSaveModal(false)
        setIsSaving(true)

        if (!isLoggedIn) {
            openAuthModal()
            setIsSaving(false)
            return
        }

        try {
            const skillData = editMode ? extractedSkill : extractedSkill
            const result = await saveSkill({
                title: skillData.title,
                content: skillData.content,
                tags: skillData.tags || [],
                visibility,
                description: skillData.description || '',
                category: skillData.category || ''
            })

            invalidateProfileCache(authProfile?.username)
            await refreshProfile()

            setToast(`Skill saved as ${visibility}`)
            setShowSuccessModal(true)
            setIsSaving(false)

            // Reset form
            setTimeout(() => {
                setSelectedFile(null)
                setFileContent('')
                setExtractedSkill(null)
                setStep('upload')
                setEditMode(false)
            }, 2000)
        } catch (err) {
            console.error('Save error:', err)
            setErrorToast(err.message || 'Failed to save skill')
            setIsSaving(false)
        }
    }

    // Update edited skill fields
    function updateSkillField(field, value) {
        setExtractedSkill(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const canSave = extractedSkill && extractedSkill.title && extractedSkill.title.trim().length > 0

    function chooseFile() {
        if (!isLoggedIn) { openAuthModal(); return }
        fileInputRef.current?.click()
    }

    function resetUpload() {
        setStep('upload')
        setSelectedFile(null)
        setExtractedSkill(null)
        setEditMode(false)
    }

    return (
        <div className="container-page max-w-[1100px] py-8">
            <SEO
                title="Upload Skill Files — Skill Issue Marketplace"
                description="Upload pre-written SKILL.md files directly to Skill Issue. Share your skills with the community or keep them private."
                path="/upload"
                jsonLd={jsonLdSchemas.breadcrumb([
                    { name: 'Home', url: '/' },
                    { name: 'Upload Skill', url: '/upload' },
                ])}
            />

            {globalDragActive && (
                <div className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center bg-[rgb(var(--shadow)/0.55)] p-6">
                    <div className="rounded-xl border-2 border-dashed border-accent bg-canvas px-10 py-12 text-center shadow-overlay">
                        <FileUp className="mx-auto h-8 w-8 text-accent" />
                        <p className="mt-3 font-display text-xl font-semibold">Drop your SKILL.md to upload</p>
                        <p className="mt-1 text-sm text-fg-muted">Markdown files up to 5 MB</p>
                    </div>
                </div>
            )}

            <PageHeader
                title="Upload a skill"
                description="Already have a SKILL.md? Upload it and it will be validated, parsed and ready to publish."
                actions={<Link to="/build" className="btn"><Wand2 className="h-4 w-4" />Build with AI instead</Link>}
            />

            {/* Steps */}
            <ol className="mt-4 flex items-center gap-2 text-sm" aria-label="Progress">
                {[['upload', 'Choose file'], ['preview', 'Review and publish']].map(([id, label], i) => {
                    const done = id === 'upload' && step === 'preview'
                    const current = step === id
                    return (
                        <li key={id} className="flex items-center gap-2">
                            {i > 0 && <span className="h-px w-6 bg-line" aria-hidden="true" />}
                            <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${done ? 'border-success bg-success-emphasis text-fg-onemphasis' : current ? 'border-accent text-accent' : 'border-line text-fg-muted'}`}>
                                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                            </span>
                            <span className={current ? 'font-semibold' : 'text-fg-muted'} aria-current={current ? 'step' : undefined}>{label}</span>
                        </li>
                    )
                })}
            </ol>

            <input ref={fileInputRef} type="file" accept=".md" onChange={handleFileSelect} className="hidden" />

            {step === 'upload' && (
                <div
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={chooseFile}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chooseFile() } }}
                    className={`mt-6 flex cursor-pointer flex-col items-center rounded-md border-2 border-dashed px-6 py-16 text-center transition-colors ${dragActive ? 'border-accent bg-accent-subtle' : 'border-line hover:border-fg-subtle hover:bg-canvas-subtle'}`}
                >
                    <FileUp className="h-8 w-8 text-fg-muted" strokeWidth={1.5} />
                    <h2 className="mt-4 font-display text-xl font-semibold">Drag your SKILL.md here</h2>
                    <p className="mt-1 text-sm text-fg-muted">or <span className="link">choose a file</span> from your computer · Markdown, max 5 MB</p>
                    <button type="button" onClick={(e) => { e.stopPropagation(); chooseFile() }} className="btn mt-6">
                        <Upload className="h-4 w-4" />Choose file
                    </button>
                    <p className="mt-6 text-xs text-fg-muted">YAML frontmatter (name, description, tags) is detected automatically.</p>
                </div>
            )}

            {step === 'preview' && extractedSkill && (
                <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
                    {/* Details */}
                    <div className="min-w-0 space-y-4">
                        <div className="box">
                            <div className="box-header py-2.5">
                                <FileText className="h-4 w-4 text-fg-muted" />
                                <span className="min-w-0 flex-1 truncate font-mono text-sm">{selectedFile?.name || 'SKILL.md'}</span>
                                {!editMode && (
                                    <button type="button" onClick={() => setEditMode(true)} className="btn btn-sm">
                                        <Pencil className="h-3.5 w-3.5" />Edit details
                                    </button>
                                )}
                            </div>

                            {validationWarnings.length > 0 && (
                                <div className="flash flash-warn m-4 mb-0 flex gap-2 text-xs">
                                    <AlertTriangle className="h-4 w-4 shrink-0 text-attention" />
                                    <ul className="space-y-1">{validationWarnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                                </div>
                            )}

                            {editMode ? (
                                <div className="space-y-4 p-4">
                                    <div>
                                        <label htmlFor="su-title" className="form-label">Title <span className="text-danger">*</span></label>
                                        <input id="su-title" type="text" value={extractedSkill.title || ''} onChange={(e) => updateSkillField('title', e.target.value)} maxLength={100} className="input" />
                                        <p className="form-hint text-right">{extractedSkill.title?.length || 0}/100</p>
                                    </div>
                                    <div>
                                        <label htmlFor="su-desc" className="form-label">Description</label>
                                        <textarea id="su-desc" value={extractedSkill.description || ''} onChange={(e) => updateSkillField('description', e.target.value)} maxLength={500} rows={3} className="input resize-none" />
                                        <p className="form-hint text-right">{extractedSkill.description?.length || 0}/500</p>
                                    </div>
                                    <div>
                                        <label htmlFor="su-tags" className="form-label">Topics</label>
                                        <input
                                            id="su-tags"
                                            type="text"
                                            value={extractedSkill.tags?.join(', ') || ''}
                                            onChange={(e) => updateSkillField('tags', e.target.value.split(',').map((t) => t.trim()).filter((t) => t))}
                                            placeholder="Separate topics with commas"
                                            className="input"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button type="button" onClick={() => setEditMode(false)} className="btn">Done editing</button>
                                    </div>
                                </div>
                            ) : (
                                <dl className="divide-y divide-line-muted text-sm">
                                    <div className="px-4 py-3">
                                        <dt className="text-xs font-semibold text-fg-muted">Title</dt>
                                        <dd className="mt-0.5 text-base font-semibold">{extractedSkill.title}</dd>
                                    </div>
                                    {extractedSkill.description && (
                                        <div className="px-4 py-3">
                                            <dt className="text-xs font-semibold text-fg-muted">Description</dt>
                                            <dd className="mt-0.5">{extractedSkill.description}</dd>
                                        </div>
                                    )}
                                    {extractedSkill.tags?.length > 0 && (
                                        <div className="px-4 py-3">
                                            <dt className="text-xs font-semibold text-fg-muted">Topics</dt>
                                            <dd className="mt-1 flex flex-wrap gap-1">{extractedSkill.tags.map((tag, i) => <span key={i} className="topic">{tag}</span>)}</dd>
                                        </div>
                                    )}
                                    {extractedSkill.category && (
                                        <div className="px-4 py-3">
                                            <dt className="text-xs font-semibold text-fg-muted">Category</dt>
                                            <dd className="mt-0.5 capitalize">{extractedSkill.category}</dd>
                                        </div>
                                    )}
                                </dl>
                            )}
                        </div>

                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <button type="button" onClick={resetUpload} className="btn">
                                <RotateCcw className="h-4 w-4" />Choose a different file
                            </button>
                            <button
                                type="button"
                                onClick={() => { if (!isLoggedIn) { openAuthModal(); return } setShowSaveModal(true) }}
                                disabled={!canSave || isSaving}
                                className="btn-primary"
                            >
                                {isSaving && <Spinner size={14} className="text-fg-onemphasis" />}
                                {isSaving ? 'Saving…' : 'Publish skill'}
                            </button>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="box flex min-w-0 flex-col overflow-hidden lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)]">
                        <div className="flex shrink-0 items-center gap-2 border-b border-line bg-canvas-subtle px-3 py-2">
                            <div className="segmented" role="tablist" aria-label="Preview mode">
                                <button type="button" role="tab" aria-selected={viewMode === 'rendered'} aria-pressed={viewMode === 'rendered'} onClick={() => setViewMode('rendered')} className="inline-flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />Preview</button>
                                <button type="button" role="tab" aria-selected={viewMode === 'raw'} aria-pressed={viewMode === 'raw'} onClick={() => setViewMode('raw')} className="inline-flex items-center gap-1.5"><Code2 className="h-3.5 w-3.5" />Code</button>
                            </div>
                            <span className="ml-auto text-xs text-fg-muted">{(extractedSkill.content || '').split('\n').length} lines</span>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto bg-canvas">
                            {viewMode === 'rendered' ? (
                                <div className="p-5 sm:p-8"><Markdown>{extractedSkill.content}</Markdown></div>
                            ) : (
                                <pre className="whitespace-pre-wrap break-words p-4 font-mono text-[12.5px] leading-5 text-fg">{extractedSkill.content}</pre>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showSaveModal && <SaveModal onClose={() => setShowSaveModal(false)} onSave={handleSave} />}
            {showSuccessModal && <SuccessModal onClose={() => setShowSuccessModal(false)} isFirstSkill={false} authUser={authUser} />}
            {toast && <Toast message={toast} onClose={() => setToast(null)} />}
            {errorToast && <ErrorToast message={errorToast} onClose={() => setErrorToast(null)} />}
        </div>
    )
}
