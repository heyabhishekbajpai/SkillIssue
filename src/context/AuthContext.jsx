import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { account, client, isAppwriteConfigured, OAuthProvider, ID } from '../lib/appwrite'
import { Avatars } from 'appwrite'
import { getProfile } from '../lib/userService'

const AuthContext = createContext(null)

// ── Mock user for offline / local dev ─────────────────────────
const MOCK_USER = {
    $id: 'mock-user-000',
    id: 'mock-user-000',
    email: 'dev@skillissue.local',
    name: 'Dev User',
}

const MOCK_PROFILE = {
    $id: 'mock-user-000',
    id: 'mock-user-000',
    user_id: 'mock-user-000',
    username: 'devuser',
    email: 'dev@skillissue.local',
    display_name: 'Dev User',
    avatar_url: 'https://i.pravatar.cc/150?u=devuser',
    bio: 'Local development account — Appwrite is offline.',
    created_at: new Date().toISOString(),
}

// Set this to true to bypass Appwrite auth entirely
const USE_MOCK_AUTH = !isAppwriteConfigured || import.meta.env.VITE_MOCK_AUTH === 'true'

/**
 * Enrich Appwrite user object with an avatar_url so the rest of the app
 * (particularly OnboardingModal) works identically to how it did with Supabase.
 *
 * Priority:
 * 1. Real Google profile picture via account.listIdentities()
 * 2. Appwrite Avatars initials fallback
 */
async function enrichUser(u) {
    let avatar_url = null

    // 1. Prefs — fastest: already saved by a previous login
    if (u.prefs?.avatar_url) {
        avatar_url = u.prefs.avatar_url
    }

    // 2. Live Google userinfo fetch via OAuth identity access token
    if (!avatar_url) {
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
                        avatar_url = info.picture
                        // Cache to prefs so next load is instant
                        try {
                            const prefs = await account.getPrefs()
                            await account.updatePrefs({ ...prefs, avatar_url: info.picture })
                        } catch { /* non-fatal */ }
                    }
                }
            }
        } catch { /* no OAuth identity or token expired */ }
    }

    // 3. Last resort: Appwrite initials avatar
    if (!avatar_url && isAppwriteConfigured && client) {
        try {
            const avatars = new Avatars(client)
            avatar_url = avatars.getInitials(u.name || u.email || '?').toString()
        } catch { /* ignore */ }
    }

    return {
        ...u,
        id: u.$id,
        avatar_url,
        user_metadata: {
            full_name: u.name || '',
            avatar_url,
        },
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [needsOnboarding, setNeedsOnboarding] = useState(false)
    const [loading, setLoading] = useState(true)
    const [showAuthModal, setShowAuthModal] = useState(false)

    const fetchProfile = useCallback(async (userId) => {
        try {
            const p = await getProfile(userId)
            setProfile(p)
            setNeedsOnboarding(!p)
        } catch (err) {
            console.error('fetchProfile error:', err)
            setNeedsOnboarding(false)
        }
    }, [])

    useEffect(() => {
        // ── MOCK MODE ──────────────────────────────────────
        if (USE_MOCK_AUTH) {
            console.info('🧪 Mock auth active — using local dev user')
            setUser(MOCK_USER)
            setProfile(MOCK_PROFILE)
            setNeedsOnboarding(false)
            setLoading(false)
            return
        }

        // ── REAL MODE: Appwrite ────────────────────────────
        let unsubscribe = () => { }

        async function init() {
            try {
                const u = await account.get()
                const normalised = await enrichUser(u)
                setUser(normalised)
                await fetchProfile(u.$id)
            } catch {
                // 401 = no active session — perfectly normal
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        init()

        // Subscribe to account changes (session create/delete)
        if (client) {
            unsubscribe = client.subscribe('account', async () => {
                try {
                    const u = await account.get()
                    const normalised = await enrichUser(u)
                    setUser(normalised)
                    await fetchProfile(u.$id)
                    setShowAuthModal(false)
                } catch {
                    setUser(null)
                    setProfile(null)
                    setNeedsOnboarding(false)
                }
            })
        }

        return () => { unsubscribe() }
    }, [fetchProfile])

    // ── Auth methods ──────────────────────────────────────

    async function signIn() {
        if (USE_MOCK_AUTH) {
            setUser(MOCK_USER)
            setProfile(MOCK_PROFILE)
            setShowAuthModal(false)
            return
        }
        // Google OAuth — redirects away; AuthCallback will create the session
        account.createOAuth2Session({
            provider: OAuthProvider.Google,
            success: `${window.location.origin}/auth/callback`,
            failure: `${window.location.origin}/?auth_error=oauth_failed`,
        })
    }

    async function sendOtp(email) {
        if (USE_MOCK_AUTH) {
            return MOCK_USER.$id
        }
        const token = await account.createEmailToken(ID.unique(), email)
        return token.userId
    }

    async function verifyOtp(userId, secret) {
        if (USE_MOCK_AUTH) {
            setUser(MOCK_USER)
            setProfile(MOCK_PROFILE)
            setShowAuthModal(false)
            return
        }
        await account.createSession(userId, secret)
        const u = await account.get()
        const normalised = await enrichUser(u)
        setUser(normalised)
        await fetchProfile(u.$id)
        setShowAuthModal(false)
    }

    async function signOut() {
        if (USE_MOCK_AUTH) {
            setUser(null)
            setProfile(null)
            return
        }
        await account.deleteSession('current')
        setUser(null)
        setProfile(null)
        setNeedsOnboarding(false)
    }

    async function refreshUser() {
        if (USE_MOCK_AUTH) return
        try {
            const u = await account.get()
            const normalised = await enrichUser(u)
            setUser(normalised)
            await fetchProfile(u.$id)
            setShowAuthModal(false)
        } catch {
            setUser(null)
            setProfile(null)
        }
    }

    async function refreshProfile() {
        if (USE_MOCK_AUTH) return
        if (user) await fetchProfile(user.$id ?? user.id)
    }

    const value = {
        user,
        profile,
        isLoggedIn: !!user,
        needsOnboarding,
        setNeedsOnboarding,
        loading,
        showAuthModal,
        openAuthModal: () => USE_MOCK_AUTH ? signIn() : setShowAuthModal(true),
        closeAuthModal: () => setShowAuthModal(false),
        signIn,
        sendOtp,
        verifyOtp,
        signOut,
        refreshUser,
        refreshProfile,
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
