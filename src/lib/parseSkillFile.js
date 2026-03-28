/**
 * Utility functions for parsing and validating SKILL.md files
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MIN_CONTENT_LENGTH = 20
const TITLE_MIN = 3
const TITLE_MAX = 100

/**
 * Parse YAML frontmatter from markdown content
 * Returns { metadata: object, content: string }
 */
function parseFrontmatter(content) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
    const match = content.match(frontmatterRegex)

    if (!match) {
        return { metadata: {}, content }
    }

    const frontmatterStr = match[1]
    const bodyContent = match[2]
    const metadata = {}

    // Parse simple YAML (title: value format)
    const lines = frontmatterStr.split('\n')
    for (const line of lines) {
        const colonIdx = line.indexOf(':')
        if (colonIdx > 0) {
            const key = line.substring(0, colonIdx).trim()
            let value = line.substring(colonIdx + 1).trim()

            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1)
            }

            // Parse arrays [tag1, tag2]
            if (value.startsWith('[') && value.endsWith(']')) {
                value = value.slice(1, -1).split(',').map(s => s.trim())
            }

            metadata[key] = value
        }
    }

    return { metadata, content: bodyContent }
}

/**
 * Extract title from markdown content
 * Look for first H1 heading (#...) or use filename as fallback
 */
function extractTitle(content, filename) {
    const h1Regex = /^#\s+(.+)$/m
    const match = content.match(h1Regex)

    if (match && match[1]) {
        return match[1].trim()
    }

    // Fallback to filename without extension
    if (filename) {
        return filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim()
    }

    return null
}

/**
 * Extract description from first non-empty paragraph
 */
function extractDescription(content) {
    const lines = content.split('\n')
    let description = ''

    for (const line of lines) {
        const trimmed = line.trim()
        // Skip headings, empty lines, and code blocks
        if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```')) {
            description = trimmed
            break
        }
    }

    // Limit to 500 chars
    return description.substring(0, 500).trim()
}

/**
 * Extract tags from content: look for frontmatter tags or #tags in content
 */
function extractTags(metadata, content) {
    const tags = []

    // From frontmatter
    if (metadata.tags) {
        if (Array.isArray(metadata.tags)) {
            tags.push(...metadata.tags)
        } else if (typeof metadata.tags === 'string') {
            tags.push(...metadata.tags.split(',').map(t => t.trim()))
        }
    }

    // From content (look for #tag patterns, but not at line start which would be headings)
    const hashtagRegex = /(?:^|\s)#([a-zA-Z0-9_-]+)(?:\s|$)/gm
    let match
    while ((match = hashtagRegex.exec(content)) !== null) {
        const tag = match[1]
        // Exclude common markdown patterns
        if (!['TODO', 'FIXME', 'NOTE', 'WARNING'].includes(tag.toUpperCase())) {
            if (!tags.includes(tag)) {
                tags.push(tag)
            }
        }
    }

    // Return max 10 tags
    return tags.slice(0, 10)
}

/**
 * All recognised categories.
 * Exported so UI components can re-use the same list.
 */
export const SKILL_CATEGORIES = [
    'Coding',
    'Writing',
    'Design',
    'Analysis',
    'Research',
    'Marketing',
    'Education',
    'Productivity',
    'Business',
    'DevOps',
    'Security',
    'Data Science',
    'Other',
]

/**
 * Weighted keyword map — each keyword carries a score.
 * Uses word-boundary matching (\b) so "css" won't false-positive on "discuss".
 * Higher total score wins.
 */
const CATEGORY_KEYWORDS = {
    'Coding': [
        'code', 'coding', 'programming', 'developer', 'software', 'function',
        'variable', 'algorithm', 'typescript', 'javascript', 'python', 'java',
        'rust', 'golang', 'ruby', 'swift', 'kotlin', 'react', 'vue', 'angular',
        'svelte', 'nextjs', 'node', 'api', 'backend', 'frontend', 'fullstack',
        'compiler', 'debugger', 'refactor', 'lint', 'test', 'unit test',
        'component', 'jsx', 'tsx', 'html', 'css', 'sql', 'graphql', 'rest',
        'git', 'github', 'codebase', 'repository', 'pull request', 'commit',
    ],
    'Writing': [
        'writing', 'writer', 'copywriting', 'blog', 'article', 'essay',
        'storytelling', 'narrative', 'prose', 'editing', 'proofread',
        'grammar', 'tone of voice', 'headline', 'content strategy',
        'newsletter', 'email copy', 'script', 'screenplay', 'poem',
        'technical writing', 'documentation',
    ],
    'Design': [
        'design', 'designer', 'ui', 'ux', 'user interface', 'user experience',
        'figma', 'sketch', 'wireframe', 'prototype', 'mockup', 'layout',
        'typography', 'color palette', 'illustration', 'icon', 'graphic',
        'branding', 'logo', 'visual', 'responsive', 'accessibility',
        'tailwind', 'styled-components', 'animation', 'motion',
    ],
    'Analysis': [
        'analysis', 'analytics', 'analyze', 'insight', 'metrics', 'kpi',
        'dashboard', 'report', 'trend', 'forecast', 'statistics',
        'benchmark', 'audit', 'evaluate', 'assessment', 'diagnosis',
    ],
    'Research': [
        'research', 'researcher', 'study', 'literature review', 'survey',
        'experiment', 'hypothesis', 'methodology', 'peer review', 'citation',
        'academic', 'paper', 'journal', 'thesis', 'findings',
    ],
    'Marketing': [
        'marketing', 'seo', 'sem', 'social media', 'campaign', 'ads',
        'advertising', 'conversion', 'funnel', 'brand', 'audience',
        'engagement', 'influencer', 'content marketing', 'growth',
        'landing page', 'cta', 'lead generation', 'email marketing',
    ],
    'Education': [
        'education', 'teaching', 'teacher', 'tutor', 'lesson',
        'curriculum', 'student', 'learning', 'course', 'quiz',
        'flashcard', 'explanation', 'mentor', 'training', 'workshop',
        'study guide', 'homework', 'exam',
    ],
    'Productivity': [
        'productivity', 'workflow', 'automation', 'template', 'planner',
        'schedule', 'organizer', 'task', 'to-do', 'time management',
        'notion', 'obsidian', 'calendar', 'reminder', 'habit',
        'summarize', 'summarizer', 'note-taking', 'minutes',
    ],
    'Business': [
        'business', 'startup', 'entrepreneur', 'strategy', 'pitch',
        'investor', 'revenue', 'profit', 'market', 'customer',
        'sales', 'negotiation', 'proposal', 'contract', 'invoice',
        'consulting', 'stakeholder', 'roadmap', 'okr',
    ],
    'DevOps': [
        'devops', 'ci/cd', 'pipeline', 'docker', 'kubernetes', 'k8s',
        'terraform', 'ansible', 'aws', 'azure', 'gcp', 'cloud',
        'deploy', 'deployment', 'infrastructure', 'monitoring',
        'logging', 'nginx', 'linux', 'server', 'container', 'helm',
    ],
    'Security': [
        'security', 'cybersecurity', 'encryption', 'auth', 'oauth',
        'vulnerability', 'penetration', 'firewall', 'malware', 'phishing',
        'compliance', 'gdpr', 'threat', 'incident response', 'zero trust',
    ],
    'Data Science': [
        'data science', 'machine learning', 'deep learning', 'neural network',
        'model', 'training', 'dataset', 'pandas', 'numpy', 'tensorflow',
        'pytorch', 'scikit', 'regression', 'classification', 'nlp',
        'computer vision', 'embedding', 'vector', 'llm', 'fine-tune',
        'prompt engineering', 'rag', 'transformer', 'ai model',
    ],
}

// Pre-compile regexes once at module load
const _categoryRegexes = Object.fromEntries(
    Object.entries(CATEGORY_KEYWORDS).map(([cat, words]) => [
        cat,
        words.map(w => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')),
    ])
)

/**
 * Extract category from metadata or content keywords.
 * Scoring-based: counts how many keyword hits each category gets,
 * highest score wins. No AI needed — fast & deterministic.
 */
function extractCategory(metadata, content) {
    if (metadata.category) return metadata.category

    const contentLower = content.toLowerCase()
    let bestCategory = 'Other'
    let bestScore = 0

    for (const [category, regexes] of Object.entries(_categoryRegexes)) {
        let score = 0
        for (const re of regexes) {
            const matches = contentLower.match(re)
            if (matches) score += matches.length
        }
        if (score > bestScore) {
            bestScore = score
            bestCategory = category
        }
    }

    // Require at least 2 keyword hits to avoid noisy single-word matches
    return bestScore >= 2 ? bestCategory : 'Other'
}

/**
 * Main parsing function
 * Returns { title, content, tags, description, category, warnings }
 */
export function parseSkillFile(fileContent, filename = 'skill.md') {
    const { metadata, content } = parseFrontmatter(fileContent)

    const title = metadata.title || extractTitle(content, filename)
    const description = metadata.description || extractDescription(content)
    const tags = extractTags(metadata, content)
    const category = metadata.category || extractCategory(metadata, content)

    const warnings = []

    // Content is the rest after frontmatter
    const skillContent = content.trim()

    return {
        title,
        content: skillContent,
        tags,
        description,
        category,
        warnings
    }
}

/**
 * Validate a file for upload
 * Returns { isValid: boolean, errors: string[], warnings: string[] }
 */
export function validateSkillFile(file, content) {
    const errors = []
    const warnings = []

    // Check extension
    if (!file.name.endsWith('.md')) {
        errors.push('Please upload a .md (Markdown) file')
    }

    // Check size
    if (file.size > MAX_FILE_SIZE) {
        errors.push(`File exceeds 5MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
    }

    // Check content length
    if (!content || content.trim().length < MIN_CONTENT_LENGTH) {
        errors.push('File is empty or too short')
    }

    // Try parsing and validate structure
    if (errors.length === 0) {
        try {
            const { title, content: skillContent, description } = parseSkillFile(content, file.name)

            // Validate title
            if (!title) {
                errors.push('Could not determine skill title. Try adding a # Heading at the top or title: in frontmatter')
            } else if (title.length < TITLE_MIN) {
                errors.push(`Title is too short (minimum ${TITLE_MIN} characters)`)
            } else if (title.length > TITLE_MAX) {
                errors.push(`Title is too long (maximum ${TITLE_MAX} characters)`)
            }

            // Validate content
            if (!skillContent || skillContent.trim().length < 50) {
                warnings.push('Skill content is quite short. Consider adding more detail')
            }

            // Validate description exists or will be auto-extracted
            if (!description) {
                warnings.push('No description found. Add a paragraph after the title or include description: in frontmatter')
            }

            // Check for basic markdown validity
            if (!skillContent.includes('\n')) {
                warnings.push('Skill appears to be a single line. Add more structure')
            }

        } catch (err) {
            errors.push(`Failed to parse file: ${err.message}`)
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    }
}

/**
 * Extract just the filename without extension
 */
export function extractFileNameWithoutExtension(filename) {
    return filename.replace(/\.[^/.]+$/, '')
}
