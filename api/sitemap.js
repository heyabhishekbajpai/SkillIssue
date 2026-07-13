/**
 * API: Dynamic XML Sitemap
 *
 * GET /api/sitemap.xml
 *
 * Generates a sitemap including:
 *  - All static routes
 *  - All indexed GitHub skills from MongoDB
 *
 * This gives search engines a complete map of every indexable page.
 */

import { getDb, COLLECTIONS } from './lib/mongodb.js'

const SITE_URL = 'https://www.skillissue.bajpai.tech'

const STATIC_ROUTES = [
    { path: '/',          priority: '1.0', changefreq: 'daily' },
    { path: '/browse',    priority: '0.9', changefreq: 'daily' },
    { path: '/build',     priority: '0.8', changefreq: 'weekly' },
    { path: '/community', priority: '0.7', changefreq: 'daily' },
    { path: '/about',     priority: '0.6', changefreq: 'monthly' },
    { path: '/privacy',   priority: '0.3', changefreq: 'yearly' },
    { path: '/terms',     priority: '0.3', changefreq: 'yearly' },
]

export default async function handler(req, res) {
    // Support HEAD requests (some crawlers probe with HEAD before GET)
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return res.status(405).json({ error: 'Method Not Allowed' })
    }

    try {
        // ── Static URLs ─────────────────────────────────────────
        let urls = STATIC_ROUTES.map(r => `
    <url>
        <loc>${SITE_URL}${r.path}</loc>
        <changefreq>${r.changefreq}</changefreq>
        <priority>${r.priority}</priority>
    </url>`)

        // ── Dynamic: GitHub skills from MongoDB ─────────────────
        try {
            const db = await getDb()
            const coll = db.collection(COLLECTIONS.GITHUB_SKILLS)

            // Fetch all skills (just enough fields for URLs)
            const skills = await coll.find(
                {},
                {
                    projection: { repo: 1, file_path: 1, indexed_at: 1 },
                    sort: { stars: -1 },
                    limit: 10000,
                }
            ).toArray()

            for (const skill of skills) {
                // repo is already "owner/reponame", file_path is the full path to the .md file
                const skillUrl = `${SITE_URL}/skill/github?repo=${encodeURIComponent(skill.repo)}&amp;path=${encodeURIComponent(skill.file_path || '')}`
                const lastmod = skill.indexed_at ? new Date(skill.indexed_at).toISOString().split('T')[0] : ''
                urls.push(`
    <url>
        <loc>${skillUrl}</loc>${lastmod ? `\n        <lastmod>${lastmod}</lastmod>` : ''}
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
    </url>`)
            }
        } catch (dbErr) {
            // If MongoDB is unavailable, still return static routes
            console.error('[sitemap] MongoDB error (continuing with static routes):', dbErr.message)
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

        res.setHeader('Content-Type', 'application/xml')
        res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200')
        return res.status(200).end(xml)

    } catch (err) {
        console.error('[sitemap] Error:', err)
        return res.status(500).json({ error: 'Failed to generate sitemap' })
    }
}
