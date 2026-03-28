import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAuth } from '../context/AuthContext'
import { saveSkill } from '../lib/skillService'
import { invalidateProfileCache } from '../lib/profileCache'
import { submitTestimonial } from '../lib/userService'
import { parseSkillFile, validateSkillFile } from '../lib/parseSkillFile'
import SEO, { jsonLdSchemas } from '../components/SEO'
import Breadcrumbs from '../components/Breadcrumbs'

// ── Toast notification ──────────────────────────────
function Toast({ message, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3500)
        return () => clearTimeout(timer)
    }, [onClose])

    return (
        <div className="toast">
            <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>
                <span className="font-satoshi text-sm text-white/80">{message}</span>
            </div>
        </div>
    )
}

// ── Error Toast notification ──────────────────────────────
function ErrorToast({ message, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000)
        return () => clearTimeout(timer)
    }, [onClose])

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-red-500/10 border border-red-500/30 backdrop-blur-sm">
                <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <span className="font-satoshi text-sm text-red-200">{message}</span>
            </div>
        </div>
    )
}

// ── Save visibility modal ───────────────────────────────
function SaveModal({ onClose, onSave }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="text-center">
                    <h3 className="font-clash font-bold text-2xl mb-2">Who can see this skill?</h3>
                    <p className="font-satoshi text-sm text-white/40 mb-8">Choose how you'd like to share your new skill.</p>
                    <div className="space-y-3">
                        <button
                            onClick={() => onSave('private')}
                            className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-white/10 hover:border-accent/30 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 group text-left"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-accent/20 transition-colors">
                                <svg className="w-5 h-5 text-white/50 group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-clash font-semibold text-white group-hover:text-accent-light transition-colors">Private</p>
                                <p className="font-satoshi text-xs text-white/30">Only you can see this skill</p>
                            </div>
                        </button>

                        <button
                            onClick={() => onSave('public')}
                            className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-white/10 hover:border-accent/30 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 group text-left"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-accent/20 transition-colors">
                                <svg className="w-5 h-5 text-white/50 group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.107 1.107 0 00-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 01-1.652.928l-.679-.906a1.125 1.125 0 00-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 00-8.862 12.872M12.75 3.031a9 9 0 016.69 14.036m0 0l-.177-.529A2.25 2.25 0 0017.128 15H16.5l-.324-.324a1.453 1.453 0 00-2.328.377l-.036.073a1.586 1.586 0 01-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438a2.253 2.253 0 01-1.699 2.652l-.829.207a8.96 8.96 0 01-3.085.29" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-clash font-semibold text-white group-hover:text-accent-light transition-colors">Public</p>
                                <p className="font-satoshi text-xs text-white/30">Share with the community</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Success modal ───────────────────────────────
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
                img: authUser.avatar_url || 'https://avatar.vercel.sh/user'
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

    if (showTestimonial) {
        return (
            <div className="modal-overlay z-[100]" onClick={onClose}>
                <div className="modal-card relative" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="text-center mb-6">
                        <span className="inline-block px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-satoshi text-xs font-semibold mb-3">
                            Achievement Unlocked ✨
                        </span>
                        <h3 className="font-clash font-bold text-2xl mb-2 text-white/90">First Skill Uploaded!</h3>
                        <p className="font-satoshi text-sm text-white/50">
                            You just uploaded your first skill! What do you think of Skill Issue?
                        </p>
                    </div>

                    <textarea
                        value={testimonialBody}
                        onChange={(e) => setTestimonialBody(e.target.value)}
                        placeholder="This app is amazing. Uploading skills is super easy..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:border-accent/40 focus:bg-white/[0.05] text-white placeholder:text-white/20 font-satoshi text-sm outline-none transition-all duration-300 resize-none mb-4"
                    />

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl font-satoshi font-semibold text-sm bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                        >
                            Skip for now
                        </button>
                        <button
                            onClick={handleTestimonialSubmit}
                            disabled={submittingTestimonial || !testimonialBody.trim()}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-satoshi font-semibold text-sm transition-all duration-300 ${testimonialBody.trim() && !submittingTestimonial ? 'bg-accent text-navy hover:bg-[#6bbcff] cursor-pointer' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                        >
                            {submittingTestimonial ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="modal-overlay z-[100]" onClick={onClose}>
            <div className="modal-card text-center relative" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>
                <h3 className="font-clash font-bold text-2xl mb-2 text-white/90">Skill uploaded!</h3>
                <p className="font-satoshi text-sm text-white/50 mb-6">Your skill has been saved successfully.</p>
                {isFirstSkill && (
                    <>
                        <button
                            onClick={() => setShowTestimonial(true)}
                            className="w-full mb-3 px-4 py-2.5 rounded-xl font-satoshi font-semibold text-sm bg-accent text-navy hover:bg-[#6bbcff] transition-all duration-300"
                        >
                            Share your feedback
                        </button>
                    </>
                )}
                <button
                    onClick={onClose}
                    className="w-full px-4 py-2.5 rounded-xl font-satoshi font-semibold text-sm bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                >
                    Done
                </button>
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
                processFile(files[0])
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
        if (!isLoggedIn) return
        setDragActive(true)
    }

    function handleDragLeave(e) {
        e.preventDefault()
        e.stopPropagation()
        if (!isLoggedIn) return
        setDragActive(false)
    }

    function handleDragOver(e) {
        e.preventDefault()
        e.stopPropagation()
        if (!isLoggedIn) return
    }

    function handleDrop(e) {
        e.preventDefault()
        e.stopPropagation()
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
                setToast('File parsed successfully!')
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

            setToast(`Skill saved as ${visibility}! ✓`)
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

    // Simple auth check - redirect to login
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen pt-40 pb-20 relative flex items-center justify-center px-6">
                <div className="text-center">
                    <h1 className="font-clash font-bold text-5xl text-white mb-4">Sign in to Upload</h1>
                    <p className="font-satoshi text-white/60 mb-8 max-w-md">You need to be logged in to upload SKILL.md files.</p>
                    <button
                        onClick={openAuthModal}
                        className="px-8 py-3 rounded-xl bg-accent text-navy font-satoshi font-semibold hover:bg-[#6bbcff]"
                    >
                        Sign In with Google
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-28 pb-20 relative">
            <SEO
                title="Upload Skill Files — Skill Issue Marketplace"
                description="Upload pre-written SKILL.md files directly to Skill Issue. Share your skills with the community or keep them private."
                path="/upload"
                jsonLd={jsonLdSchemas.breadcrumb([
                    { name: 'Home', url: '/' },
                    { name: 'Upload Skill', url: '/upload' },
                ])}
            />

            {/* Ambient glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/[0.04] rounded-full blur-[140px] pointer-events-none" />

            {/* Login Required Banner */}
            {!isLoggedIn && (
                <div className="fixed top-20 left-0 right-0 z-40 px-6 py-4">
                    <div className="max-w-6xl mx-auto bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/30 border border-accent/50 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-satoshi font-semibold text-sm text-accent">Sign in to upload skills</p>
                                <p className="font-satoshi text-xs text-accent/60">You need to be logged in to upload your SKILL.md files</p>
                            </div>
                        </div>
                        <button
                            onClick={openAuthModal}
                            className="px-4 py-2 rounded-lg bg-accent text-navy font-satoshi font-semibold text-sm hover:bg-[#6bbcff] transition-all duration-300 shrink-0"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            )}

            {/* Global Drag & Drop Overlay */}
            {globalDragActive && (
                <div className="fixed inset-0 bg-navy/80 backdrop-blur-md z-[9999] flex flex-col items-center justify-center pointer-events-none">
                    {/* Animated background grid */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-b from-accent/20 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 text-center space-y-8 px-6">
                        {/* Animated icon */}
                        <div className="flex justify-center">
                            <div className="relative w-32 h-32">
                                {/* Outer rotating ring */}
                                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent border-r-accent animate-spin" style={{ animationDuration: '3s' }} />

                                {/* Middle pulsing ring */}
                                <div className="absolute inset-4 rounded-full border border-accent/30 animate-pulse" />

                                {/* Inner content */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <svg className="w-16 h-16 text-accent animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Text */}
                        <div className="space-y-3">
                            <h2 className="font-clash font-bold text-5xl sm:text-6xl text-white">
                                DROP your file
                            </h2>
                            <p className="font-satoshi text-lg text-white/60 max-w-md mx-auto">
                                Upload your SKILL.md file to get started
                            </p>
                        </div>

                        {/* Highlight box */}
                        <div className="mt-12 inline-block">
                            <div className="px-8 py-4 rounded-2xl border border-accent/40 bg-accent/[0.08] backdrop-blur-sm">
                                <p className="font-satoshi text-sm font-medium text-accent">
                                    ✨ Markdown files only (.md)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Floating particles effect */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-1 h-1 bg-accent/40 rounded-full animate-pulse"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${i * 0.2}s`,
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8">
                <Breadcrumbs />

                {/* Header */}
                <div className="mb-12 text-center">
                    <span className="inline-block px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-satoshi text-xs font-semibold mb-3">
                        Upload Your Skills
                    </span>
                    <h1 className="font-clash font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] mb-5">
                        Show us.{' '}
                        <span className="italic text-accent glow-text">What you built.</span>
                    </h1>
                    <p className="font-satoshi text-lg text-white/60 max-w-2xl mx-auto">
                        Already have a skill file? Upload your .md file directly and we'll parse it for you. No need to rebuild from scratch.
                    </p>
                </div>

                {/* Upload Section or Preview Section */}
                {step === 'upload' && (
                    // ── UPLOAD STEP ──────────────────────────────
                    <div
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`mt-10 rounded-2xl border-2 border-dashed transition-all duration-300 p-12 text-center ${dragActive && isLoggedIn
                            ? 'border-accent bg-accent/[0.08] bg-opacity-50'
                            : 'border-white/[0.12] bg-white/[0.02] hover:border-accent/30 hover:bg-white/[0.04]'
                        } ${!isLoggedIn ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".md"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                                <svg className="w-10 h-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>

                        {/* Text */}
                        <h3 className="font-clash font-bold text-2xl text-white mb-3">
                            Upload your SKILL.md file
                        </h3>
                        <p className="font-satoshi text-white/60 mb-8 max-w-md mx-auto">
                            Click to browse or drag and drop your Markdown file anywhere. Max 5MB.
                        </p>

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => {
                                    if (!isLoggedIn) {
                                        openAuthModal()
                                        return
                                    }
                                    fileInputRef.current?.click()
                                }}
                                className="px-8 py-3 rounded-xl bg-accent text-navy font-satoshi font-semibold hover:bg-[#6bbcff] transition-all duration-300"
                            >
                                Choose File
                            </button>
                            {/* <button
                                onClick={() => setStep('upload')}
                                className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-satoshi font-semibold hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                            >
                                Or Browse
                            </button> */}
                        </div>

                        {/* Info */}
                        <div className="mt-8 inline-block">
                            <div className="px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02]">
                                <p className="font-satoshi text-xs text-white/50">
                                    ✨ Supports YAML frontmatter and standard Markdown format
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'preview' && extractedSkill && (
                    // ── PREVIEW STEP ────────────────────────────
                    <div className="mt-10 scroll-reveal revealed grid lg:grid-cols-2 gap-8">
                        {/* Left Panel — Extracted Data */}
                        <div className="rounded-2xl border border-accent/15 bg-gradient-to-br from-accent/[0.04] via-transparent to-transparent p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-3 h-3 rounded-full bg-accent/60" />
                                <span className="font-clash font-semibold text-lg text-accent">
                                    Extracted Data
                                </span>
                            </div>

                            {validationWarnings.length > 0 && (
                                <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                                    <p className="font-satoshi text-xs text-yellow-200 font-semibold mb-2">⚠️ Parsing Notes:</p>
                                    {validationWarnings.map((w, i) => (
                                        <p key={i} className="font-satoshi text-xs text-yellow-300/80 mb-1">• {w}</p>
                                    ))}
                                </div>
                            )}

                            {editMode ? (
                                // Edit Mode
                                <div className="space-y-5">
                                    <div>
                                        <label className="block font-satoshi text-xs text-white/50 font-semibold mb-2">Title</label>
                                        <input
                                            type="text"
                                            value={extractedSkill.title || ''}
                                            onChange={(e) => updateSkillField('title', e.target.value)}
                                            maxLength={100}
                                            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:border-accent/40 focus:bg-white/[0.05] text-white placeholder:text-white/20 font-satoshi text-sm outline-none transition-all duration-300"
                                        />
                                        <p className="text-xs text-white/30 mt-1">{extractedSkill.title?.length || 0}/100</p>
                                    </div>

                                    <div>
                                        <label className="block font-satoshi text-xs text-white/50 font-semibold mb-2">Description</label>
                                        <textarea
                                            value={extractedSkill.description || ''}
                                            onChange={(e) => updateSkillField('description', e.target.value)}
                                            maxLength={500}
                                            rows={3}
                                            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:border-accent/40 focus:bg-white/[0.05] text-white placeholder:text-white/20 font-satoshi text-sm outline-none transition-all duration-300 resize-none"
                                        />
                                        <p className="text-xs text-white/30 mt-1">{extractedSkill.description?.length || 0}/500</p>
                                    </div>

                                    <div>
                                        <label className="block font-satoshi text-xs text-white/50 font-semibold mb-2">Tags</label>
                                        <input
                                            type="text"
                                            value={extractedSkill.tags?.join(', ') || ''}
                                            onChange={(e) => {
                                                const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t)
                                                updateSkillField('tags', tags)
                                            }}
                                            placeholder="Enter tags separated by commas"
                                            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:border-accent/40 focus:bg-white/[0.05] text-white placeholder:text-white/20 font-satoshi text-sm outline-none transition-all duration-300"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={() => setEditMode(false)}
                                            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 font-satoshi font-semibold text-sm transition-all duration-300"
                                        >
                                            Done Editing
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // View Mode
                                <div className="space-y-5">
                                    <div>
                                        <p className="font-satoshi text-xs text-white/50 font-semibold mb-2">Title</p>
                                        <p className="font-satoshi text-white text-lg font-medium">{extractedSkill.title}</p>
                                    </div>

                                    {extractedSkill.description && (
                                        <div>
                                            <p className="font-satoshi text-xs text-white/50 font-semibold mb-2">Description</p>
                                            <p className="font-satoshi text-white/70 text-sm">{extractedSkill.description}</p>
                                        </div>
                                    )}

                                    {extractedSkill.tags && extractedSkill.tags.length > 0 && (
                                        <div>
                                            <p className="font-satoshi text-xs text-white/50 font-semibold mb-2">Tags</p>
                                            <div className="flex flex-wrap gap-2">
                                                {extractedSkill.tags.map((tag, i) => (
                                                    <span key={i} className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-satoshi text-xs">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {extractedSkill.category && (
                                        <div>
                                            <p className="font-satoshi text-xs text-white/50 font-semibold mb-2">Category</p>
                                            <p className="font-satoshi text-white/70 text-sm">{extractedSkill.category}</p>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 font-satoshi font-semibold text-sm transition-all duration-300"
                                    >
                                        Edit Details
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right Panel — Preview */}
                        <div className="rounded-2xl border border-accent/15 bg-gradient-to-br from-accent/[0.04] via-transparent to-transparent p-8 flex flex-col">
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-accent/60" />
                                    <span className="font-clash font-semibold text-lg text-accent">
                                        Preview
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setViewMode('rendered')}
                                        className={`px-3 py-1.5 rounded-lg font-satoshi text-xs font-semibold transition-all duration-300 ${viewMode === 'rendered'
                                            ? 'bg-accent/30 text-accent border border-accent/50'
                                            : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                                        }`}
                                    >
                                        Rendered
                                    </button>
                                    <button
                                        onClick={() => setViewMode('raw')}
                                        className={`px-3 py-1.5 rounded-lg font-satoshi text-xs font-semibold transition-all duration-300 ${viewMode === 'raw'
                                            ? 'bg-accent/30 text-accent border border-accent/50'
                                            : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                                        }`}
                                    >
                                        Raw
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto bg-white/[0.01] border border-white/[0.08] rounded-xl p-6">
                                {viewMode === 'rendered' ? (
                                    <div className="prose prose-invert max-w-none text-white/80 leading-relaxed">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                h1: ({ node, ...props }) => <h1 className="text-2xl font-clash font-bold text-white mt-4 mb-2" {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="text-xl font-clash font-bold text-white/90 mt-4 mb-2" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="text-lg font-clash font-bold text-white/90 mt-3 mb-1.5" {...props} />,
                                                p: ({ node, ...props }) => <p className="text-sm leading-6 mb-3 text-white/70" {...props} />,
                                                li: ({ node, ...props }) => <li className="text-sm leading-6 mb-1.5 ml-4 text-white/70 list-disc" {...props} />,
                                                code: ({ node, inline, ...props }) => inline
                                                    ? <code className="bg-white/10 px-1.5 py-0.5 rounded border border-white/10 font-mono text-xs text-accent" {...props} />
                                                    : <code className="block bg-white/[0.02] border border-white/10 rounded-lg p-4 overflow-x-auto font-mono text-xs mb-3" {...props} />,
                                            }}
                                        >
                                            {extractedSkill.content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <pre className="text-xs text-white/50 whitespace-pre-wrap break-words font-mono overflow-auto">
                                        {extractedSkill.content}
                                    </pre>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                {step === 'preview' && (
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => {
                                setStep('upload')
                                setSelectedFile(null)
                                setExtractedSkill(null)
                                setEditMode(false)
                            }}
                            className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 font-satoshi font-semibold hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                        >
                            Upload Different File
                        </button>
                        <button
                            onClick={() => {
                                if (!isLoggedIn) {
                                    openAuthModal()
                                    return
                                }
                                setShowSaveModal(true)
                            }}
                            disabled={!canSave || isSaving}
                            className={`px-8 py-3 rounded-xl font-satoshi font-semibold transition-all duration-300 ${canSave && !isSaving
                                ? 'bg-accent text-navy hover:bg-[#6bbcff]'
                                : 'bg-white/5 text-white/30 cursor-not-allowed'
                            }`}
                        >
                            {isSaving ? 'Saving...' : 'Save Skill'}
                        </button>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showSaveModal && <SaveModal onClose={() => setShowSaveModal(false)} onSave={handleSave} />}
            {showSuccessModal && <SuccessModal onClose={() => setShowSuccessModal(false)} isFirstSkill={false} authUser={authUser} />}

            {/* Toasts */}
            {toast && <Toast message={toast} onClose={() => setToast(null)} />}
            {errorToast && <ErrorToast message={errorToast} onClose={() => setErrorToast(null)} />}
        </div>
    )
}
