import { ChevronRight } from 'lucide-react'
import SEO, { jsonLdSchemas } from './SEO'

export const FAQS = [
    {
        question: 'What are AI skills?',
        answer: 'AI skills are structured markdown (.md) instruction files that give AI agents like Claude, ChatGPT, Gemini, and Cursor specific expertise. They contain prompts, rules, examples, and best practices that make your AI agent expert-level at a particular task — from writing blog posts and debugging code to creating marketing copy and building APIs.',
    },
    {
        question: 'How do I use a skill?',
        answer: 'Copy or download the skill file from Skill Issue, then add it to your AI agent. For Claude, paste it into your Project instructions or system prompt. For Cursor, save it as a .md file in your .cursor/rules folder. For ChatGPT, paste it into the Custom Instructions. The AI agent immediately gains the capability described in the skill.',
    },
    {
        question: 'Is Skill Issue free?',
        answer: 'Yes. Browsing, downloading, and using AI skills is completely free. You can also create and share your own skills at no cost using the AI-powered skill builder.',
    },
    {
        question: 'Which AI agents are supported?',
        answer: 'Skills work with any AI agent that accepts text instructions. This includes Claude (Anthropic), ChatGPT (OpenAI), Gemini (Google), Cursor, GitHub Copilot, Windsurf, and any other LLM-based tool. Most skills are agent-agnostic — they work across all platforms.',
    },
    {
        question: 'How do I create my own skill?',
        answer: 'Use the Skill Builder at skillissue.si/build. Describe what you want the skill to do, and the builder generates a complete, structured skill file for you. You can edit, refine, and publish it to the registry — or keep it private.',
    },
    {
        question: 'What makes skills different from regular prompts?',
        answer: 'Regular prompts are one-off instructions. Skills are structured, reusable documents with sections for purpose, instructions, edge cases, output format, and examples. They follow the SKILL.md format — a standardized spec that ensures consistent, high-quality AI behavior across sessions.',
    },
]

export default function FAQ() {
    return (
        <section id="faq" aria-labelledby="faq-title">
            <SEO title={null} path="/" jsonLd={jsonLdSchemas.faqPage(FAQS)} />
            <h2 id="faq-title" className="font-display text-2xl font-semibold">Frequently asked questions</h2>
            <div className="box mt-4">
                {FAQS.map((faq) => (
                    <details key={faq.question} className="group border-t border-line-muted first:border-t-0">
                        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold hover:bg-canvas-subtle [&::-webkit-details-marker]:hidden">
                            <ChevronRight className="h-4 w-4 shrink-0 text-fg-muted transition-transform group-open:rotate-90" />
                            {faq.question}
                        </summary>
                        <p className="px-4 pb-4 pl-10 text-sm leading-6 text-fg-muted">{faq.answer}</p>
                    </details>
                ))}
            </div>
        </section>
    )
}
