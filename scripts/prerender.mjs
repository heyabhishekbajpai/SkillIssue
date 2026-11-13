#!/usr/bin/env node
/**
 * Post-build prerendering script — Puppeteer-free.
 *
 * Reads the built dist/index.html and creates route-specific copies
 * with the correct <title>, meta description, canonical, OG tags,
 * Twitter cards, and JSON-LD structured data per page.
 *
 * This runs as pure Node.js (no headless browser needed), so it works
 * reliably on any CI/CD environment including Vercel.
 *
 * Usage:
 *   node scripts/prerender.mjs          (after `vite build`)
 *   npm run build                       (runs automatically)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const DIST_DIR = join(__dirname, '..', 'dist')

const SITE_NAME = 'Skill Issue'
const SITE_URL = 'https://skillissue.si'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`
const TWITTER_HANDLE = '@BajpaiX'

// ── Per-route SEO data ─────────────────────────────────────────
// These match exactly what each page's <SEO /> component renders.
let ROUTES = [
    {
        path: '/',
        title: `${SITE_NAME} — AI Skills Marketplace for Claude, ChatGPT, Gemini & Cursor`,
        description: 'Skill Issue is the AI skills marketplace. Discover, build, share and combine AI skills for Claude, ChatGPT, Gemini, Cursor and more. 50,000+ skills available.',
        jsonLd: {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'Organization',
                    name: 'Skill Issue',
                    url: SITE_URL,
                    logo: `${SITE_URL}/favicon.png`,
                    description: 'The AI skills marketplace. Discover, build, share and combine skills for every AI agent.',
                    sameAs: [
                        'https://www.linkedin.com/company/bajpaitech/',
                        'https://github.com/heyabhishekbajpai',
                        'https://x.com/BajpaiX',
                        'https://www.instagram.com/bajpai.tech/',
                        'https://www.youtube.com/@abhishek.bajpai',
                    ],
                },
                {
                    '@type': 'WebSite',
                    name: 'Skill Issue',
                    url: SITE_URL,
                    description: 'The AI skills marketplace — discover, build, share and combine skills for every AI agent.',
                    potentialAction: {
                        '@type': 'SearchAction',
                        target: {
                            '@type': 'EntryPoint',
                            urlTemplate: `${SITE_URL}/browse?q={search_term_string}`,
                        },
                        'query-input': 'required name=search_term_string',
                    },
                },
                {
                    '@type': 'SoftwareApplication',
                    name: 'Skill Issue',
                    applicationCategory: 'DeveloperApplication',
                    operatingSystem: 'Web',
                    url: SITE_URL,
                    description: 'AI skills marketplace — discover, build, share and combine skills for Claude, ChatGPT, Gemini, Cursor and more.',
                    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                },
                {
                    '@type': 'FAQPage',
                    mainEntity: [
                        {
                            '@type': 'Question',
                            name: 'What are AI skills?',
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: 'AI skills are structured markdown (.md) instruction files that give AI agents like Claude, ChatGPT, Gemini, and Cursor specific expertise. They contain prompts, rules, examples, and best practices that make your AI agent expert-level at a particular task.',
                            },
                        },
                        {
                            '@type': 'Question',
                            name: 'How do I use a skill?',
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: "Copy or download the skill file from Skill Issue, then add it to your AI agent. For Claude, paste it into your Project instructions. For Cursor, save it as a .md file in your .cursor/rules folder. For ChatGPT, paste it into Custom Instructions.",
                            },
                        },
                        {
                            '@type': 'Question',
                            name: 'Is Skill Issue free?',
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: 'Yes! Browsing, downloading, and using AI skills is completely free. You can also create and share your own skills at no cost using our AI-powered skill builder.',
                            },
                        },
                        {
                            '@type': 'Question',
                            name: 'Which AI agents are supported?',
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: 'Skills work with any AI agent that accepts text instructions, including Claude (Anthropic), ChatGPT (OpenAI), Gemini (Google), Cursor, GitHub Copilot, Windsurf, and more.',
                            },
                        },
                    ],
                },
            ],
        },
    },
    {
        path: '/browse',
        title: 'Browse AI Skills — Discover Skill Files for Claude, ChatGPT, Gemini & Cursor | Skill Issue',
        description: 'Explore 50,000+ AI skill files from leading companies and the community. Find skills for coding, writing, design, marketing and more.',
        jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
                { '@type': 'ListItem', position: 2, name: 'Browse Skills', item: `${SITE_URL}/browse` },
            ],
        },
    },
    {
        path: '/build',
        title: 'Build Custom AI Skill Files — AI Skill Builder | Skill Issue',
        description: 'Create custom AI skill files in seconds. Describe what you want your AI to do, and our builder generates a ready-to-use .md skill file for Claude, ChatGPT, Gemini, Cursor and more.',
        jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
                { '@type': 'ListItem', position: 2, name: 'Build', item: `${SITE_URL}/build` },
            ],
        },
    },
    {
        path: '/community',
        title: 'AI Skills Community — Discover Skill File Creators | Skill Issue',
        description: 'Meet the community of developers and creators building AI skill files. Browse profiles, discover skills, and connect with fellow AI enthusiasts.',
        jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
                { '@type': 'ListItem', position: 2, name: 'Community', item: `${SITE_URL}/community` },
            ],
        },
    },
    {
        path: '/about',
        title: 'About Skill Issue | Skill Issue',
        description: "Skill Issue is the open marketplace for AI skill files. Learn how we're helping developers supercharge Claude, ChatGPT, Gemini, Cursor and other AI agents.",
        jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Skill Issue',
            url: SITE_URL,
            logo: `${SITE_URL}/favicon.png`,
            description: 'The AI skills marketplace. Discover, build, share and combine skills for every AI agent.',
            sameAs: [
                'https://www.linkedin.com/company/bajpaitech/',
                'https://github.com/heyabhishekbajpai',
                'https://x.com/BajpaiX',
                'https://www.instagram.com/bajpai.tech/',
                'https://www.youtube.com/@abhishek.bajpai',
            ],
        },
    },
    {
        path: '/privacy',
        title: 'Privacy Policy | Skill Issue',
        description: 'Skill Issue privacy policy. Learn how we collect, use, and protect your data when you use the AI skills marketplace.',
        jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
                { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: `${SITE_URL}/privacy` },
            ],
        },
    },
    {
        path: '/terms',
        title: 'Terms of Service | Skill Issue',
        description: 'Skill Issue terms of service. Read the terms and conditions for using the AI skills marketplace.',
        jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
                { '@type': 'ListItem', position: 2, name: 'Terms of Service', item: `${SITE_URL}/terms` },
            ],
        },
    },
]

// ── HTML generation helpers ────────────────────────────────────

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function generateHead(route) {
    const canonicalUrl = `${SITE_URL}${route.path}`
    const ogImage = DEFAULT_IMAGE

    return `    <meta name="description"
        content="${escapeHtml(route.description)}" />
    <title>${escapeHtml(route.title)}</title>

    <!-- Canonical -->
    <link rel="canonical" href="${canonicalUrl}" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${escapeHtml(route.title)}" />
    <meta property="og:description" content="${escapeHtml(route.description)}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="631" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(route.title)}" />
    <meta name="twitter:description" content="${escapeHtml(route.description)}" />
    <meta name="twitter:image" content="${ogImage}" />
    <meta name="twitter:site" content="${TWITTER_HANDLE}" />

    <!-- JSON-LD Structured Data (static for crawlers that don't execute JS) -->
    <script type="application/ld+json">
    ${JSON.stringify(route.jsonLd, null, 4).split('\n').join('\n    ')}
    </script>`
}

async function prerender() {
    console.log('\n🚀 Pre-rendering static routes (no-browser mode)...\n')

    // Read the base index.html produced by Vite
    const baseHtmlPath = join(DIST_DIR, 'index.html')
    if (!existsSync(baseHtmlPath)) {
        console.error('  ❌ dist/index.html not found. Run `vite build` first.')
        process.exit(1)
    }
    const baseHtml = readFileSync(baseHtmlPath, 'utf-8')

    // Match the replaceable block in <head>:
    // From <meta name="description" through the closing </script> of JSON-LD block
    const headBlockRegex = /[ \t]*<meta name="description"[\s\S]*?<\/script>/

    if (!headBlockRegex.test(baseHtml)) {
        console.error('  ❌ Could not find meta description → JSON-LD block in dist/index.html')
        console.error('     The HTML structure may have changed. Update the regex.')
        process.exit(1)
    }

    let successCount = 0

    for (const route of ROUTES) {
        try {
            const newHead = generateHead(route)
            const html = baseHtml.replace(headBlockRegex, newHead)

            // Write to dist/{path}/index.html
            const outDir = route.path === '/'
                ? DIST_DIR
                : join(DIST_DIR, route.path)

            if (!existsSync(outDir)) {
                mkdirSync(outDir, { recursive: true })
            }

            const outFile = join(outDir, 'index.html')
            writeFileSync(outFile, html, 'utf-8')

            // Verify the file has the correct title
            const written = readFileSync(outFile, 'utf-8')
            const titleMatch = written.match(/<title>(.*?)<\/title>/)
            const canonicalMatch = written.match(/rel="canonical" href="(.*?)"/)
            console.log(`  ✅ ${route.path.padEnd(12)} → dist${route.path === '/' ? '' : route.path}/index.html`)
            console.log(`     title: ${titleMatch?.[1]?.substring(0, 60)}...`)
            console.log(`     canonical: ${canonicalMatch?.[1]}`)
            successCount++
        } catch (err) {
            console.error(`  ❌ ${route.path} failed: ${err.message}`)
        }
    }

    // ── Attempt to prerender GitHub skill pages when MongoDB is configured
    // This fetches a limited number of indexed GitHub skills and creates
    // lightweight prerendered pages containing title/description metadata.
    if (process.env.MONGODB_URI) {
        try {
            console.log('\n🔎 Attempting to prerender GitHub skill pages from MongoDB...')
            // Lazy import mongodb to avoid forcing dependency in environments without it
            const { MongoClient } = await import('mongodb')
            const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
            await client.connect()
            const dbName = process.env.MONGODB_DB || 'skillissue'
            const db = client.db(dbName)
            const coll = db.collection('github_skills')

            // Fetch a reasonable number of skills to prerender (e.g., 200)
            const skills = await coll.find({}, { projection: { repo: 1, folder_path: 1, skill_name: 1, repo_description: 1, indexed_at: 1 } })
                .sort({ stars: -1 })
                .limit(200)
                .toArray()

            console.log(`    Found ${skills.length} skills to prerender (limited).`)

            let added = 0
            for (const skill of skills) {
                const repo = skill.repo
                const folder = skill.folder_path || ''
                const display = skill.skill_name || folder.split('/').pop() || repo
                const skillPath = `/skill/github?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(folder)}`
                const routeObj = {
                    path: skillPath,
                    title: `${display} — GitHub Skill File`,
                    description: skill.repo_description || `${display} skill file from ${repo} on GitHub. Browse, copy, and use this AI skill file.`,
                    jsonLd: {
                        '@context': 'https://schema.org',
                        '@type': 'CreativeWork',
                        name: display,
                        description: skill.repo_description || '',
                    },
                }

                try {
                    const newHead = generateHead(routeObj)
                    const html = baseHtml.replace(headBlockRegex, newHead)
                    const outDir = join(DIST_DIR, 'skill', 'github')
                    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
                    // Use a stable filename derived from repo and folder
                    const fileName = `${repo.replace(/\//g, '__')}__${(folder || 'root').replace(/\//g, '__')}.html`
                    const outFile = join(outDir, fileName)
                    writeFileSync(outFile, html, 'utf-8')
                    added++
                } catch (err) {
                    // don't fail the whole prerender on a single skill
                    console.error(`    Failed to prerender skill ${repo}/${folder}: ${err.message}`)
                }
            }

            console.log(`    Prerendered ${added}/${skills.length} GitHub skill pages to dist/skill/github/`)
            await client.close()
        } catch (err) {
            console.error('    Could not prerender GitHub skills (continuing):', err.message)
        }
    } else {
        console.log('\nℹ️  MONGODB_URI not set — skipping prerender of GitHub skill pages.')
    }

    console.log(`\n🎉 Pre-rendered ${successCount}/${ROUTES.length} routes.\n`)

    if (successCount === 0) {
        console.error('⚠️  No routes were pre-rendered!')
        process.exit(1)
    }
}

prerender()
