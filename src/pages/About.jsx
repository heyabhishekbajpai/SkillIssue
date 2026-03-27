import { Link } from 'react-router-dom'
import SEO, { jsonLdSchemas } from '../components/SEO'
import Breadcrumbs from '../components/Breadcrumbs'

export default function About() {
    return (
        <>
            <SEO
                title="About Skill Issue"
                description="Skill Issue is the open marketplace for AI skill files. Learn how we're helping developers supercharge Claude, ChatGPT, Gemini, Cursor and other AI agents."
                path="/about"
                jsonLd={jsonLdSchemas.organization()}
            />
            <section className="pt-28 pb-20 min-h-screen">
                <div className="max-w-3xl mx-auto px-6 lg:px-8">
                    <Breadcrumbs items={[{ label: 'About' }]} />

                    <h1 className="font-clash font-bold text-4xl sm:text-5xl tracking-tight mb-6">
                        About <span className="text-accent">Skill Issue</span>
                    </h1>

                    <div className="space-y-6 font-satoshi text-base text-white/60 leading-relaxed">
                        <p>
                            <strong className="text-white/80">Skill Issue</strong> is the open marketplace for AI skill files —
                            community-built <code className="text-accent/90 bg-accent/10 px-1.5 py-0.5 rounded text-sm">.md</code> instruction
                            files that supercharge AI agents like Claude, ChatGPT, Gemini, Cursor, and Copilot.
                        </p>

                        <h2 className="font-clash font-semibold text-2xl text-white/90 pt-4">What Are Skill Files?</h2>
                        <p>
                            Skill files are structured markdown documents that give AI agents precise, actionable instructions
                            for specific tasks. Think of them as "apps" for your AI — install a skill file and your agent
                            instantly gains expert-level capability in that domain.
                        </p>
                        <p>
                            Whether it's writing blog posts in a specific tone, generating SEO-optimized content, debugging
                            React code, or creating marketing copy — there's a skill file for that.
                        </p>

                        <h2 className="font-clash font-semibold text-2xl text-white/90 pt-4">Our Mission</h2>
                        <p>
                            We believe AI agents should be customizable, shareable, and constantly improving. Skill Issue
                            provides the infrastructure for developers and creators to discover, build, and share skill
                            files — making every AI agent smarter.
                        </p>

                        <h2 className="font-clash font-semibold text-2xl text-white/90 pt-4">Key Features</h2>
                        <ul className="list-disc list-outside pl-5 space-y-2">
                            <li><strong className="text-white/80">Browse & Discover</strong> — Explore 8,000+ skill files across coding, writing, design, marketing, and more.</li>
                            <li><strong className="text-white/80">Build Your Own</strong> — Use our AI-powered skill builder to create custom skill files in minutes.</li>
                            <li><strong className="text-white/80">Save & Organize</strong> — Build a private vault of your favorite skills.</li>
                            <li><strong className="text-white/80">Share & Collaborate</strong> — Publish skills for the community or keep them private.</li>
                            <li><strong className="text-white/80">GitHub Integration</strong> — Import skills directly from GitHub repositories.</li>
                        </ul>

                        <h2 className="font-clash font-semibold text-2xl text-white/90 pt-4">Built By</h2>
                        <p>
                            Skill Issue is built and maintained by{' '}
                            <a href="https://www.bajpai.tech" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-[#6bbcff] underline underline-offset-2 transition-colors">
                                Abhishek Bajpai
                            </a>{' '}
                            and the open-source community.
                        </p>

                        <h2 className="font-clash font-semibold text-2xl text-white/90 pt-4">Contact</h2>
                        <p>
                            Have questions, feedback, or partnership inquiries? Reach out at{' '}
                            <a href="mailto:bajpai.connect@gmail.com" className="text-accent hover:text-[#6bbcff] underline underline-offset-2 transition-colors">
                                bajpai.connect@gmail.com
                            </a>
                        </p>
                    </div>

                    <div className="mt-12 flex gap-4">
                        <Link to="/browse" className="btn-primary">Browse Skills</Link>
                        <Link to="/build" className="btn-outline">Build a Skill</Link>
                    </div>
                </div>
            </section>
        </>
    )
}
