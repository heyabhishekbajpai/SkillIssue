import { useEffect, useRef } from 'react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

const STEPS = [
    {
        number: '01',
        title: 'Find a Skill',
        description: 'Browse thousands of community-created skill files for Claude, ChatGPT, Gemini, Cursor and more. Filter by agent, category, or popularity.',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
        ),
    },
    {
        number: '02',
        title: 'Copy or Download',
        description: 'One-click copy to clipboard or download the .md file directly. Save to your private vault for later or share with your team.',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
        ),
    },
    {
        number: '03',
        title: 'Supercharge your AI',
        description: 'Drop the skill file into your AI agent and watch it transform. Combine multiple skills to create powerful, specialized workflows.',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
        ),
    },
]

// Card animation windows as [start, end] of ratio 0→1
const CARD_WINDOWS = [
    [0.0,  0.32],
    [0.22, 0.54],
    [0.50, 0.88],
]

export default function HowItWorks() {
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
                // right-to-left: start at +110%
                card.style.transform = `translateX(${110 * (1 - p)}%)`
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
        <section id="how-it-works" className="relative">
            <div className="section-divider" />

            {/* Tall scroll track — pins the sticky container */}
            <div ref={trackRef} className="features-pin-track">
                <div className="features-pin-sticky" style={{ overflow: 'hidden' }}>

                    {/* Header — always visible */}
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-2 pb-8 text-left">
                        <span className="font-satoshi text-sm font-medium text-accent tracking-widest uppercase">
                            How it works
                        </span>
                        <h2 className="font-clash font-bold text-4xl sm:text-5xl lg:text-6xl mt-4 tracking-tight">
                            Three steps to
                            <br />
                            <span className="italic text-accent">AI mastery</span>
                        </h2>
                    </div>

                    {/* Steps grid */}
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-4">
                        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                            {STEPS.map((step, i) => (
                                <div
                                    key={step.number}
                                    ref={el => { cardRefs.current[i] = el }}
                                    style={{
                                        opacity: 0,
                                        willChange: 'transform, opacity',
                                        transition: 'transform 0.06s linear, opacity 0.06s linear',
                                    }}
                                    className="group"
                                >
                                    <div className="relative">
                                        <div className="step-number mb-6">{step.number}</div>
                                        <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-5 group-hover:bg-accent/20 group-hover:border-accent/30 transition-all duration-300">
                                            {step.icon}
                                        </div>
                                        <h3 className="font-clash font-semibold text-xl mb-3 text-white group-hover:text-accent-light transition-colors duration-300">
                                            {step.title}
                                        </h3>
                                        <p className="font-satoshi text-sm text-white/40 leading-relaxed">
                                            {step.description}
                                        </p>
                                        {i < STEPS.length - 1 && (
                                            <div className="hidden md:block absolute top-10 -right-6 lg:-right-8 w-12 lg:w-16 h-[1px] bg-gradient-to-r from-accent/20 to-transparent" />
                                        )}
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
