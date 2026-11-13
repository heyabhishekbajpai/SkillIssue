import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    Search, ArrowRight, Compass, Wand2, Upload, Users, Lock, Layers,
    FileText, Star, BookMarked, Download, Copy, Terminal,
} from 'lucide-react'
import SEO, { jsonLdSchemas } from '../components/SEO'
import FAQ from '../components/FAQ'
import SkillCard from '../components/SkillCard'
import { Avatar, formatCount } from '../components/ui/primitives'
import { getAllPublicSkills } from '../lib/skillService'
import { getRecentUsers } from '../lib/userService'
import { fetchIndexedSkills } from '../lib/indexedSkillService'

const PLATFORMS = [
    ['claude-code', 'Claude Code', 'https://docs.anthropic.com/en/docs/claude-code/overview'],
    ['codex', 'Codex', 'https://openai.com/index/introducing-codex/'],
    ['gemini', 'Gemini', 'https://gemini.google.com'],
    ['cursor', 'Cursor', 'https://cursor.com'],
    ['copilot', 'Copilot', 'https://github.com/features/copilot'],
    ['windsurf', 'Windsurf', 'https://windsurf.com'],
    ['vscode', 'VS Code', 'https://code.visualstudio.com'],
    ['cline', 'Cline', 'https://cline.bot'],
    ['roo', 'Roo Code', 'https://roocode.com'],
    ['kiro-cli', 'Kiro', 'https://kiro.dev'],
    ['opencode', 'OpenCode', 'https://opencode.ai'],
    ['goose', 'Goose', 'https://block.github.io/goose/'],
    ['amp', 'Amp', 'https://ampcode.com'],
    ['trae', 'Trae', 'https://trae.ai'],
    ['antigravity', 'Antigravity', 'https://antigravity.google/'],
    ['kilo', 'Kilo Code', 'https://kilo.ai/'],
    ['droid', 'Factory', 'https://factory.ai/'],
    ['clawdbot', 'OpenClaw', 'https://openclaw.ai/'],
]

const SAMPLE_SKILL = `---
name: code-review
description: Reviews pull requests for correctness,
  security and readability. Use whenever the user
  asks to review, audit or check a diff.
---

# Code Review

## Instructions
1. Read the full diff before commenting.
2. Flag injection, auth and data-loss risks first.
3. Suggest a concrete fix for every finding.

## Output Format
| Severity | File:line | Finding | Fix |`

const FEATURES = [
    { icon: Compass, title: 'Explore the registry', body: 'Search thousands of skills indexed from public GitHub repositories and the community, filtered by category, owner and popularity.' },
    { icon: Wand2, title: 'Build with AI', body: 'Describe a task in plain language — or attach reference screenshots — and the builder drafts a complete SKILL.md you can refine.' },
    { icon: Upload, title: 'Publish your own', body: 'Upload an existing .md file. It is validated against the skill format and published to your profile in seconds.' },
    { icon: Users, title: 'Follow builders', body: 'Follow people whose skills you rely on, star the ones you use, and discuss them in comment threads.' },
    { icon: Lock, title: 'Private skills', body: 'Keep work-in-progress or internal skills private to your account until they are ready to share.' },
    { icon: Layers, title: 'Agent-agnostic', body: 'Skills are plain markdown. The same file works in Claude, ChatGPT, Gemini, Cursor, Copilot and any agent that reads instructions.' },
]

const STEPS = [
    { icon: Search, title: 'Find a skill', body: 'Search the registry or browse by category to find a skill for the job.' },
    { icon: Download, title: 'Copy or download', body: 'Copy the markdown in one click or download the whole skill folder as a .zip.' },
    { icon: Terminal, title: 'Add it to your agent', body: 'Drop the file into your agent’s rules or project instructions. It picks up the new capability immediately.' },
]

function HeroSearch() {
    const navigate = useNavigate()
    const [q, setQ] = useState('')
    return (
        <form
            role="search"
            onSubmit={(e) => {
                e.preventDefault()
                navigate(q.trim() ? `/browse?q=${encodeURIComponent(q.trim())}` : '/browse')
            }}
            className="flex w-full max-w-xl gap-2"
        >
            <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
                <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search skills, e.g. “code review”"
                    aria-label="Search skills"
                    className="input input-lg pl-9 text-[15px]"
                />
            </div>
            <button type="submit" className="btn-primary btn-lg">Search</button>
        </form>
    )
}

function CommunityStrip() {
    const [data, setData] = useState({ total: 0, avatars: [] })
    useEffect(() => { getRecentUsers().then(setData).catch(() => {}) }, [])
    if (!data.avatars.length) return null
    return (
        <div className="flex items-center gap-3 text-sm text-fg-muted">
            <div className="flex -space-x-2">
                {data.avatars.map((u, i) => (
                    <Avatar key={i} src={u.avatar_url} name={u.display_name || u.username} size={24} className="ring-2 ring-canvas" />
                ))}
            </div>
            <span>
                {data.total > 0 ? <><span className="font-semibold text-fg">{formatCount(data.total)}</span> builders have joined</> : 'Builders are joining every day'}
            </span>
        </div>
    )
}

function FeaturedSkills() {
    const navigate = useNavigate()
    const [skills, setSkills] = useState(null)
    useEffect(() => {
        getAllPublicSkills('most-rated', 6).then(setSkills).catch(() => setSkills([]))
    }, [])
    if (skills && skills.length === 0) return null
    return (
        <section aria-labelledby="featured-title">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h2 id="featured-title" className="font-display text-2xl font-semibold">Popular community skills</h2>
                    <p className="mt-1 text-sm text-fg-muted">Most-starred skills published by Skill Issue members.</p>
                </div>
                <Link to="/browse" className="link shrink-0 text-sm">View all</Link>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {skills === null
                    ? [...Array(6)].map((_, i) => (
                        <div key={i} className="box space-y-3 p-4">
                            <div className="skeleton-line h-4 w-2/3" />
                            <div className="skeleton-line h-3 w-full" />
                            <div className="skeleton-line h-3 w-4/5" />
                        </div>
                    ))
                    : skills.map((s) => <SkillCard key={s.id} skill={s} onClick={() => navigate(`/skill/${s.id}`)} />)}
            </div>
        </section>
    )
}

function TopRepositories() {
    const [state, setState] = useState({ total: 0, skills: null })
    useEffect(() => {
        fetchIndexedSkills({ limit: 6, sort: 'stars' })
            .then((d) => setState({ total: d.total, skills: d.skills || [] }))
            .catch(() => setState({ total: 0, skills: [] }))
    }, [])
    if (state.skills && state.skills.length === 0) return null
    return (
        <section aria-labelledby="indexed-title">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h2 id="indexed-title" className="font-display text-2xl font-semibold">Trending on GitHub</h2>
                    <p className="mt-1 text-sm text-fg-muted">
                        {state.total > 0 ? `${state.total.toLocaleString()} skills indexed from public repositories.` : 'Skills indexed from public repositories.'}
                    </p>
                </div>
                <Link to="/browse?source=github" className="link shrink-0 text-sm">Browse indexed skills</Link>
            </div>
            <div className="box mt-4">
                {state.skills === null
                    ? [...Array(4)].map((_, i) => (
                        <div key={i} className="box-row space-y-2">
                            <div className="skeleton-line h-4 w-1/3" />
                            <div className="skeleton-line h-3 w-2/3" />
                        </div>
                    ))
                    : state.skills.map((s) => (
                        <Link
                            key={`${s.repo}/${s.folder_path}`}
                            to={`/skill/github?repo=${encodeURIComponent(s.repo)}&path=${encodeURIComponent(s.folder_path)}`}
                            className="box-row box-row-hover flex items-start gap-3"
                        >
                            <Avatar src={s.owner_avatar} name={s.owner} size={20} square className="mt-0.5" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm">
                                    <span className="text-accent">{s.owner}</span>
                                    <span className="text-fg-muted"> / </span>
                                    <span className="font-semibold text-accent">{s.skill_name}</span>
                                </p>
                                {s.repo_description && <p className="mt-0.5 line-clamp-1 text-xs text-fg-muted">{s.repo_description}</p>}
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-fg-muted">
                                <Star className="h-3.5 w-3.5" />{formatCount(s.stars)}
                            </span>
                        </Link>
                    ))}
            </div>
        </section>
    )
}

export default function Home() {
    return (
        <>
            <SEO
                title={null}
                description="Skill Issue is the open registry for AI agent skills. Discover, build and share SKILL.md files for Claude, ChatGPT, Gemini, Cursor and more."
                path="/"
                jsonLd={{ '@graph': [jsonLdSchemas.website(), jsonLdSchemas.organization(), jsonLdSchemas.softwareApplication()] }}
            />

            {/* Hero */}
            <section className="border-b border-line-muted bg-canvas-subtle">
                <div className="container-page grid gap-10 py-12 md:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-20">
                    <div className="flex flex-col items-start gap-6">
                        <Link to="/about" className="label py-0.5 text-xs hover:border-accent hover:text-accent">
                            <FileText className="h-3 w-3" />
                            What is a SKILL.md file?
                            <ArrowRight className="h-3 w-3" />
                        </Link>
                        <h1 className="text-balance font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[56px]" style={{ fontStretch: '104%' }}>
                            The open registry for AI agent skills.
                        </h1>
                        <p className="max-w-xl text-base leading-7 text-fg-muted sm:text-lg">
                            Discover, build and share SKILL.md files that give Claude, ChatGPT, Gemini, Cursor and every other agent
                            precise, reusable expertise.
                        </p>
                        <HeroSearch />
                        <div className="flex flex-wrap items-center gap-2">
                            <Link to="/browse" className="btn">
                                <Compass className="h-4 w-4" />Explore skills
                            </Link>
                            <Link to="/build" className="btn">
                                <Wand2 className="h-4 w-4" />Build a skill
                            </Link>
                        </div>
                        <CommunityStrip />
                    </div>

                    {/* Sample skill file */}
                    <div className="box overflow-hidden shadow-overlay">
                        <div className="box-header py-2">
                            <BookMarked className="h-4 w-4 text-fg-muted" />
                            <span className="text-sm">
                                <span className="text-accent">skills</span>
                                <span className="text-fg-muted"> / </span>
                                <span className="font-semibold">code-review</span>
                                <span className="text-fg-muted"> / </span>
                                SKILL.md
                            </span>
                            <span className="ml-auto inline-flex items-center gap-1 text-xs text-fg-muted">
                                <Copy className="h-3.5 w-3.5" />Copy
                            </span>
                        </div>
                        <pre className="overflow-x-auto bg-canvas p-4 font-mono text-[12.5px] leading-[1.7] text-fg">
                            {SAMPLE_SKILL.split('\n').map((line, i) => (
                                <div key={i} className="flex">
                                    <span className="mr-4 inline-block w-5 shrink-0 select-none text-right text-fg-subtle">{i + 1}</span>
                                    <span className={`whitespace-pre ${line.startsWith('#') ? 'font-semibold text-accent' : line === '---' || /^\w+:/.test(line) ? 'text-done' : ''}`}>
                                        {line || ' '}
                                    </span>
                                </div>
                            ))}
                        </pre>
                    </div>
                </div>
            </section>

            {/* Works with */}
            <section aria-labelledby="platforms-title" className="border-b border-line-muted">
                <div className="container-page py-8">
                    <h2 id="platforms-title" className="text-center font-sans text-sm font-medium text-fg-muted">
                        Works with the agents your team already uses
                    </h2>
                    <ul className="mx-auto mt-5 grid max-w-5xl grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-9">
                        {PLATFORMS.map(([key, name, href]) => (
                            <li key={key}>
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center gap-1.5 rounded-md px-2 py-2 text-xs text-fg-muted hover:bg-canvas-subtle hover:text-fg"
                                    title={name}
                                >
                                    <img src={`/svgs/${key}.svg`} alt="" width={32} height={32} loading="lazy" className="h-8 w-8 rounded-md ring-1 ring-line-muted" />
                                    <span className="truncate">{name}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <div className="container-page space-y-14 py-12">
                <FeaturedSkills />
                <TopRepositories />

                {/* How it works */}
                <section aria-labelledby="how-title">
                    <h2 id="how-title" className="font-display text-2xl font-semibold">How it works</h2>
                    <ol className="mt-4 grid gap-4 md:grid-cols-3">
                        {STEPS.map(({ icon: Icon, title, body }, i) => (
                            <li key={title} className="box p-5">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-canvas-subtle">
                                        <Icon className="h-4 w-4 text-fg-muted" />
                                    </span>
                                    <span className="font-mono text-xs text-fg-muted">Step {i + 1}</span>
                                </div>
                                <h3 className="mt-4 font-sans text-base font-semibold">{title}</h3>
                                <p className="mt-1 text-sm leading-6 text-fg-muted">{body}</p>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* Features */}
                <section aria-labelledby="features-title">
                    <h2 id="features-title" className="font-display text-2xl font-semibold">Everything you need to manage skills</h2>
                    <div className="mt-4 grid overflow-hidden rounded-md border border-line sm:grid-cols-2 lg:grid-cols-3">
                        {FEATURES.map(({ icon: Icon, title, body }) => (
                            <div key={title} className="-mb-px -mr-px border-b border-r border-line-muted p-5">
                                <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
                                <h3 className="mt-3 font-sans text-sm font-semibold">{title}</h3>
                                <p className="mt-1 text-sm leading-6 text-fg-muted">{body}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Video */}
                <section aria-labelledby="video-title" className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-center">
                    <div>
                        <h2 id="video-title" className="font-display text-2xl font-semibold">Meet the maker</h2>
                        <p className="mt-2 text-sm leading-6 text-fg-muted">
                            Abhishek explains what Skill Issue is, why skill files matter, and how to get the most out of them in a few minutes.
                        </p>
                        <Link to="/about" className="link mt-3 inline-flex items-center gap-1 text-sm">
                            Read more about the project <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                    <div className="box overflow-hidden">
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                            <iframe
                                className="absolute inset-0 h-full w-full"
                                src="https://www.youtube-nocookie.com/embed/JUjiVIz525A?rel=0"
                                title="Skill Issue overview"
                                loading="lazy"
                                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </section>

                <FAQ />

                {/* CTA */}
                <section className="box flex flex-col items-start gap-4 bg-canvas-subtle p-6 md:flex-row md:items-center md:justify-between md:p-8">
                    <div>
                        <h2 className="font-display text-xl font-semibold">Give your agent a skill upgrade</h2>
                        <p className="mt-1 text-sm text-fg-muted">Free to browse, free to build, free to share.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link to="/browse" className="btn">Explore skills</Link>
                        <Link to="/build" className="btn-primary">Build your first skill</Link>
                    </div>
                </section>
            </div>

        </>
    )
}
