import { useEffect, useRef } from 'react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

const USE_CASES = [
    {
        emoji: '✍️',
        title: 'Write Like a Pro',
        description:
            'Tell your AI exactly how you like to write — your tone, your style, your voice. No more generic responses that sound like a robot.',
        before: '"Write me a blog post"',
        after: 'AI writes in YOUR unique voice, every single time',
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                />
            </svg>
        ),
        gradient: 'from-purple-500/20 via-purple-500/5 to-transparent',
        borderColor: 'border-purple-500/15 hover:border-purple-400/30',
        iconBg: 'bg-purple-500/10 border-purple-500/20',
        iconColor: 'text-purple-400',
        dotColor: 'bg-purple-400',
        glowColor: 'hover:shadow-[0_0_40px_rgba(168,85,247,0.08)]',
    },
    {
        emoji: '🎓',
        title: 'Study Smarter',
        description:
            'Turn your AI into a personal tutor that explains things the way you learn best — with examples, quizzes, or step-by-step breakdowns.',
        before: '"Explain quantum physics"',
        after: 'AI teaches at YOUR level with perfect examples',
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
                />
            </svg>
        ),
        gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
        borderColor: 'border-emerald-500/15 hover:border-emerald-400/30',
        iconBg: 'bg-emerald-500/10 border-emerald-500/20',
        iconColor: 'text-emerald-400',
        dotColor: 'bg-emerald-400',
        glowColor: 'hover:shadow-[0_0_40px_rgba(52,211,153,0.08)]',
    },
    {
        emoji: '🎨',
        title: 'Create Better Designs',
        description:
            'Give your AI a sense of style — your brand colors, your design preferences, your creative standards. Every output feels on-brand.',
        before: '"Design a presentation"',
        after: 'AI creates in YOUR style with your brand feel',
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.764m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
                />
            </svg>
        ),
        gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
        borderColor: 'border-amber-500/15 hover:border-amber-400/30',
        iconBg: 'bg-amber-500/10 border-amber-500/20',
        iconColor: 'text-amber-400',
        dotColor: 'bg-amber-400',
        glowColor: 'hover:shadow-[0_0_40px_rgba(251,191,36,0.08)]',
    },
]

// Card animation windows as [start, end] of ratio 0→1
const CARD_WINDOWS = [
    [0.00, 0.30],
    [0.20, 0.55],
    [0.48, 0.93],
]

export default function WhatIsSkillFile() {
    const trackRef = useRef(null)
    const cardRefs = useRef([])

    useEffect(() => {
        const update = () => {
            const track = trackRef.current
            if (!track) return
            // Static on mobile — no scroll animation
            if (window.innerWidth < 768) {
                cardRefs.current.forEach(card => {
                    if (!card) return
                    card.style.transform  = 'none'
                    card.style.opacity    = '1'
                    card.style.willChange = 'auto'
                })
                return
            }
            const rect       = track.getBoundingClientRect()
            const trackH     = track.offsetHeight
            const vh         = window.innerHeight
            const scrollDist = trackH - vh
            const earlyStart = vh * 0.7
            const scrolled   = earlyStart - rect.top
            const totalDist  = scrollDist + earlyStart
            const ratio = Math.max(0, Math.min(1, scrolled / totalDist))

            cardRefs.current.forEach((card, i) => {
                if (!card) return
                const [start, end] = CARD_WINDOWS[i] ?? [0, 1]
                const p = Math.max(0, Math.min(1, (ratio - start) / (end - start)))
                // left-to-right: start at -110%
                card.style.transform = `translateX(${-110 * (1 - p)}%)`
                card.style.opacity   = String(p)
            })
        }

        update()
        window.addEventListener('scroll', update, { passive: true })
        window.addEventListener('resize', update, { passive: true })
        return () => {
            window.removeEventListener('scroll', update)
            window.removeEventListener('resize', update)
        }
    }, [])

    return (
        <section className="relative">
            <div className="section-divider" />

            {/* Subtle ambient glow — outside track so it doesn't get clipped */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/[0.03] rounded-full blur-[120px] pointer-events-none" />

            {/* Tall scroll track — pins the sticky container */}
            <div ref={trackRef} className="features-pin-track" style={{ height: '155vh' }}>
                <div className="features-pin-sticky" style={{ overflow: 'hidden' }}>

                    {/* Header — always visible */}
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-2 pb-6 text-center">
                        <span className="inline-block font-satoshi text-sm font-medium tracking-widest uppercase text-accent/70 mb-4">
                            What are AI Skills?
                        </span>
                        <h2 className="font-clash font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1]">
                            Think of it like apps,
                            <br />
                            <span className="italic text-accent glow-text">but for AI</span>
                        </h2>
                        <p className="font-satoshi text-base sm:text-lg text-white/50 leading-relaxed mt-4 max-w-2xl mx-auto">
                            You know how your phone has apps that make it smarter?{' '}
                            <span className="text-white/80 font-medium">AI skills work the same way.</span>{' '}
                            Grab a skill and{' '}
                            <span className="text-accent-light font-medium">your AI is instantly better at that task.</span>
                        </p>
                    </div>

                    {/* Use-case cards */}
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-4">
                        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
                            {USE_CASES.map((useCase, i) => (
                                <div
                                    key={useCase.title}
                                    ref={el => { cardRefs.current[i] = el }}
                                    style={{ opacity: 0, willChange: 'transform, opacity', transition: 'transform 0.06s linear, opacity 0.06s linear, box-shadow 500ms, border-color 500ms' }}
                                    className={`group relative rounded-2xl overflow-hidden border bg-gradient-to-br ${useCase.gradient} ${useCase.borderColor} ${useCase.glowColor} transition-all duration-500`}
                                >
                                    <div className="p-7 sm:p-8">
                                        {/* Icon */}
                                        <div className={`w-14 h-14 rounded-2xl ${useCase.iconBg} border flex items-center justify-center ${useCase.iconColor} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                            {useCase.icon}
                                        </div>
                                        {/* Title */}
                                        <h3 className="font-clash font-semibold text-xl sm:text-2xl mb-3 text-white">
                                            {useCase.title}
                                        </h3>
                                        {/* Description */}
                                        <p className="font-satoshi text-[0.95rem] text-white/45 leading-relaxed mb-6">
                                            {useCase.description}
                                        </p>
                                        {/* Before → After */}
                                        <div className="space-y-2.5">
                                            <div className="flex items-start gap-2.5">
                                                <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center">
                                                    <span className="text-white/25 text-[0.6rem] font-bold">✕</span>
                                                </span>
                                                <span className="font-satoshi text-sm text-white/25 line-through decoration-white/10">
                                                    {useCase.before}
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-2.5">
                                                <span className={`shrink-0 mt-0.5 w-5 h-5 rounded-full ${useCase.iconBg} flex items-center justify-center`}>
                                                    <span className={`${useCase.iconColor} text-[0.6rem] font-bold`}>✓</span>
                                                </span>
                                                <span className={`font-satoshi text-sm ${useCase.iconColor} font-medium`}>
                                                    {useCase.after}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Decorative corner accent */}
                                    <div className="absolute top-0 right-0 w-24 h-24 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                        <div className={`absolute top-5 right-5 w-10 h-[1px] ${useCase.dotColor} opacity-30`} />
                                        <div className={`absolute top-5 right-5 w-[1px] h-10 ${useCase.dotColor} opacity-30`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}
