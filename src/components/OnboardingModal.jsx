import { useState, useEffect, useRef, useCallback } from 'react'
import { Check, X } from 'lucide-react'
import { Spinner } from './ui/primitives'
import { useAuth } from '../context/AuthContext'
import { isUsernameAvailable, createProfile, suggestUsername, findAvailableUsername } from '../lib/userService'

// Username validation regex: lowercase letters, numbers, hyphens, 3–30 chars
const USERNAME_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$|^[a-z0-9]{1,30}$/

export default function OnboardingModal() {
    const { user, refreshProfile, setNeedsOnboarding } = useAuth()

    const [username, setUsername] = useState('')
    const [status, setStatus] = useState('idle') // idle | checking | available | taken | invalid
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const debounceRef = useRef(null)
    const initialised = useRef(false)

    // Pre-fill username from email on mount
    useEffect(() => {
        if (!user?.email || initialised.current) return
        initialised.current = true

        const base = suggestUsername(user.email)
        if (!base) return

        setUsername(base)
        setStatus('checking')

        findAvailableUsername(base).then(suggestion => {
            setUsername(suggestion)
            setStatus(suggestion === base ? 'available' : 'available')
        })
    }, [user])

    // Real-time availability check (300ms debounce)
    const checkUsername = useCallback((value) => {
        clearTimeout(debounceRef.current)

        if (!value) { setStatus('idle'); return }
        if (!USERNAME_RE.test(value)) { setStatus('invalid'); return }

        setStatus('checking')
        debounceRef.current = setTimeout(async () => {
            try {
                const available = await isUsernameAvailable(value)
                setStatus(available ? 'available' : 'taken')
            } catch {
                setStatus('idle')
            }
        }, 300)
    }, [])

    function handleChange(e) {
        const raw = e.target.value
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '')   // strip invalid chars
        setUsername(raw)
        setError('')
        checkUsername(raw)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (status !== 'available') return
        setSubmitting(true)
        setError('')
        try {
            await createProfile({
                id: user.id,
                username,
                email: user.email,
                avatar_url: user.avatar_url ?? user.user_metadata?.avatar_url ?? null,
                display_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
            })
            await refreshProfile()
            setNeedsOnboarding(false)
        } catch (err) {
            setError(err.message || 'Failed to save. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    // ── Status indicator ──────────────────────────────────
    const indicator = {
        idle: null,
        checking: <span className="flex items-center gap-1 text-xs text-fg-muted"><Spinner size={12} />Checking availability…</span>,
        available: <span className="flex items-center gap-1 text-xs text-success"><Check className="h-3.5 w-3.5" />{username} is available.</span>,
        taken: <span className="flex items-center gap-1 text-xs text-danger"><X className="h-3.5 w-3.5" />{username} is already taken.</span>,
        invalid: <span className="text-xs text-attention">Use lowercase letters, numbers and hyphens only.</span>,
    }[status]

    const canSubmit = status === 'available' && !submitting
    const avatar = user?.avatar_url ?? user?.user_metadata?.avatar_url

    return (
        <div className="modal-overlay z-[150]">
            <div role="dialog" aria-modal="true" aria-labelledby="onboarding-title" className="modal-card max-w-md">
                <div className="px-6 pb-2 pt-8 text-center">
                    {avatar
                        ? <img src={avatar} alt="" className="avatar mx-auto h-14 w-14" />
                        : <img src="/favicon.png" alt="" className="mx-auto h-14 w-14 rounded-full ring-1 ring-line" />}
                    <h2 id="onboarding-title" className="mt-4 font-display text-xl font-semibold">Choose your username</h2>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-fg-muted">
                        This is your public handle on Skill Issue. You can change it later.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-2 px-6 py-4">
                        <label htmlFor="onboarding-username" className="form-label">Username</label>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-fg-muted">skillissue.si/user/</span>
                            <input
                                id="onboarding-username"
                                type="text"
                                value={username}
                                onChange={handleChange}
                                placeholder="your-username"
                                maxLength={30}
                                autoFocus
                                autoComplete="username"
                                aria-invalid={status === 'taken' || status === 'invalid'}
                                className={`input input-lg pl-[134px] ${status === 'available' ? '!border-success' : status === 'taken' ? '!border-danger' : status === 'invalid' ? '!border-attention' : ''}`}
                            />
                        </div>
                        <div className="min-h-[18px]" aria-live="polite">{indicator}</div>
                        <p className="form-hint">Letters, numbers and hyphens · 3 to 30 characters</p>
                        {error && <p className="flash flash-danger text-xs">{error}</p>}
                    </div>
                    <div className="border-t border-line-muted bg-canvas-subtle px-6 py-4">
                        <button type="submit" disabled={!canSubmit} className="btn-primary btn-lg btn-block">
                            {submitting ? 'Setting up your profile…' : 'Continue'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
