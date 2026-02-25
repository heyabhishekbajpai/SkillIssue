import { supabase, isSupabaseConfigured } from './supabase'

function requireSupabase() {
    if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase is not configured.')
    }
}

/** Fetch a user's public profile by their auth user ID. Returns null if not found. */
export async function getProfile(userId) {
    requireSupabase()
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
    if (error) throw error
    return data
}

/** Fetch a user's public profile by username (for profile page URL). */
export async function getProfileByUsername(username) {
    requireSupabase()
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle()
    if (error) throw error
    return data
}

/** Returns aggregate stats for a user's public skills. */
export async function getProfileStats(userId) {
    requireSupabase()
    const { data, error } = await supabase
        .from('skills')
        .select('copy_count, download_count, star_count')
        .eq('user_id', userId)
        .eq('visibility', 'public')
    if (error) throw error
    return (data || []).reduce(
        (acc, s) => ({
            total_skills: acc.total_skills + 1,
            total_copies: acc.total_copies + (s.copy_count || 0),
            total_downloads: acc.total_downloads + (s.download_count || 0),
            total_stars: acc.total_stars + (s.star_count || 0),
        }),
        { total_skills: 0, total_copies: 0, total_downloads: 0, total_stars: 0 }
    )
}

/** Update a user's editable profile fields. */
export async function updateProfile({ id, display_name, bio }) {
    requireSupabase()
    const { data, error } = await supabase
        .from('users')
        .update({ display_name: display_name ?? null, bio: bio ?? null })
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return data
}

/** Returns true if the username is not taken. */
export async function isUsernameAvailable(username) {
    requireSupabase()
    const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle()
    if (error) throw error
    return data === null
}

/** Create a new public profile row linked to auth.users. */
export async function createProfile({ id, username, email, avatar_url }) {
    requireSupabase()
    const { data, error } = await supabase
        .from('users')
        .insert([{ id, username, email: email ?? null, avatar_url: avatar_url ?? null }])
        .select()
        .single()
    if (error) throw error
    return data
}

/** Derive a safe username suggestion from an email address. */
export function suggestUsername(email) {
    if (!email) return ''
    const prefix = email.split('@')[0]
    return prefix
        .toLowerCase()
        .replace(/\./g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/^-+|-+$/g, '')
}

/** Find the first available username from a base suggestion. */
export async function findAvailableUsername(base) {
    const clean = base.replace(/\d+$/, '')
    if (await isUsernameAvailable(clean)) return clean
    for (let i = 2; i <= 20; i++) {
        const candidate = `${clean}${i}`
        if (await isUsernameAvailable(candidate)) return candidate
    }
    return clean
}
