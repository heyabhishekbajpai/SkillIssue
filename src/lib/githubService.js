// ─── GitHub Service — Fetch featured skills from GitHub repos ───────────
import JSZip from 'jszip'

// ── Hardcoded featured sources ──────────────────────────────────────────
export const FEATURED_SOURCES = [
    {
        company: 'Anthropic',
        repo: 'anthropics/skills',
        skills_path: 'skills',
        github_url: 'https://github.com/anthropics/skills/tree/main/skills',
    },
    {
        company: 'Vercel',
        repo: 'vercel-labs/agent-skills',
        skills_path: 'skills',
        github_url: 'https://github.com/vercel-labs/agent-skills/tree/main/skills',
    },
    {
        company: 'OpenAI',
        repo: 'openai/skills',
        skills_path: 'skills/.curated',
        github_url: 'https://github.com/openai/skills/tree/main/skills/.curated',
    },
    {
        company: 'HuggingFace',
        repo: 'huggingface/skills',
        skills_path: 'skills',
        github_url: 'https://github.com/huggingface/skills/tree/main/skills',
    },
]

// OpenClaw is a community repo with a two-level deep structure:
// skills/ → username/ → skill-name/ → .md files
export const OPENCLAW_SOURCE = {
    company: 'OpenClaw',
    repo: 'openclaw/clawhub',
    skills_path: '.agents/skills',
    github_url: 'https://github.com/openclaw/clawhub/tree/main/.agents/skills',
}

// Community flat sources — same one-level structure as official repos but
// NOT official. Skills sit directly at the root (skills_path: '') or in
// a named subdirectory. Add more entries here to include future community repos.
export const COMMUNITY_FLAT_SOURCES = [
    {
        label: 'Composio',          // display name shown in UI
        company: 'ComposioHQ',      // GitHub org name (used for avatar)
        repo: 'ComposioHQ/awesome-claude-skills',
        skills_path: '',            // skills are at repo root level
        github_url: 'https://github.com/ComposioHQ/awesome-claude-skills',
        // Folders to skip — these are not skill packages
        excludeFolders: ['template-skill'],
    },
]

// ── In-memory cache ─────────────────────────────────────────────────────
const CACHE_TTL = 60 * 60 * 1000 // 1 hour
const cache = new Map() // key → { data, expiresAt }
// In-flight dedup: prevents React Strict Mode double-invoke (or any concurrent
// callers) from firing duplicate network requests before the cache is written.
const inFlight = new Map() // key → Promise

function getCached(key) {
    const entry = cache.get(key)
    if (entry && Date.now() < entry.expiresAt) return entry.data
    return null
}

function setCache(key, data) {
    cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL })
    inFlight.delete(key) // clean up once the result is cached
}

// Wrap an async factory so concurrent callers share the same promise.
function dedupedFetch(key, factory) {
    const cached = getCached(key)
    if (cached !== null) return Promise.resolve(cached)
    if (inFlight.has(key)) return inFlight.get(key)
    const promise = factory().then((data) => { setCache(key, data); return data })
        .catch((err) => { inFlight.delete(key); throw err })
    inFlight.set(key, promise)
    return promise
}

// ── Concurrency limiter ──────────────────────────────────────────────
// Runs async tasks with at most `limit` in-flight at a time.
// A short pause between batches keeps us under GitHub's abuse threshold.
async function runWithConcurrency(tasks, limit = 3, delayMs = 300) {
    const results = []
    for (let i = 0; i < tasks.length; i += limit) {
        const batch = tasks.slice(i, i + limit)
        const batchResults = await Promise.allSettled(batch.map((fn) => fn()))
        results.push(...batchResults)
        if (i + limit < tasks.length) {
            await new Promise((r) => setTimeout(r, delayMs))
        }
    }
    return results
}

// ── Authenticated fetch ────────────────────────────────────────────────
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN

async function ghFetch(url) {
    const headers = { Accept: 'application/vnd.github.v3+json' }
    if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`
    const res = await fetch(url, { headers })
    if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`GitHub API ${res.status}: ${text.slice(0, 200)}`)
    }
    return res.json()
}

async function ghFetchRaw(url) {
    if (!url) throw new Error('No download URL available for this file.')
    const headers = {}
    if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`
    const res = await fetch(url, { headers })
    if (!res.ok) throw new Error(`GitHub raw fetch ${res.status}`)
    return res.text()
}

// ── Repo star count ────────────────────────────────────────────────────
export async function fetchRepoStars(repo) {
    const cacheKey = `stars:${repo}`
    const cached = getCached(cacheKey)
    if (cached !== null) return cached

    try {
        const data = await ghFetch(`https://api.github.com/repos/${repo}`)
        const stars = data.stargazers_count ?? 0
        setCache(cacheKey, stars)
        return stars
    } catch {
        return 0
    }
}

// ── Repo avatar URL ────────────────────────────────────────────────────
export function getOrgAvatarUrl(repo) {
    const owner = repo.split('/')[0]
    return `https://avatars.githubusercontent.com/${owner}`
}

// Get avatar for a specific GitHub username
export function getUserAvatarUrl(username) {
    return `https://avatars.githubusercontent.com/${username}`
}

// ── List skill folders for a community flat source ───────────────────────
// Same one-level fetch as official sources but tags skills as community.
export function fetchCommunityFlatSkills(source) {
    const cacheKey = `community-flat:${source.repo}:${source.skills_path}`
    return dedupedFetch(cacheKey, async () => {
        const path = source.skills_path
        const url = `https://api.github.com/repos/${source.repo}/contents/${path}`
        const items = await ghFetch(url)
        const excluded = new Set(source.excludeFolders ?? [])

        const [stars] = await Promise.all([
            fetchRepoStars(source.repo),
        ])

        return items
            .filter((item) => item.type === 'dir' && !excluded.has(item.name))
            .map((item) => ({
                name: item.name,
                displayName: item.name
                    .replace(/[-_]/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase()),
                path: item.path,
                htmlUrl: item.html_url,
                company: source.company,
                label: source.label,
                repo: source.repo,
                githubUrl: source.github_url,
                isOpenClaw: false,
                isCommunity: true,          // marks as non-official
                author: source.label,       // displayed where verification badge would be
                attributionLabel: source.label,
                attributionUrl: source.github_url,
                stars,
            }))
    })
}

// ── List skill folders in an official source (one-level deep) ────────────
export async function fetchSkillFolders(source) {
    const cacheKey = `folders:${source.repo}:${source.skills_path}`
    const cached = getCached(cacheKey)
    if (cached !== null) return cached

    const url = `https://api.github.com/repos/${source.repo}/contents/${source.skills_path}`
    const items = await ghFetch(url)

    // Only keep directories (each is one skill package)
    const folders = items
        .filter((item) => item.type === 'dir')
        .map((item) => ({
            name: item.name,
            displayName: item.name
                .replace(/[-_]/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase()),
            path: item.path,
            htmlUrl: item.html_url,
            company: source.company,
            repo: source.repo,
            githubUrl: source.github_url,
            isOpenClaw: false,
            isCommunity: false,
        }))

    setCache(cacheKey, folders)
    return folders
}

// ── Fetch ALL OpenClaw skills via the recursive Git Tree API ───────────
// One API call. We read ONLY the 'tree' type entries at depth 3
// (skills/username/skill-name) and ignore all 8000+ blob entries entirely.
// Content is fetched on-demand when a user opens a skill in the modal.
export function fetchOpenClawSkills(source) {
    const cacheKey = `openclaw-tree:${source.repo}`
    return dedupedFetch(cacheKey, async () => {
        const treeUrl = `https://api.github.com/repos/${source.repo}/git/trees/HEAD?recursive=1`
        const data = await ghFetch(treeUrl)

        if (data.truncated) {
            console.warn('[OpenClaw] Tree response was truncated — some skills may not appear.')
        }

        const skills = []

        for (const item of data.tree) {
            // Skip blobs (files) entirely — we only care about skill FOLDERS
            if (item.type !== 'tree') continue
            const parts = item.path.split('/')
            const skillsPrefix = source.skills_path + '/'
            const skillsPrefixDepth = source.skills_path.split('/').length
            // Skill folders sit exactly one level beneath the skills root
            if (
                parts.length !== skillsPrefixDepth + 1 ||
                !item.path.startsWith(skillsPrefix)
            ) continue

            const skillName = parts[parts.length - 1]
            const htmlUrl = `https://github.com/${source.repo}/tree/main/${item.path}`

            skills.push({
                name: skillName,
                displayName: skillName
                    .replace(/[-_]/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase()),
                path: item.path,
                htmlUrl,
                company: 'OpenClaw',
                repo: source.repo,
                githubUrl: source.github_url,
                isOpenClaw: true,
                author: 'OpenClaw',
                attributionLabel: skillName,
                attributionUrl: htmlUrl,
                // Note: NO mdPath pre-loaded — content is fetched on-demand
                // when the modal opens, then discarded when it closes.
            })
        }

        return skills
    })
}

// ── List files inside a skill folder ───────────────────────────────────
export async function fetchSkillFiles(repo, folderPath) {
    const url = `https://api.github.com/repos/${repo}/contents/${folderPath}`
    const items = await ghFetch(url)

    const topFiles = items.filter((i) => i.type === 'file')
    const hasMdAtTop = topFiles.some((f) => f.name.toLowerCase().endsWith('.md'))

    // Fast path: .md files already at top level — return immediately (1 API call)
    if (hasMdAtTop) return topFiles

    // Fallback: no .md at top level — search one level deeper into sub-folders.
    // Handles repos where content is nested: skill-name/docs/SKILL.md
    const subFolders = items.filter((i) => i.type === 'dir')
    if (subFolders.length === 0) return topFiles

    const subResults = await Promise.allSettled(
        subFolders.map(async (dir) => {
            const subItems = await ghFetch(
                `https://api.github.com/repos/${repo}/contents/${dir.path}`
            )
            return subItems.filter((i) => i.type === 'file')
        })
    )

    const allFiles = [...topFiles]
    subResults.forEach((r) => { if (r.status === 'fulfilled') allFiles.push(...r.value) })
    return allFiles
}

// ── Fetch raw content of a single file (via download_url) ──────────────
export async function fetchFileContent(downloadUrl) {
    return ghFetchRaw(downloadUrl)
}

// ── Fetch file content by repo path (robust — avoids download_url = null) ─
// Uses the GitHub contents API and decodes the base64-encoded response.
// Prefer this over fetchFileContent for displaying skill content in modals.
export async function fetchFileContentByPath(repo, filePath) {
    const url = `https://api.github.com/repos/${repo}/contents/${filePath}`
    const data = await ghFetch(url)
    if (data.encoding === 'base64' && data.content) {
        // atob handles standard base64; GitHub wraps lines at 60 chars
        return atob(data.content.replace(/\n/g, ''))
    }
    // Fallback: try download_url if content is not embedded
    if (data.download_url) return ghFetchRaw(data.download_url)
    throw new Error('Unable to decode file content.')
}

// ── Fetch all featured skills (orchestrator) ───────────────────────────
// Returns { skills: [], openClawSkills: [], communitySkills: [], errors: [] }
export function fetchAllFeaturedSkills() {
    const cacheKey = 'all-featured-v3'
    return dedupedFetch(cacheKey, async () => {
        // Official sources in parallel
        const officialResults = await Promise.allSettled(
            FEATURED_SOURCES.map(async (source) => {
                const [folders, stars] = await Promise.all([
                    fetchSkillFolders(source),
                    fetchRepoStars(source.repo),
                ])
                return folders.map((folder) => ({ ...folder, stars }))
            })
        )

        // OpenClaw (two-level tree-based, one API call)
        const openClawResult = await Promise.allSettled([
            (async () => {
                const [skills, stars] = await Promise.all([
                    fetchOpenClawSkills(OPENCLAW_SOURCE),
                    fetchRepoStars(OPENCLAW_SOURCE.repo),
                ])
                return skills.map((skill) => ({ ...skill, stars }))
            })(),
        ])

        // Community flat sources (Composio, etc.) — all in parallel
        const communityFlatResults = await Promise.allSettled(
            COMMUNITY_FLAT_SOURCES.map((source) => fetchCommunityFlatSkills(source))
        )

        const officialSkills = []
        const openClawSkills = []
        const communitySkills = []
        const errors = []

        officialResults.forEach((result, i) => {
            if (result.status === 'fulfilled') {
                officialSkills.push(...result.value)
            } else {
                errors.push({ company: FEATURED_SOURCES[i].company, error: result.reason?.message || 'Unknown error' })
            }
        })

        if (openClawResult[0].status === 'fulfilled') {
            openClawSkills.push(...openClawResult[0].value)
        } else {
            errors.push({ company: 'OpenClaw', error: openClawResult[0].reason?.message || 'Unknown error' })
        }

        communityFlatResults.forEach((result, i) => {
            if (result.status === 'fulfilled') {
                communitySkills.push(...result.value)
            } else {
                errors.push({ company: COMMUNITY_FLAT_SOURCES[i].label, error: result.reason?.message || 'Unknown error' })
            }
        })

        return { skills: officialSkills, openClawSkills, communitySkills, errors }
    }) // end dedupedFetch
}

// ── Download skill as .zip ─────────────────────────────────────────────
export async function downloadSkillAsZip(repo, folderPath, skillName) {
    const files = await fetchSkillFiles(repo, folderPath)
    const downloadableFiles = files.filter((f) => f.type !== 'dir')

    if (downloadableFiles.length === 0) throw new Error('No files found in this skill.')

    // Fetch all file contents in parallel
    const contents = await Promise.all(
        downloadableFiles.map(async (f) => {
            const text = await fetchFileContentByPath(repo, f.path)
            return { name: f.name, text }
        })
    )

    // Build zip — files go at root so extracting skillName.zip gives
    // one clean folder (skillName/) from the OS, not a nested one
    const zip = new JSZip()
    contents.forEach(({ name, text }) => zip.file(name, text))

    const blob = await zip.generateAsync({ type: 'blob' })

    // Trigger download
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${skillName}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}
