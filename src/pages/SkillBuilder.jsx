import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAuth } from '../context/AuthContext'
import { saveSkill } from '../lib/skillService'
import { invalidateProfileCache } from '../lib/profileCache'
import { submitTestimonial } from '../lib/userService'
import TextareaAutosize from 'react-textarea-autosize'
import SEO, { jsonLdSchemas } from '../components/SEO'
import Breadcrumbs from '../components/Breadcrumbs'

// ── Google icon SVG (reusable) ──────────────────────
function GoogleIcon({ className = 'w-4 h-4' }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    )
}

// ── Loading skeleton lines ──────────────────────────
function LoadingState() {
    return (
        <div className="mt-10 scroll-reveal revealed">
            <div className="rounded-2xl border border-accent/15 bg-gradient-to-br from-accent/[0.04] via-transparent to-transparent p-8 sm:p-10">
                {/* Header shimmer */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-3 h-3 rounded-full bg-accent/60 animate-pulse" />
                    <span className="font-clash font-semibold text-lg text-accent/80">
                        Crafting your skill…
                    </span>
                </div>

                {/* Skeleton lines */}
                <div className="space-y-3">
                    {[100, 85, 92, 60, 88, 75, 95, 50, 80, 70].map((width, i) => (
                        <div
                            key={i}
                            className="skeleton-line"
                            style={{
                                width: `${width}%`,
                                animationDelay: `${i * 0.12}s`,
                            }}
                        />
                    ))}
                </div>

                {/* Status text */}
                <div className="mt-8 flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent/50 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="font-satoshi text-sm text-white/30">
                        AI is analyzing your description and generating a structured skill file…
                    </span>
                </div>
            </div>
        </div>
    )
}


// ── Save visibility modal ───────────────────────────
function SaveModal({ onClose, onSave }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-card"
                onClick={(e) => e.stopPropagation()}
            >
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
                    <p className="font-satoshi text-sm text-white/40 mb-8">
                        Choose how you'd like to share your new skill.
                    </p>

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

// ── Testimonial Modal ──────────────────────────────
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
                img: authUser.avatar_url || 'https://avatar.vercel.sh/user'
            })
            setSubmitted(true)
            setTimeout(onClose, 2000)
        } catch (err) {
            console.error(err)
            // Still close it if it fails so they aren't blocked, but in a real app show an error
            onClose()
        }
    }

    if (submitted) {
        return (
            <div className="modal-overlay z-[100]" onClick={onClose}>
                <div className="modal-card text-center relative" onClick={e => e.stopPropagation()}>
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>
                    <h3 className="font-clash font-bold text-2xl mb-2 text-white/90">Thank you!</h3>
                    <p className="font-satoshi text-sm text-white/50">Your testimonial has been submitted.</p>
                </div>
            </div>
        )
    }

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
                    <h3 className="font-clash font-bold text-2xl mb-2 text-white/90">First Skill Built!</h3>
                    <p className="font-satoshi text-sm text-white/50">
                        You just built your first skill! What do you think of Skill Issue so far? Leave a review for a chance to be featured on the homepage.
                    </p>
                </div>

                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="This app is basically magic. I built a coding assistant in 3 seconds..."
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
                        onClick={handleSubmit}
                        disabled={submitting || !body.trim()}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-satoshi font-semibold text-sm transition-all duration-300 ${body.trim() && !submitting ? 'bg-accent text-navy hover:bg-[#6bbcff] cursor-pointer' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                    >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
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

    // Ref to always point at the latest handleImageSelect (avoids stale closure)
    const handleImageSelectRef = useRef(null)

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
                handleImageSelectRef.current?.({ target: { files } })
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
        // Reset so the same files can be re-selected after removal (only for real inputs)
        if (e.target && e.target.tagName) e.target.value = ''
    }

    // Keep ref in sync so the global drop handler always uses the latest function
    handleImageSelectRef.current = handleImageSelect

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
            setToast('Skill refined successfully!')

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
        setToast('Copied to clipboard!')
    }

    function handleDownload() {
        const blob = new Blob([generatedMarkdown], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${skillName.trim().toLowerCase().replace(/\s+/g, '-')}.md`
        a.click()
        URL.revokeObjectURL(url)
        setToast('Downloaded!')
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
            setToast(`Skill saved as ${visibility}! ✓`)

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

    return (
        <div className="min-h-screen pt-28 pb-20 relative">
            <SEO
                title="Build Custom AI Skill Files — AI Skill Builder"
                description="Create custom AI skill files in seconds. Describe what you want your AI to do, and our builder generates a ready-to-use .md skill file for Claude, ChatGPT, Gemini, Cursor and more."
                path="/build"
                jsonLd={jsonLdSchemas.breadcrumb([
                    { name: 'Home', url: '/' },
                    { name: 'Skill Builder', url: '/build' },
                ])}
            />
            {/* Ambient glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/[0.04] rounded-full blur-[140px] pointer-events-none" />

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
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 9.75h18M3 5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25v13.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75V5.25z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Text */}
                        <div className="space-y-3">
                            <h2 className="font-clash font-bold text-5xl sm:text-6xl text-white">
                                DROP your images
                            </h2>
                            <p className="font-satoshi text-lg text-white/60 max-w-md mx-auto">
                                Upload reference images to enhance your skill creation
                            </p>
                        </div>

                        {/* Highlight box */}
                        <div className="mt-12 inline-block">
                            <div className="px-8 py-4 rounded-2xl border border-accent/40 bg-accent/[0.08] backdrop-blur-sm">
                                <p className="font-satoshi text-sm font-medium text-accent">
                                    ✨ Multiple images supported (JPG, PNG, WEBP)
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
                                    animationDelay: `${Math.random() * 2}s`,
                                    animationDuration: `${2 + Math.random() * 1}s`,
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <Breadcrumbs items={[{ label: 'Skill Builder' }]} />
                {/* ── Header (centered) ──── */}
                <div className="text-center mb-10 max-w-3xl mx-auto">
                    <span className="inline-block font-satoshi text-sm font-medium tracking-widest uppercase text-accent/70 mb-4">
                        Skill Builder
                    </span>
                    <h1 className="font-clash font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] mb-5">
                        Describe it.{' '}
                        <span className="italic text-accent glow-text">We'll build it.</span>
                    </h1>
                    <p className="font-satoshi text-lg text-white/40 max-w-xl mx-auto">
                        Tell us what you want your AI to do, and we'll turn it into a
                        ready-to-use skill file in seconds.
                    </p>
                    <Link
                        to="/upload"
                        className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl border border-accent/20 bg-accent/[0.06] text-accent font-satoshi text-sm font-semibold hover:bg-accent/15 hover:border-accent/35 transition-all duration-300 group"
                    >
                        <svg className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        Or upload a skill file
                    </Link>
                </div>

                {/* ── Two-column grid ──────── */}
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6 lg:gap-8 lg:h-[calc(100vh-12rem)]">

                    {/* ── LEFT — Form Card ─── */}
                    <div className={`rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.03] via-transparent to-transparent flex flex-col lg:overflow-hidden ${showOutput ? 'p-5 sm:p-6' : 'p-6 sm:p-8'}`}>

                        <div className={showOutput ? 'mb-3' : 'mb-6'}>
                            <label className={`block font-clash font-semibold text-white/60 ${showOutput ? 'text-xs mb-1.5' : 'text-sm mb-2.5'}`}>
                                Skill Name
                            </label>
                            <input
                                type="text"
                                value={skillName}
                                onChange={(e) => setSkillName(e.target.value)}
                                placeholder="e.g. Blog Post Writer, Study Buddy, Brand Designer"
                                className={`w-full rounded-xl bg-white/[0.03] border border-white/[0.08] focus:border-accent/40 focus:bg-white/[0.05] text-white placeholder:text-white/20 font-satoshi outline-none transition-all duration-300 ${showOutput ? 'px-3 py-2.5 text-sm' : 'px-4 py-3.5 text-[0.95rem]'}`}
                            />
                        </div>

                        {/* Description */}
                        <div className={`flex flex-col ${showOutput ? 'mb-3 lg:flex-1 lg:min-h-0' : 'mb-6'}`}>
                            <label className={`block font-clash font-semibold text-white/60 ${showOutput ? 'text-xs mb-1.5' : 'text-sm mb-2.5'}`}>
                                What should this skill do?
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={`Describe what you want your AI to do. Be as detailed as possible — the more you describe, the better the skill.\n\nFor example: 'I want my AI to write blog posts in a conversational, friendly tone...'`}
                                rows={showOutput ? undefined : 7}
                                className={`w-full rounded-xl bg-white/[0.03] border border-white/[0.08] focus:border-accent/40 focus:bg-white/[0.05] text-white placeholder:text-white/20 font-satoshi outline-none transition-all duration-300 resize-none ${showOutput ? 'px-3 py-2.5 text-sm flex-1 min-h-0' : 'px-4 py-3.5 text-[0.95rem] resize-y min-h-[160px]'}`}
                            />
                        </div>

                        {/* ── Reference images ────────────── */}
                        <div className={showOutput ? 'mb-3' : 'mb-8'}>
                            <div className={`flex items-center gap-2 ${showOutput ? 'mb-2' : 'mb-3'}`}>
                                <label className={`font-clash font-semibold text-white/60 ${showOutput ? 'text-xs' : 'text-sm'}`}>
                                    Reference images
                                </label>
                                <span className="font-satoshi text-xs text-white/25 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                                    optional
                                </span>
                            </div>

                            {referenceImages.length > 0 && (
                                <div
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    className={`flex flex-wrap gap-2 p-2 rounded-xl border border-dashed transition-all ${
                                        dragActive
                                            ? 'border-accent/40 bg-accent/[0.08]'
                                            : 'border-transparent'
                                    }`}
                                >
                                    {referenceImages.map((img) => (
                                        <div key={img.id} className="relative group">
                                            <img
                                                src={img.base64DataUri}
                                                alt={img.fileName}
                                                className={`object-cover rounded-lg border border-white/10 ${showOutput ? 'h-12 w-12' : 'h-20 w-20 rounded-xl'}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeReferenceImage(img.id)}
                                                className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 border border-red-400/60 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md"
                                            >
                                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                            {!showOutput && <p className="mt-1 font-satoshi text-[10px] text-white/25 truncate w-20 text-center">{img.fileName}</p>}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.12] hover:border-accent/40 bg-white/[0.02] hover:bg-accent/[0.03] transition-all duration-200 group ${showOutput ? 'h-12 w-12' : 'h-20 w-20 rounded-xl'}`}
                                        title="Drag and drop or click to upload more images"
                                    >
                                        <svg className={`text-white/25 group-hover:text-accent/60 transition-colors ${showOutput ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                        {!showOutput && (
                                            <span className="text-white/20 group-hover:text-accent/50 font-satoshi text-[9px] mt-1 font-semibold transition-colors text-center leading-tight">
                                                ADD MORE
                                            </span>
                                        )}
                                    </button>
                                </div>
                            )}

                            {referenceImages.length === 0 && (
                                <div
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    className={`rounded-xl border border-dashed transition-all ${
                                        dragActive
                                            ? 'border-accent/40 bg-accent/[0.08]'
                                            : 'border-white/[0.10] hover:border-accent/40 hover:bg-accent/[0.03]'
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`w-full flex items-center justify-center gap-2 transition-all duration-300 group ${showOutput ? 'flex-row px-4 py-3' : 'flex-col px-6 py-6'}`}
                                    >
                                        <svg className={`transition-colors ${showOutput ? 'w-4 h-4' : 'w-6 h-6'} ${dragActive ? 'text-accent/60' : 'text-white/25 group-hover:text-accent/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 9.75h18M3 5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25v13.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75V5.25z" />
                                        </svg>
                                        <span className={`font-satoshi transition-colors ${showOutput ? 'text-xs' : 'text-sm'} ${dragActive ? 'text-accent/60' : 'text-white/30 group-hover:text-white/50'}`}>
                                            {dragActive ? 'Drop images here' : showOutput ? 'Add images' : 'DRAG and DROP or Click to Upload'}{!showOutput && <span className={dragActive ? 'text-accent/50' : 'text-white/50'}> (JPG, PNG, WEBP)</span>}
                                        </span>
                                    </button>
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp"
                                multiple
                                className="hidden"
                                onChange={handleImageSelect}
                            />
                        </div>

                        {/* Submit button */}
                        <div className={`border-t border-white/[0.05] mt-auto ${showOutput ? 'pt-3 pb-1' : 'pt-5'}`}>
                            <button
                                onClick={handleGenerate}
                                disabled={!canSubmit || isGenerating}
                                className={`w-full flex items-center justify-center gap-2.5 rounded-xl font-satoshi font-bold transition-all duration-300 ${showOutput ? 'px-6 py-2.5 text-sm' : 'px-8 py-3.5 text-[0.95rem]'} ${canSubmit && !isGenerating
                                    ? 'bg-accent text-navy hover:bg-[#6bbcff] hover:shadow-[0_0_30px_rgba(75,169,255,0.3)] hover:-translate-y-0.5 cursor-pointer'
                                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                                    }`}
                            >
                                {isGenerating ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Creating…
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                                        </svg>
                                        Create Skill
                                    </>
                                )}
                            </button>

                            {/* ── Refinement section (Moved to Left Side) ── */}
                            {showOutput && (
                                <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in-up">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-5 h-5 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center">
                                            <svg className="w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                            </svg>
                                        </div>
                                        <h3 className="font-clash font-semibold text-sm text-white/80">Refine with AI</h3>
                                    </div>
                                    <div className="relative">
                                        <TextareaAutosize
                                            value={refinementInstruction}
                                            onChange={(e) => setRefinementInstruction(e.target.value)}
                                            placeholder="e.g. 'Make the tone more professional'"
                                            minRows={1}
                                            maxRows={4}
                                            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:border-accent/40 focus:bg-white/[0.05] text-white placeholder:text-white/20 font-satoshi text-sm outline-none transition-all duration-300 resize-none pr-24 overflow-hidden"
                                        />
                                        <div className="absolute right-3 bottom-3">
                                            <button
                                                onClick={handleRefine}
                                                disabled={!canRefine}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-satoshi font-bold text-sm transition-all duration-300 ${canRefine
                                                    ? 'bg-accent text-navy hover:bg-[#6bbcff]'
                                                    : 'bg-white/5 text-white/10 cursor-not-allowed'
                                                    }`}
                                            >
                                                {isRefining ? (
                                                    <>
                                                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                        </svg>
                                                        Refining…
                                                    </>
                                                ) : 'Refine'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action buttons — under form/refine */}
                            {showOutput && (
                                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5 animate-fade-in-up">
                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.03] hover:border-accent/30 hover:bg-white/[0.06] transition-all duration-300 group"
                                    >
                                        {copied ? (
                                            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </svg>
                                        ) : (
                                            <svg className="w-3.5 h-3.5 text-white/40 group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                                            </svg>
                                        )}
                                        <span className="font-satoshi text-xs text-white/60 group-hover:text-white/80 transition-colors">
                                            {copied ? 'Copied!' : 'Copy'}
                                        </span>
                                    </button>

                                    <button
                                        onClick={handleDownload}
                                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.03] hover:border-accent/30 hover:bg-white/[0.06] transition-all duration-300 group"
                                    >
                                        <svg className="w-3.5 h-3.5 text-white/40 group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                        </svg>
                                        <span className="font-satoshi text-xs text-white/60 group-hover:text-white/80 transition-colors">
                                            Download
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => savedAs ? null : setShowSaveModal(true)}
                                        disabled={isSaving || !!savedAs}
                                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border transition-all duration-300 group ${savedAs
                                            ? 'bg-emerald-500/10 border-emerald-500/30 cursor-default'
                                            : isSaving
                                                ? 'bg-accent/10 border-accent/20 opacity-50 cursor-wait'
                                                : 'bg-accent/10 border-accent/20 hover:bg-accent/20 hover:border-accent/40'
                                            }`}
                                    >
                                        {isSaving ? (
                                            <svg className="w-3.5 h-3.5 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                        ) : savedAs ? (
                                            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </svg>
                                        ) : (
                                            <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                                            </svg>
                                        )}
                                        <span className={`font-satoshi text-xs font-medium ${savedAs ? 'text-emerald-400' : 'text-accent'}`}>
                                            {isSaving ? 'Saving…' : savedAs ? `Saved ✓` : 'Save'}
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div> {/* end sticky bottom wrapper */}
                    </div>

                    {/* ── RIGHT — Output Panel (Sticky Sidebar) ───── */}
                    <div className="flex flex-col lg:overflow-hidden">

                        {/* Loading */}
                        {isGenerating && <LoadingState />}

                        {/* Empty placeholder */}
                        {!isGenerating && !showOutput && (
                            <div className="h-full min-h-[300px] rounded-2xl border border-white/[0.05] bg-white/[0.01] flex flex-col items-center justify-center gap-4 px-8 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-accent/5 border border-accent/10 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-accent/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-clash font-semibold text-white/20 text-base mb-1">Your skill will appear here</p>
                                    <p className="font-satoshi text-sm text-white/15">Fill in the form and hit Create Skill</p>
                                </div>
                            </div>
                        )}

                        {/* Generated output */}
                        {showOutput && (
                            <div ref={outputRef} className="flex flex-col flex-1 min-h-0 animate-fade-in-up">
                                {/* Editor */}
                                <div className="flex-1 min-h-0 rounded-2xl border border-accent/15 bg-[#0a0d17] overflow-hidden flex flex-col">
                                    {/* Editor bar */}
                                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                            <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                        </div>
                                        <span className="font-mono text-xs text-white/20">
                                            {skillName.trim().toLowerCase().replace(/\s+/g, '-')}.md
                                        </span>
                                        {/* Rendered | Raw pill toggle */}
                                        <div className="flex items-center rounded-lg bg-white/[0.04] border border-white/[0.06] p-0.5">
                                            <button
                                                onClick={() => setViewMode('rendered')}
                                                className={`px-3 py-1 rounded-md font-satoshi text-[11px] font-semibold transition-all duration-200 ${viewMode === 'rendered'
                                                    ? 'bg-accent/20 text-accent shadow-sm'
                                                    : 'text-white/30 hover:text-white/55'
                                                    }`}
                                            >
                                                Rendered
                                            </button>
                                            <button
                                                onClick={() => setViewMode('raw')}
                                                className={`px-3 py-1 rounded-md font-satoshi text-[11px] font-semibold transition-all duration-200 ${viewMode === 'raw'
                                                    ? 'bg-accent/20 text-accent shadow-sm'
                                                    : 'text-white/30 hover:text-white/55'
                                                    }`}
                                            >
                                                Raw
                                            </button>
                                        </div>
                                    </div>

                                    {/* Rendered view */}
                                    {viewMode === 'rendered' && (
                                        <div className="p-6 lg:overflow-y-auto styled-scrollbar lg:flex-1 lg:min-h-0">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
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
                                                }}
                                            >
                                                {generatedMarkdown}
                                            </ReactMarkdown>
                                        </div>
                                    )}

                                    {/* Raw view — editable textarea */}
                                    {viewMode === 'raw' && (
                                        <textarea
                                            value={generatedMarkdown}
                                            onChange={(e) => setGeneratedMarkdown(e.target.value)}
                                            className="skill-editor w-full bg-transparent resize-none lg:overflow-y-auto styled-scrollbar lg:flex-1 lg:min-h-0"
                                        />
                                    )}
                                </div>


                            </div>
                        )}
                    </div>

                </div>{/* end grid */}
            </div>

            {/* ── Modals ─────────────────────────────── */}
            {
                showSaveModal && (
                    <SaveModal
                        onClose={() => setShowSaveModal(false)}
                        onSave={handleSave}
                    />
                )
            }

            {/* ── Toast ──────────────────────────────── */}
            {
                toast && (
                    <Toast
                        message={toast}
                        onClose={() => setToast(null)}
                    />
                )
            }

            {showTestimonialModal && (
                <TestimonialModal
                    onClose={() => setShowTestimonialModal(false)}
                    authUser={authUser}
                />
            )}
        </div >
    )
}
