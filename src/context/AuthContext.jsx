import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getProfile } from '../lib/userService'

const AuthContext = createContext(null)

// ── Mock user for offline / local dev ─────────────────────────
const MOCK_USER = {
    id: 'mock-user-000',
    email: 'dev@skillissue.local',
    user_metadata: {
        full_name: 'Dev User',
        avatar_url: null,
    },
}

const MOCK_PROFILE = {
    id: 'mock-user-000',
    username: 'devuser',
    email: 'dev@skillissue.local',
    display_name: 'Dev User',
    avatar_url: null,
    bio: 'Local development account — Supabase is offline.',
    created_at: new Date().toISOString(),
}

// Set this to true to bypass Supabase auth entirely
const USE_MOCK_AUTH = !isSupabaseConfigured || import.meta.env.VITE_MOCK_AUTH === 'true'

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
        // ── MOCK MODE: auto-login with fake user ──────────
        if (USE_MOCK_AUTH) {
            console.info('🧪 Mock auth active — using local dev user')
            setUser(MOCK_USER)
            setProfile(MOCK_PROFILE)
            setNeedsOnboarding(false)
            setLoading(false)
            return
        }

        // ── REAL MODE: Supabase ───────────────────────────
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            const u = session?.user ?? null
            setUser(u)
            if (u) await fetchProfile(u.id)
            setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                const u = session?.user ?? null
                setUser(u)
                if (u) {
                    await fetchProfile(u.id)
                    setShowAuthModal(false)
                } else {
                    setProfile(null)
                    setNeedsOnboarding(false)
                }
            }
        )
        return () => subscription.unsubscribe()
    }, [fetchProfile])

    // ── Auth methods ──────────────────────────────────────

    async function signIn() {
        if (USE_MOCK_AUTH) {
            setUser(MOCK_USER)
            setProfile(MOCK_PROFILE)
            setShowAuthModal(false)
            return
        }
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        if (error) throw error
    }

    async function signInWithEmail(email, password) {
        if (USE_MOCK_AUTH) {
            setUser(MOCK_USER)
            setProfile(MOCK_PROFILE)
            setShowAuthModal(false)
            return
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
    }

    async function signUpWithEmail(email, password) {
        if (USE_MOCK_AUTH) {
            setUser(MOCK_USER)
            setProfile(MOCK_PROFILE)
            setShowAuthModal(false)
            return
        }
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        return data
    }

    async function signInWithMagicLink(email) {
        if (USE_MOCK_AUTH) {
            setUser(MOCK_USER)
            setProfile(MOCK_PROFILE)
            setShowAuthModal(false)
            return
        }
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        })
        if (error) throw error
    }

    async function signOut() {
        if (USE_MOCK_AUTH) {
            setUser(null)
            setProfile(null)
            return
        }
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        setNeedsOnboarding(false)
    }

    async function refreshProfile() {
        if (USE_MOCK_AUTH) return
        if (user) await fetchProfile(user.id)
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
        signInWithEmail,
        signUpWithEmail,
        signInWithMagicLink,
        signOut,
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
