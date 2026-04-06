import { next } from '@vercel/edge'

/**
 * Vercel Edge Middleware — Bot Pre-renderer for Skill Pages
 *
 * Problem: All 10,000+ skill pages are a React SPA. When Googlebot crawls
 * /skill/github?repo=X&path=Y it receives the generic index.html with the
 * same title/description on every page. Google sees 10K identical pages
 * and refuses to index them ("Discovered - currently not indexed").
 *
 * Fix: Intercept bot/crawler requests and serve a fully-rendered HTML page
 * with unique <title>, <meta description>, content, and JSON-LD per skill.
 * Regular users get the React SPA as before — zero UX change.
 */

// Known crawler user-agent patterns
const BOT_PATTERN =
    /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebot|ia_archiver|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|applebot|petalbot|semrushbot|ahrefsbot|mj12bot|dotbot|rogerbot|screaming frog/i

const SITE_URL = 'https://www.skillissue.bajpai.tech'
const SITE_NAME = 'Skill Issue'

// Only run on skill pages
export const config = {
    matcher: '/skill/github',
}

export default async function middleware(request) {
    const ua = request.headers.get('user-agent') || ''
    if (!BOT_PATTERN.test(ua)) return next()

    const url = new URL(request.url)
    const repo = url.searchParams.get('repo')
    const filePath = url.searchParams.get('path')

    if (!repo || !filePath) return next()

    try {
        // Skill name from the file path (e.g. ".github/skills/accessibility" → "accessibility")
        const rawName = filePath.split('/').pop().replace(/\.md$/i, '')
        // Humanise: "seo-audit" → "seo audit"
        const skillName = rawName.replace(/[-_]/g, ' ')

        // Fetch the raw SKILL.md from GitHub
        const rawUrl = `https://raw.githubusercontent.com/${repo}/HEAD/${filePath}`
        const contentRes = await fetch(rawUrl, {
            headers: { 'User-Agent': 'SkillIssueBot/1.0' },
        })

        let rawContent = contentRes.ok ? await contentRes.text() : ''

        // ── Extract description ─────────────────────────────────────────────
        // 1. Try YAML frontmatter description field
        let description = ''
        const fmMatch = rawContent.match(/^---[\s\S]*?---/m)
        if (fmMatch) {
            const descLine = fmMatch[0].match(/^description:\s*['"']?(.*?)['"']?\s*$/im)
            if (descLine) description = descLine[1].trim()
        }
        // 2. Fall back to first non-heading, non-yaml, non-empty paragraph
        if (!description) {
            const lines = rawContent
                .replace(/^---[\s\S]*?---\n?/m, '') // strip frontmatter
                .split('\n')
                .map(l => l.trim())
                .filter(l => l && !l.startsWith('#') && !l.startsWith('```') && !l.startsWith('|') && l.length > 30)
            description = (lines[0] || '').substring(0, 200)
        }
        if (!description) {
            description = `${skillName} AI skill file from ${repo}. Use with Claude, ChatGPT, Gemini, Cursor and other AI agents.`
        }

        // ── Build page metadata ─────────────────────────────────────────────
        const titleSkill = skillName.charAt(0).toUpperCase() + skillName.slice(1)
        const title = `${titleSkill} skill — ${repo} | ${SITE_NAME}`
        const canonicalUrl = `${SITE_URL}/skill/github?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(filePath)}`
        const repoUrl = `https://github.com/${repo}`
        const repoName = repo.split('/')[0] // owner
        const strippedDescription = description.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        const escapedDescription = description.replace(/"/g, '\\"').replace(/\\/g, '\\\\').substring(0, 200)

        // ── Render markdown content to plain HTML for indexing ──────────────
        const htmlContent = renderMarkdown(rawContent)

        // ── Full HTML page ──────────────────────────────────────────────────
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(title)}</title>
  <meta name="description" content="${strippedDescription}" />
  <link rel="canonical" href="${canonicalUrl}" />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:title" content="${escHtml(title)}" />
  <meta property="og:description" content="${strippedDescription}" />
  <meta property="og:url" content="${canonicalUrl}" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escHtml(title)}" />
  <meta name="twitter:description" content="${strippedDescription}" />

  <!-- Breadcrumb + Article JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "${SITE_URL}/" },
          { "@type": "ListItem", "position": 2, "name": "Browse Skills", "item": "${SITE_URL}/browse" },
          { "@type": "ListItem", "position": 3, "name": "${escJson(titleSkill)}", "item": "${escJson(canonicalUrl)}" }
        ]
      },
      {
        "@type": "SoftwareSourceCode",
        "name": "${escJson(titleSkill)}",
        "description": "${escJson(escapedDescription)}",
        "url": "${escJson(canonicalUrl)}",
        "codeRepository": "${escJson(repoUrl)}",
        "programmingLanguage": "Markdown",
        "isPartOf": {
          "@type": "WebSite",
          "name": "${SITE_NAME}",
          "url": "${SITE_URL}"
        }
      }
    ]
  }
  </script>

  <style>
    body { font-family: system-ui, sans-serif; max-width: 860px; margin: 0 auto; padding: 2rem 1rem; color: #1a1a1a; line-height: 1.6; }
    nav { margin-bottom: 1.5rem; font-size: 0.875rem; color: #666; }
    nav a { color: #0066cc; text-decoration: none; }
    nav a:hover { text-decoration: underline; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .meta { color: #555; font-size: 0.9rem; margin-bottom: 2rem; }
    .meta a { color: #0066cc; }
    .content h2 { font-size: 1.4rem; margin-top: 2rem; }
    .content h3 { font-size: 1.1rem; margin-top: 1.5rem; }
    .content pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow: auto; font-size: 0.85rem; }
    .content code { background: #f0f0f0; padding: 0.1em 0.3em; border-radius: 3px; font-size: 0.9em; }
    .content ul, .content ol { padding-left: 1.5rem; }
    .content blockquote { border-left: 3px solid #ddd; margin-left: 0; padding-left: 1rem; color: #555; }
    .cta { margin-top: 3rem; padding: 1.5rem; background: #f0f7ff; border-radius: 8px; }
    .cta a { color: #0066cc; font-weight: 600; }
    footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #eee; font-size: 0.85rem; color: #888; }
  </style>
</head>
<body>
  <nav>
    <a href="${SITE_URL}/">${SITE_NAME}</a> &rsaquo;
    <a href="${SITE_URL}/browse">Browse Skills</a> &rsaquo;
    ${escHtml(titleSkill)}
  </nav>

  <h1>${escHtml(titleSkill)}</h1>
  <div class="meta">
    From <a href="${repoUrl}" rel="noopener">${escHtml(repo)}</a> &middot;
    <a href="${canonicalUrl}">View interactive version</a>
  </div>

  <div class="content">
    ${htmlContent}
  </div>

  <div class="cta">
    <strong>Use this skill with your AI agent:</strong>
    <a href="${canonicalUrl}">Open on ${SITE_NAME}</a> to copy, download, or add to your library.
    Works with Claude, ChatGPT, Gemini, Cursor, Windsurf and more.
  </div>

  <footer>
    &copy; ${SITE_NAME} &mdash; <a href="${SITE_URL}/">AI Skills Marketplace</a>
  </footer>
</body>
</html>`

        return new Response(html, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
                'X-Robots-Tag': 'index, follow',
            },
        })
    } catch (err) {
        // Any error → fall through to the React SPA
        console.error('[middleware] skill prerender error:', err)
        return next()
    }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

function escJson(str) {
    return String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

/**
 * Minimal markdown → HTML converter for indexable content.
 * Handles headings, paragraphs, code blocks, inline code, bold/italic,
 * unordered/ordered lists, blockquotes, and horizontal rules.
 */
function renderMarkdown(md) {
    if (!md) return ''

    // Strip YAML frontmatter
    md = md.replace(/^---[\s\S]*?---\n?/, '')

    const lines = md.split('\n')
    const out = []
    let inCode = false
    let codeLines = []
    let inUl = false
    let inOl = false

    const closeList = () => {
        if (inUl) { out.push('</ul>'); inUl = false }
        if (inOl) { out.push('</ol>'); inOl = false }
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // Code block
        if (line.startsWith('```')) {
            if (!inCode) {
                closeList()
                inCode = true
                codeLines = []
            } else {
                out.push('<pre><code>' + escHtml(codeLines.join('\n')) + '</code></pre>')
                inCode = false
                codeLines = []
            }
            continue
        }
        if (inCode) { codeLines.push(line); continue }

        // Horizontal rule
        if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
            closeList()
            out.push('<hr/>')
            continue
        }

        // Headings — skip h1 (we render it ourselves), shift others down
        const hMatch = line.match(/^(#{1,6})\s+(.+)/)
        if (hMatch) {
            closeList()
            const level = Math.min(hMatch[1].length + 1, 6) // shift: h1→h2, h2→h3 etc
            out.push(`<h${level}>${escHtml(hMatch[2])}</h${level}>`)
            continue
        }

        // Unordered list
        const ulMatch = line.match(/^[\s]*[-*+]\s+(.+)/)
        if (ulMatch) {
            if (!inUl) { closeList(); out.push('<ul>'); inUl = true }
            out.push(`<li>${inlineMarkdown(ulMatch[1])}</li>`)
            continue
        }

        // Ordered list
        const olMatch = line.match(/^\d+\.\s+(.+)/)
        if (olMatch) {
            if (!inOl) { closeList(); out.push('<ol>'); inOl = true }
            out.push(`<li>${inlineMarkdown(olMatch[1])}</li>`)
            continue
        }

        // Blockquote
        const bqMatch = line.match(/^>\s?(.*)/)
        if (bqMatch) {
            closeList()
            out.push(`<blockquote><p>${inlineMarkdown(bqMatch[1])}</p></blockquote>`)
            continue
        }

        // Empty line
        if (!line.trim()) {
            closeList()
            out.push('')
            continue
        }

        // Regular paragraph
        closeList()
        out.push(`<p>${inlineMarkdown(line)}</p>`)
    }

    closeList()
    return out.join('\n')
}

function inlineMarkdown(str) {
    // Process markdown inline elements then escape the text portions.
    // Order matters: code and links first (to protect content inside backticks/parens).
    let out = str
    // inline code — capture before escaping
    const codeParts = []
    out = out.replace(/`([^`]+)`/g, (_, c) => {
        codeParts.push(c)
        return `\x00CODE${codeParts.length - 1}\x00`
    })
    // links
    const linkParts = []
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
        linkParts.push({ text, href })
        return `\x00LINK${linkParts.length - 1}\x00`
    })
    // escape remaining HTML
    out = escHtml(out)
    // bold+italic
    out = out.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    // bold
    out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    out = out.replace(/__(.+?)__/g, '<strong>$1</strong>')
    // italic
    out = out.replace(/\*([^*\s][^*]*?)\*/g, '<em>$1</em>')
    // restore inline code
    out = out.replace(/\x00CODE(\d+)\x00/g, (_, i) => `<code>${escHtml(codeParts[i])}</code>`)
    // restore links
    out = out.replace(/\x00LINK(\d+)\x00/g, (_, i) => {
        const { text, href } = linkParts[i]
        return `<a href="${escHtml(href)}" rel="noopener">${escHtml(text)}</a>`
    })
    return out
}
