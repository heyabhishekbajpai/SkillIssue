import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
    const navigate = useNavigate()
    const ran = useRef(false)

    useEffect(() => {
        // Strict-mode safe — only run once
        if (ran.current) return
        ran.current = true

        async function handleCallback() {
            const params = new URLSearchParams(window.location.search)
            const code = params.get('code')
            const error = params.get('error')
            const errorDescription = params.get('error_description')

            // OAuth error from provider
            if (error) {
                console.error('OAuth error:', error, errorDescription)
                navigate('/?auth_error=' + encodeURIComponent(errorDescription || error), { replace: true })
                return
            }

            // PKCE flow — exchange code for session
            if (code) {
                try {
                    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
                    if (exchangeError) throw exchangeError
                } catch (err) {
                    console.error('Code exchange failed:', err)
                    navigate('/?auth_error=' + encodeURIComponent(err.message), { replace: true })
                    return
                }
            }

            // On success, redirect home — onAuthStateChange in AuthContext
            // will pick up the new session automatically
            navigate('/', { replace: true })
        }

        handleCallback()
    }, [navigate])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            {/* Spinner */}
            <div className="w-10 h-10 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
            <p className="font-satoshi text-sm text-white/40">Finishing sign-in…</p>
        </div>
    )
}
