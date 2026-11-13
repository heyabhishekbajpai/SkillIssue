import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { X, Mail, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { GoogleMark, Spinner } from './ui/primitives'

export default function AuthModal({ contextText }) {
    const { closeAuthModal, signIn, sendOtp, verifyOtp } = useAuth()

    const [tab, setTab] = useState('google')
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [userId, setUserId] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') closeAuthModal() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [closeAuthModal])

    async function handleGoogle() {
        setLoading(true)
        setError('')
        try {
            await signIn() // browser redirects; keep the loading state
        } catch (err) {
            setError(err.message)
            setLoading(false)
        }
    }

    async function handleSendOtp(e) {
        e.preventDefault()
        if (!email.trim()) return setError('Please enter your email.')
        setLoading(true)
        setError('')
        try {
            const id = await sendOtp(email.trim())
            setUserId(id)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleVerifyOtp(e) {
        e.preventDefault()
        if (!otp.trim()) return setError('Please enter the code.')
        setLoading(true)
        setError('')
        try {
            await verifyOtp(userId, otp.trim()) // AuthContext closes the modal
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={closeAuthModal}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="auth-title"
                className="modal-card max-w-[380px]"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={closeAuthModal}
                    className="btn-invisible btn-icon btn-sm absolute right-3 top-3"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="px-6 pb-2 pt-8 text-center">
                    <img src="/favicon.png" alt="" width={48} height={48} className="mx-auto h-12 w-12 rounded-full ring-1 ring-line" />
                    <h2 id="auth-title" className="mt-4 font-display text-xl font-semibold">
                        {contextText || 'Sign in to Skill Issue'}
                    </h2>
                    <p className="mt-1 text-sm text-fg-muted">Save, build and share skill files.</p>
                </div>

                <div className="p-6 pt-4">
                    {!userId && (
                        <div className="segmented mb-4 flex w-full">
                            {[['google', 'Google'], ['email', 'Email code']].map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    aria-pressed={tab === key}
                                    onClick={() => { setTab(key); setError('') }}
                                    className="flex-1"
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}

                    {!userId && tab === 'google' && (
                        <button type="button" onClick={handleGoogle} disabled={loading} className="btn btn-lg btn-block">
                            {loading ? <Spinner /> : <GoogleMark />}
                            {loading ? 'Redirecting…' : 'Continue with Google'}
                        </button>
                    )}

                    {tab === 'email' && !userId && (
                        <form onSubmit={handleSendOtp} className="space-y-3">
                            <div>
                                <label htmlFor="auth-email" className="form-label">Email address</label>
                                <input
                                    id="auth-email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                                    placeholder="you@example.com"
                                    className="input input-lg"
                                />
                            </div>
                            <button type="submit" disabled={loading} className="btn-primary btn-lg btn-block">
                                {loading ? <Spinner className="text-fg-onemphasis" /> : <Mail className="h-4 w-4" />}
                                {loading ? 'Sending code…' : 'Send sign-in code'}
                            </button>
                        </form>
                    )}

                    {tab === 'email' && userId && (
                        <form onSubmit={handleVerifyOtp} className="space-y-3">
                            <p className="text-sm text-fg-muted">
                                Enter the 6-digit code sent to <span className="font-semibold text-fg">{email}</span>.
                            </p>
                            <div>
                                <label htmlFor="auth-otp" className="form-label">Verification code</label>
                                <input
                                    id="auth-otp"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    value={otp}
                                    onChange={(e) => { setOtp(e.target.value); setError('') }}
                                    placeholder="123456"
                                    maxLength={6}
                                    className="input input-lg text-center font-mono tracking-[0.4em]"
                                />
                            </div>
                            <button type="submit" disabled={loading} className="btn-primary btn-lg btn-block">
                                {loading ? 'Verifying…' : 'Verify and sign in'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setUserId(null); setOtp(''); setError('') }}
                                className="btn-invisible btn-block"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Use a different email
                            </button>
                        </form>
                    )}

                    {error && <p className="flash flash-danger mt-3 text-xs" role="alert">{error}</p>}
                </div>

                <div className="border-t border-line-muted bg-canvas-subtle px-6 py-3 text-center text-xs text-fg-muted">
                    By continuing you agree to the{' '}
                    <Link to="/terms" onClick={closeAuthModal} className="link">Terms</Link> and{' '}
                    <Link to="/privacy" onClick={closeAuthModal} className="link">Privacy Policy</Link>.
                </div>
            </div>
        </div>
    )
}
