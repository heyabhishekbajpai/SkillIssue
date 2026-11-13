import { Link } from 'react-router-dom'
import { Compass, Wand2 } from 'lucide-react'
import SEO, { jsonLdSchemas } from '../components/SEO'
import Breadcrumbs from '../components/Breadcrumbs'
import DocLayout from '../components/DocLayout'

const SKILL_EXAMPLE = `---
name: blog-post-writer
description: Writes engaging blog posts in a conversational tone.
  Use whenever the user asks to draft or improve an article.
---

# Blog Post Writer

## Instructions
1. Ask for the audience and goal before writing.
2. Open with a concrete hook, not a definition.

## Output Format
Markdown with an H1 title, short intro and H2 sections.`

export default function About() {
    return (
        <>
            <SEO
                title="About Skill Issue"
                description="Skill Issue is the open registry for AI skill files. Learn how it helps developers equip Claude, ChatGPT, Gemini, Cursor and other AI agents."
                path="/about"
                jsonLd={jsonLdSchemas.organization()}
            />
            <DocLayout>
                <Breadcrumbs items={[{ label: 'About' }]} />
                <h1 className="border-b border-line-muted pb-4 font-display text-3xl font-semibold">About Skill Issue</h1>

                <div className="markdown-body mt-6">
                    <p>
                        <strong>Skill Issue</strong> is the open registry for AI skill files: community-built <code>.md</code> instruction
                        files that give AI agents like Claude, ChatGPT, Gemini, Cursor and Copilot precise, reusable expertise.
                    </p>

                    <h2 id="what-are-skill-files">What are skill files?</h2>
                    <p>
                        Skill files are structured markdown documents that give an agent actionable instructions for a specific task.
                        Add a skill file to your agent and it gains that capability: writing in a particular tone, generating SEO-ready
                        content, debugging React code or drafting marketing copy.
                    </p>

                    <h2 id="skill-format">The SKILL.md format</h2>
                    <p>
                        A skill starts with YAML frontmatter. The <code>description</code> tells the agent <em>when</em> to use the skill,
                        so it should name concrete triggers. The body holds numbered instructions, edge cases, the expected output format and
                        worked examples.
                    </p>
                    <pre><code>{SKILL_EXAMPLE}</code></pre>
                    <table>
                        <thead>
                            <tr><th>Agent</th><th>Where to put the skill</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>Claude Code</td><td><code>.claude/skills/&lt;name&gt;/SKILL.md</code></td></tr>
                            <tr><td>Cursor</td><td><code>.cursor/rules/&lt;name&gt;.md</code></td></tr>
                            <tr><td>Claude, ChatGPT, Gemini</td><td>Project instructions, custom instructions or the system prompt</td></tr>
                        </tbody>
                    </table>

                    <h2 id="mission">Our mission</h2>
                    <p>
                        AI agents should be customizable, shareable and constantly improving. Skill Issue provides the infrastructure for
                        developers and creators to discover, build and share skill files, so every agent can get better at real work.
                    </p>

                    <h2 id="features">Key features</h2>
                    <ul>
                        <li><strong>Explore</strong>: search skill files across coding, writing, design, marketing and more, including skills indexed from public GitHub repositories.</li>
                        <li><strong>Build</strong>: describe a task and the AI-powered builder drafts a complete skill file you can refine.</li>
                        <li><strong>Save and organize</strong>: star skills, save them to your profile and keep private skills to yourself.</li>
                        <li><strong>Share</strong>: publish skills to the community, follow builders and discuss skills in comments.</li>
                    </ul>

                    <h2 id="built-by">Built by</h2>
                    <p>
                        Skill Issue is built and maintained by{' '}
                        <a href="https://www.bajpai.tech" target="_blank" rel="noopener noreferrer">Abhishek Bajpai</a> and the open-source community.
                    </p>

                    <h2 id="contact">Contact</h2>
                    <p>
                        Questions, feedback or partnership inquiries: <a href="mailto:bajpai.connect@gmail.com">bajpai.connect@gmail.com</a>
                    </p>
                </div>

                <div className="mt-10 flex flex-wrap gap-2 border-t border-line-muted pt-6">
                    <Link to="/browse" className="btn-primary"><Compass className="h-4 w-4" />Explore skills</Link>
                    <Link to="/build" className="btn"><Wand2 className="h-4 w-4" />Build a skill</Link>
                </div>
            </DocLayout>
        </>
    )
}
