import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { account } from '../lib/appwrite'
import { useAuth } from '../context/AuthContext'

export default function AuthCallback() {
    const navigate = useNavigate()
    const { refreshUser } = useAuth()
    const ran = useRef(false)

    useEffect(() => {
        // Strict-mode safe — only run once
        if (ran.current) return
        ran.current = true

        async function handleCallback() {
            const params = new URLSearchParams(window.location.search)

            // OAuth error from provider
            const error = params.get('error')
            const errorDescription = params.get('error_description')
            if (error) {
                console.error('OAuth error:', error, errorDescription)
                navigate('/?auth_error=' + encodeURIComponent(errorDescription || error), { replace: true })
                return
            }

            // Appwrite OAuth / Magic Link callback delivers userId + secret
            const userId = params.get('userId')
            const secret = params.get('secret')

            if (userId && secret) {
                try {
                    await account.createSession({ userId, secret })

                    // ── After OAuth session is created, grab the real Google ──
                    // profile picture via the provider access token and save it
                    // to account prefs so enrichUser() can read it later.
                    try {
                        const identities = await account.listIdentities()
                        const googleIdentity = identities.identities?.find(i => i.provider === 'google')
                        if (googleIdentity?.providerAccessToken) {
                            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                                headers: { Authorization: `Bearer ${googleIdentity.providerAccessToken}` },
                            })
                            if (res.ok) {
                                const info = await res.json()
                                if (info.picture) {
                                    const current = await account.getPrefs()
                                    await account.updatePrefs({ ...current, avatar_url: info.picture })
                                }
                            }
                        }
                    } catch (prefErr) {
                        // Non-fatal — avatar will fall back to initials
                        console.warn('Could not fetch Google avatar:', prefErr)
                    }

                } catch (err) {
                    console.error('Session creation failed:', err)
                    navigate('/?auth_error=' + encodeURIComponent(err.message), { replace: true })
                    return
                }
            }

            // Explicitly refresh auth state — the Realtime subscription is
            // subscribed without an active session so it won't fire reliably
            // for brand-new accounts.
            await refreshUser()
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
