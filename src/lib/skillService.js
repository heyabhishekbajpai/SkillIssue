import { supabase, isSupabaseConfigured } from './supabase'

function requireSupabase() {
    if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
    }
}

/** Save a generated skill to Supabase. */
export async function saveSkill({ title, content, tags = [], visibility = 'private', description = '', category = '' }) {
    requireSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('You must be signed in to save a skill.')

    const { data, error } = await supabase
        .from('skills')
        .insert([{ user_id: user.id, title, content, tags, visibility, description, category }])
        .select()
        .single()

    if (error) throw error
    return data
}

/** Fetch all skills belonging to the currently signed-in user. */
export async function getUserSkills() {
    requireSupabase()
    const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('created_at', { ascending: false })
    if (error) throw error
    return data
}

/** Fetch all PUBLIC skills for a given user, with optional sort. */
export async function getPublicSkillsByUser(userId, sort = 'recent') {
    requireSupabase()
    const sortMap = {
        'recent': { column: 'created_at', ascending: false },
        'most-rated': { column: 'star_count', ascending: false },
        'most-copied': { column: 'copy_count', ascending: false },
    }
    const { column, ascending } = sortMap[sort] ?? sortMap['recent']

    const { data, error } = await supabase
        .from('skills')
        .select('id, title, description, category, tags, star_count, copy_count, download_count, created_at, visibility')
        .eq('user_id', userId)
        .eq('visibility', 'public')
        .order(column, { ascending })

    if (error) throw error
    return data || []
}

/** Fetch all PRIVATE skills for the owner of a profile. */
export async function getPrivateSkillsByUser(userId) {
    requireSupabase()
    const { data, error } = await supabase
        .from('skills')
        .select('id, title, description, category, tags, created_at, visibility')
        .eq('user_id', userId)
        .eq('visibility', 'private')
        .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
}

/** Toggle a skill between public and private. */
export async function toggleVisibility(skillId, newVisibility) {
    requireSupabase()
    const { data, error } = await supabase
        .from('skills')
        .update({ visibility: newVisibility })
        .eq('id', skillId)
        .select()
        .single()
    if (error) throw error
    return data
}

/** Delete a skill by id. */
export async function deleteSkill(id) {
    requireSupabase()
    const { error } = await supabase.from('skills').delete().eq('id', id)
    if (error) throw error
}

/** Update an existing skill. */
export async function updateSkill(id, { title, content, tags }) {
    requireSupabase()
    const { data, error } = await supabase
        .from('skills')
        .update({ title, content, tags, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return data
}
