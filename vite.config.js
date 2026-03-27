import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import Sitemap from 'vite-plugin-sitemap'
import { VitePWA } from 'vite-plugin-pwa'

// Custom plugin: intercepts POST /api/generate and proxies to Groq API
function groqApiPlugin() {
    let envVars = {}

    return {
        name: 'groq-api-proxy',
        configResolved(config) {
            envVars = loadEnv(config.mode, config.root, '')
        },
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                if (req.url !== '/api/generate' || req.method !== 'POST') {
                    return next()
                }

                const apiKey = envVars.VITE_GROQ_API_KEY || envVars.NEXT_PUBLIC_GROQ_API_KEY
                if (!apiKey || apiKey === 'your_key_here') {
                    res.writeHead(500, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify({ error: 'GROQ_API_KEY not configured. Add VITE_GROQ_API_KEY to .env file.' }))
                    return
                }

                // Read request body
                let body = ''
                for await (const chunk of req) {
                    body += chunk
                }

                let skillName, description, previousMarkdown, refinementInstruction, images
                try {
                    const parsed = JSON.parse(body)
                    skillName = parsed.skillName
                    description = parsed.description
                    previousMarkdown = parsed.previousMarkdown
                    refinementInstruction = parsed.refinementInstruction
                    images = Array.isArray(parsed.images) ? parsed.images : [] // array of base64 data URIs
                } catch {
                    res.writeHead(400, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify({ error: 'Invalid JSON body' }))
                    return
                }

                const hasImages = images.length > 0

                // ── DEBUG ─────────────────────────────────────────────────
                console.log(`\n[SkillIssue API] Request received:`)
                console.log(`  skillName: ${skillName}`)
                console.log(`  images count: ${images.length}`)
                console.log(`  isRefinement: ${!!refinementInstruction}`)
                images.forEach((img, i) => {
                    console.log(`  image[${i}]: ${img?.slice(0, 80)}...`)
                })

                // ── Model selection ──────────────────────────────────────
                // llama-4-scout-17b is currently the ONLY vision model on Groq
                // llama-3.3-70b-versatile for text-only (larger = richer output)
                const model = hasImages
                    ? 'meta-llama/llama-4-scout-17b-16e-instruct'
                    : 'llama-3.3-70b-versatile'

                const isRefinement = !!refinementInstruction

                // ── System prompt ─────────────────────────────────────────
                const baseSystemPrompt = `You are an expert skill file generator for AI agents. A skill file is a markdown document that gives an AI agent precise, actionable instructions for a specific task or domain.

Your output must be a complete, highly detailed, immediately usable SKILL.md file. Mediocre, generic, or padded content is unacceptable. Every line must earn its place.

---

## Skill File Anatomy

Use this exact structure:

\`\`\`
---
name: skill-name-in-kebab-case
description: [Trigger-aware description — see rules below]
---

# Skill Name

[One paragraph overview: what this skill enables the AI to do and why it matters]

## Purpose
[Clear statement of the skill's goal from the AI's perspective — what problem it solves, what outcome it produces]

## When to Use This Skill
[Explicit list of triggering contexts, user phrasings, and scenarios where this skill applies — including non-obvious cases]

## Instructions
[Detailed, numbered, imperative-form steps]

## Edge Cases & Failure Modes
[Specific situations that trip up naive approaches, and how to handle them]

## Output Format
[Exact structure of the expected output — use a template block if applicable]

## Best Practices
[Concrete principles derived from domain knowledge — NOT generic advice]

## Examples
[2-3 fully worked examples with real, specific input/output detail]
\`\`\`

---

## Rules You Must Follow

### Description field — make it trigger-aware and slightly pushy
The description is the PRIMARY mechanism that tells an AI when to use this skill. A weak description = skill never gets used. Write it like this:
- State what the skill does AND when to use it
- Include specific trigger phrases and contexts
- Be slightly aggressive: "Use this skill whenever the user mentions X, Y, or Z — even if they don't explicitly ask for a skill"
- Bad: \`Helps write blog posts\`
- Good: \`Writes professional blog posts in a engaging, conversational tone. Use this whenever the user asks to write, draft, create, or improve any article, post, or written content — even if they just say 'write something about X' without mentioning a blog\`

### Instructions — imperative form, explain the why
- Write every step as a direct command: "Extract X", "Format Y as Z", NOT "You should extract X" or "Consider formatting"
- Explain WHY each step matters, not just WHAT to do — LLMs perform better when they understand the reasoning
- Be specific about inputs, outputs, conditionals, and exceptions
- Bad: \`2. Process the user's content appropriately\`
- Good: \`2. Identify the target audience from the user's description first — this determines tone, vocabulary level, and example complexity throughout the rest of the skill\`

### Keep it lean but complete
- Remove anything not actively helping the AI do the task
- No filler like "Ensure quality", "Be thorough", "Follow best practices" without specifics
- Every section should contain information the AI couldn't infer on its own

### Be domain-specific, not generic
- Include domain knowledge the AI needs that isn't common sense
- Reference real constraints, common mistakes in this domain, and non-obvious decisions
- Make the skill general enough to handle variations, not over-fitted to one narrow example

### Examples must be fully worked
- Show real, specific inputs — not \`[user input here]\`
- Show complete, realistic outputs — not \`[output would go here]\`
- Include at least one edge case example

Output ONLY the raw markdown skill file. No preamble, no explanation, no code fences around the entire file.`

                const visionSystemPrompt = `You are an expert skill file generator for AI agents. A skill file is a markdown document that gives an AI agent precise, actionable instructions for a specific task or design system.

The user has attached reference images. These images are the PRIMARY source of truth. Your job is to extract every concrete, observable detail from them and encode that knowledge into the skill file so thoroughly that an AI reading the skill file could reproduce the exact same output WITHOUT ever seeing the images.

---

## MANDATORY PRE-ANALYSIS — Do this BEFORE writing a single word of the skill file

For EACH image, produce a structured internal analysis covering ALL of the following. Be exhaustive — vague observations are failures:

**Colors (be exact):**
- Background color(s) — describe as precisely as possible: "deep navy #0a0d17", "warm off-white #f5f0e8", "pure black"
- Primary text color and opacity
- Accent/highlight color(s) — name them: "electric blue", "coral red", "mint green"
- Border/divider colors and their opacity
- Gradient directions and color stops if present
- Shadow colors and spread values

**Typography:**
- Heading font weight (thin/light/regular/medium/semibold/bold/black) and approximate size
- Body text weight and size
- Letter-spacing (tight/normal/wide/very wide)
- Line height (compact/normal/relaxed)
- Font style observations (serif/sans-serif/monospace/display, geometric vs humanist, etc.)
- Text transform patterns (uppercase labels, mixed case headings, etc.)

**Layout & Spacing:**
- Grid system: how many columns, gutter width, max-width constraints
- Spacing rhythm: padding/margin patterns (e.g. "8px base unit", "generous whitespace")
- Alignment: left-aligned, centered, asymmetric
- Section proportions and hierarchy

**UI Components (describe each visible one):**
- Buttons: shape (pill/rounded/square), border, background, hover state if visible
- Cards: border-radius, border, shadow, background, padding
- Navigation: position, transparency, border, logo treatment
- Images/media: how they're cropped, framed, or integrated
- Icons: style (outline/filled/duotone), size, color
- Badges/tags/chips: shape, color, text treatment
- Any other visible component with its exact visual treatment

**Design Mood & Patterns:**
- Overall aesthetic: glassmorphism / neumorphism / flat / brutalist / editorial / minimal / maximalist / dark mode / light mode
- Visual effects: blur, glow, grain, gradient overlays, animations implied
- Specific standout patterns: "large display text with gradient clip-path", "3-column icon grid with consistent vertical rhythm", "sticky frosted-glass navbar with 1px bottom border"

---

## WRITING THE SKILL FILE

After completing the full pre-analysis above, write the skill file. Use this exact structure:

\`\`\`
---
name: skill-name-in-kebab-case  
description: [Trigger-aware description. State what this skill produces AND when to use it. Be slightly pushy: "Use this whenever the user asks to design, build, or style X — even if they don't explicitly mention a skill"]
---

# Skill Name

[One paragraph: what this skill enables, what design system it encodes, why it produces superior output]

## Purpose
[What outcome this skill produces, written from the AI's perspective]

## Design System
[THE MOST IMPORTANT SECTION. Encode every color, typography rule, spacing system, and component style you extracted. Write this as a reference the AI must follow strictly:
- Color palette: list every color with specific descriptions
- Typography: heading/body/label rules with exact weights and sizes
- Spacing: the base unit and rhythm
- Component rules: exact border-radius, border style, shadow, background for each component type
- Layout rules: grid, max-width, column system]

## When to Use This Skill
[Specific trigger scenarios and user phrasings]

## Instructions
[Numbered, imperative-form steps. Each step references SPECIFIC values from the Design System above. No generic steps.]

## Edge Cases & Gotchas
[Common mistakes when implementing this design system, and how to avoid them]

## Output Format
[What the final output looks like — structure, file format, key elements]

## Examples
[2-3 fully worked examples. Example inputs are specific user requests. Example outputs describe the EXACT design decisions made, referencing the design system values.]
\`\`\`

---

## ABSOLUTE PROHIBITIONS — Violating these makes the skill file worthless:

- NEVER write "similar to the images", "as shown in the reference", "based on the provided images", "inspired by", "mirroring the style", or ANY phrase that references the images
- NEVER use placeholder values like "[color]", "[font]", "[spacing]"
- NEVER write vague instructions like "use appropriate colors" or "follow the design language" without specifying exact values
- NEVER skip the Design System section or make it generic
- Every color must be specifically named. Every component must have specific border-radius, border, shadow, and background values. Every typography rule must have specific weight and size.

If an AI agent reading your skill file would need to see the images to understand what to do, you have failed. The skill file must be 100% self-contained.

## LENGTH REQUIREMENT
A skill file generated from images MUST be comprehensive. The Design System section alone should be at minimum 400 words, listing every color, every component, every typography rule with precise values. The complete skill file should be 700+ words. A short or sparse output is an incomplete output — keep writing until every visual detail from the images is encoded.

Output ONLY the raw markdown skill file. No preamble, no explanation, no code fences around the entire file.`

                const systemPrompt = hasImages ? visionSystemPrompt : baseSystemPrompt

                // ── User prompt ───────────────────────────────────────────
                let userPromptText = ''
                if (isRefinement) {
                    userPromptText = `Improve this existing skill file based on the refinement request below.

Skill Name: ${skillName}

Current Skill File:
${previousMarkdown}

Refinement Request: "${refinementInstruction}"

${hasImages ? `There are ${images.length} reference image(s) attached. Re-examine them thoroughly. Extract any details you may have missed in the previous version and encode them concretely. Do NOT reference the images in the output — all extracted information must be written as self-contained instructions.` : ''}

Requirements for the refined version:
- Apply the refinement request faithfully and specifically
- Keep everything that was already working well
- Improve any sections that are vague, generic, or padded
- Ensure the description field is trigger-aware and slightly pushy
- Ensure all instructions are in imperative form with reasoning
- Include fully-worked examples with real specific detail

Return ONLY the complete updated skill file markdown. Nothing else.`
                } else if (hasImages) {
                    userPromptText = `I am attaching ${images.length} reference image${images.length > 1 ? 's' : ''} for you to analyze.

Skill Name: ${skillName}

What this skill should do:
${description}

Before writing anything, mentally analyze each image in full detail:
- Every color with precise descriptions (e.g. "deep navy #0a0d17", "electric blue accent #4ba9ff", "pure white/90 text")
- Typography: font weights, approximate sizes, letter-spacing, line height
- Layout: column count, grid, spacing rhythm, max-width
- Every UI component: border-radius, border style, background, shadow, padding
- Visual effects: blur, glow, gradients, grain, transparency
- Overall aesthetic and standout patterns

This mental pre-analysis is for your eyes only — do NOT write it in your response.

YOUR RESPONSE MUST START IMMEDIATELY WITH THE --- FRONTMATTER. The very first characters of your output must be:
---
name: ...
description: ...
---

Everything you extracted from the images goes into the Design System section of the skill file. The skill file must be so specific and self-contained that an AI reading it alone — without ever seeing the images — could reproduce the exact design language.`
                } else {
                    userPromptText = `Create a complete, detailed skill file for the following.

Skill Name: ${skillName}

What it should do:
${description}

Requirements:
- The description field must be trigger-aware: state what the skill does and when to use it, including specific phrase triggers
- All instructions must be in imperative form ("Do X", not "You should do X") with the WHY explained for each step
- Include real domain knowledge specific to this skill — constraints, common mistakes, non-obvious decisions
- The Edge Cases & Failure Modes section must address at least 3 real scenarios
- All examples must show real, specific inputs and complete outputs — no placeholder brackets
- Make the skill general enough to handle variations, not over-fitted to the description above

Produce a skill file that an AI agent could pick up and immediately use to produce expert-quality output.`
                }

                // ── Build messages ────────────────────────────────────────
                let userMessage
                if (hasImages) {
                    // Build content array: all images first, then the text prompt
                    const contentParts = images.map((dataUri) => ({
                        type: 'image_url',
                        image_url: { url: dataUri },
                    }))
                    contentParts.push({ type: 'text', text: userPromptText })

                    userMessage = { role: 'user', content: contentParts }
                } else {
                    userMessage = { role: 'user', content: userPromptText }
                }

                try {
                    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`,
                        },
                        body: JSON.stringify({
                            model,
                            messages: [
                                { role: 'system', content: systemPrompt },
                                userMessage,
                            ],
                            temperature: 0.7,
                            max_tokens: hasImages ? 8192 : 4096,
                        }),
                    })

                    if (!response.ok) {
                        const errorData = await response.json()
                        res.writeHead(response.status, { 'Content-Type': 'application/json' })
                        res.end(JSON.stringify({ error: `Groq API error: ${JSON.stringify(errorData)}` }))
                        return
                    }

                    const data = await response.json()
                    const markdown = data.choices?.[0]?.message?.content || ''

                    res.writeHead(200, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify({ markdown }))
                } catch (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify({ error: `Server error: ${err.message}` }))
                }
            })
        },
    }
}

export default defineConfig({
    plugins: [
        react(),
        groqApiPlugin(),
        Sitemap({
            hostname: 'https://skillissue.bajpai.tech',
            dynamicRoutes: ['/build', '/browse', '/skill/github', '/community', '/about', '/privacy', '/terms'],
            generateRobotsTxt: false,
        }),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.png', 'skill-issue-white.png'],
            manifest: {
                name: 'Skill Issue',
                short_name: 'SkillIssue',
                description: 'The marketplace for AI skill files. Discover, save, share and combine skill files for Claude, ChatGPT, Gemini, Cursor and more.',
                theme_color: '#0a0e1a',
                background_color: '#0a0e1a',
                display: 'standalone',
                orientation: 'portrait',
                start_url: '/',
                scope: '/',
                icons: [
                    {
                        src: '/favicon.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/favicon.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/api\.fontshare\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'font-cache',
                            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                        },
                    },
                ],
            },
        }),
    ],
})
