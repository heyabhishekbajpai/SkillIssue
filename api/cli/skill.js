/**
 * API: CLI skill lookup
 *
 * GET /api/cli/skill?name=frontend-design
 *
 * Used by the Skill Issue CLI (`npx skillissue add <name>`) to resolve
 * a skill slug to its GitHub repo/path so the CLI can fetch SKILL.md
 * directly from raw.githubusercontent.com.
 *
 * Read-only, no auth. CORS: *.
 */

import { getDb, COLLECTIONS } from '../lib/mongodb.js';

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Derive the default branch by parsing the stored html_url which looks like
//   https://github.com/{owner}/{repo}/tree/{branch}/{folder_path}
// Falls back to "main" for root-level skills (html_url has no /tree/).
function extractBranch(htmlUrl) {
    if (!htmlUrl) return 'main';
    const m = htmlUrl.match(/\/tree\/([^/]+)\//);
    return m ? m[1] : 'main';
}

function titleCase(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export default async function handler(req, res) {
    // CORS — CLI hits this from any user machine
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const name = (req.query.name || '').toString().trim();
    if (!name) {
        return res.status(400).json({ success: false, error: 'Missing required query parameter: name' });
    }

    try {
        const db = await getDb();
        const coll = db.collection(COLLECTIONS.GITHUB_SKILLS);

        // Users query by folder slug (e.g. "frontend-design"), which is the
        // second-to-last segment of file_path (…/{slug}/SKILL.md).
        // Also match the title-cased skill_name form ("Frontend Design") for
        // convenience. Case-insensitive throughout.
        const escaped = escapeRegex(name);
        const slugRe = new RegExp(`(^|/)${escaped}/SKILL\\.md$`, 'i');
        const nameSpaced = name.replace(/[-_]/g, ' ');
        const nameRe = new RegExp(`^${escapeRegex(nameSpaced)}$`, 'i');

        // Pick the highest-starred match when a slug appears in multiple repos.
        const doc = await coll.findOne(
            {
                $or: [
                    { file_path: slugRe },
                    { skill_name: nameRe },
                ],
            },
            {
                sort: { stars: -1 },
                projection: {
                    _id: 0,
                    skill_name: 1,
                    repo: 1,
                    file_path: 1,
                    folder_path: 1,
                    owner: 1,
                    stars: 1,
                    html_url: 1,
                },
            }
        );

        if (!doc) {
            res.setHeader('Cache-Control', 'no-store');
            return res.status(404).json({ success: false, error: 'Skill not found' });
        }

        const branch = extractBranch(doc.html_url);
        const rawUrl = `https://raw.githubusercontent.com/${doc.repo}/${branch}/${doc.file_path}`;

        // Cache successful lookups at the edge (skills change rarely).
        res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');

        return res.status(200).json({
            success: true,
            skill: {
                name,
                repo: doc.repo,
                path: doc.folder_path,
                github_url: doc.html_url,
                raw_url: rawUrl,
                company: titleCase(doc.owner),
                stars: doc.stars,
            },
        });
    } catch (err) {
        console.error('CLI skill lookup error:', err.message);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
