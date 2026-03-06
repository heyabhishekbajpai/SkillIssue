import { useEffect, useRef } from 'react'

// i = 0,2 → left column (slides from left); i = 1,3 → right column (slides from right)
const slideDir = (i) => i % 2 === 0 ? 'from-left' : 'from-right'

// Animation windows as [start, end] fractions of total scroll ratio (0→1)
// Header is always visible — only cards animate in
// With earlyStart=0.7vh: pin begins at ratio≈0.24, ends at ratio≈1
const CARD_WINDOWS  = [
    [0.00, 0.28],  // 01 — from left
    [0.09, 0.36],  // 02 — from right
    [0.28, 0.66],  // 03 — from left  (starts as 01 lands)
    [0.40, 0.90],  // 04 — from right (starts as 02 lands, pin releases ~here)
]

const FEATURES = [
    {
        number: '01',
        title: 'Private Vault',
        description: 'Securely store your personal skill collection. Organize, tag, and access your skills anytime — they stay yours.',
        detail: 'End-to-end encrypted storage with version history and private team sharing built right in.',
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
        ),
        accentColor: '#4ba9ff',
        cardBg: 'linear-gradient(140deg, #0d1830 0%, #0a1220 60%, #09101c 100%)',
        borderColor: 'rgba(75, 169, 255, 0.22)',
        glowColor: 'rgba(75, 169, 255, 0.07)',
        iconBg: 'rgba(75, 169, 255, 0.12)',
        pillBg: 'rgba(75, 169, 255, 0.1)',
        pills: ['Encrypted', 'Version history', 'Team access'],
    },
    {
        number: '02',
        title: 'Public Marketplace',
        description: 'Discover skills published by the community. Rate, review, and download the best skill files for every AI agent.',
        detail: 'Thousands of curated skills across coding, writing, research, and dozens of specialized domains.',
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-18 0a2.998 2.998 0 00-1.5-2.599V5.25A2.25 2.25 0 013.75 3h16.5A2.25 2.25 0 0122.5 5.25v1.5a2.997 2.997 0 00-1.5 2.599" />
            </svg>
        ),
        accentColor: '#a78bfa',
        cardBg: 'linear-gradient(140deg, #110e2e 0%, #0d0a22 60%, #0a081a 100%)',
        borderColor: 'rgba(167, 139, 250, 0.22)',
        glowColor: 'rgba(167, 139, 250, 0.07)',
        iconBg: 'rgba(167, 139, 250, 0.12)',
        pillBg: 'rgba(167, 139, 250, 0.1)',
        pills: ['Community rated', 'All AI agents', 'One-click copy'],
    },
    {
        number: '03',
        title: 'AI Skill Editor',
        description: 'Create and edit skill files with an intelligent markdown editor. Preview how your skills will work before publishing.',
        detail: 'Live preview, syntax highlighting, and AI-assisted writing to craft the perfect skill file.',
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
        ),
        accentColor: '#2dd4bf',
        cardBg: 'linear-gradient(140deg, #091e28 0%, #081420 60%, #060f18 100%)',
        borderColor: 'rgba(45, 212, 191, 0.22)',
        glowColor: 'rgba(45, 212, 191, 0.07)',
        iconBg: 'rgba(45, 212, 191, 0.12)',
        pillBg: 'rgba(45, 212, 191, 0.1)',
        pills: ['Live preview', 'AI-assisted', 'Syntax highlight'],
    },
    {
        number: '04',
        title: 'Skill Combining',
        description: 'Merge multiple skills into powerful combos. Stack capabilities to create the ultimate AI agent configuration.',
        detail: 'Visual drag-and-drop combiner with conflict detection and smart optimization suggestions.',
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
        ),
        accentColor: '#fb923c',
        cardBg: 'linear-gradient(140deg, #1c1008 0%, #140c06 60%, #0f0904 100%)',
        borderColor: 'rgba(251, 146, 60, 0.22)',
        glowColor: 'rgba(251, 146, 60, 0.07)',
        iconBg: 'rgba(251, 146, 60, 0.12)',
        pillBg: 'rgba(251, 146, 60, 0.1)',
        pills: ['Drag & drop', 'Conflict detect', 'Smart optimize'],
    },
]

export default function Features() {
    const trackRef = useRef(null)

    useEffect(() => {
        const track = trackRef.current
        if (!track) return

        const update = () => {
            // Static on mobile — no scroll animation
            if (window.innerWidth < 768) {
                const cards = track.querySelectorAll('.feature-slide-card')
                cards.forEach(card => {
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

            // Start animating when the section top is 70vh below viewport top
            // (well before pinning, which starts at rect.top === 0)
            const earlyStart = vh * 0.7
            const scrolled   = earlyStart - rect.top        // positive once close
            const totalDist  = scrollDist + earlyStart
            const ratio = Math.max(0, Math.min(1, scrolled / totalDist))

            // ── Cards only ──────────────────────────────────────────
            const cards = track.querySelectorAll('.feature-slide-card')
            cards.forEach((card, i) => {
                const [start, end] = CARD_WINDOWS[i] ?? [0, 1]
                const p   = Math.max(0, Math.min(1, (ratio - start) / (end - start)))
                const dir = card.classList.contains('from-left') ? -1 : 1
                card.style.transform = `translateX(${dir * 110 * (1 - p)}%)`
                card.style.opacity   = p
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

    // Pair cards into rows of 2
    const rows = []
    for (let i = 0; i < FEATURES.length; i += 2) rows.push(FEATURES.slice(i, i + 2))

    return (
        <section id="features" className="relative">
            <div className="section-divider" />

            {/* ── Tall scroll track — provides scroll distance for the pin ── */}
            <div ref={trackRef} className="features-pin-track">

                {/* ── Sticky viewport — pinned until track is fully scrolled ── */}
                <div className="features-pin-sticky">

                    {/* Header — always visible, no opacity animation */}
                    <div className="features-pin-header max-w-7xl mx-auto px-6 lg:px-8 pt-2 pb-6 text-center">
                        <span className="font-satoshi text-sm font-medium text-accent tracking-widest uppercase">
                            Features
                        </span>
                        <h2 className="font-clash font-bold text-4xl sm:text-5xl lg:text-6xl mt-4 tracking-tight">
                            Everything you need to
                            <br />
                            <span className="italic text-accent">master AI skills</span>
                        </h2>
                        <p className="font-satoshi text-lg text-white/40 mt-4 max-w-2xl mx-auto">
                            A complete toolkit for discovering, creating, and managing the skill files
                            that make AI agents truly powerful.
                        </p>
                    </div>

                    {/* Cards grid — overflowX hidden here to clip card slides */}
                    <div style={{ overflowX: 'hidden' }}>
                        <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-4 flex flex-col gap-5">
                            {rows.map((row, rowIdx) => (
                                <div key={rowIdx} className="feature-reveal-row">
                                    {row.map((feature, colIdx) => (
                                        <div
                                            key={feature.title}
                                            className={`feature-slide-card ${slideDir(rowIdx * 2 + colIdx)}`}
                                            style={{
                                                background:   feature.cardBg,
                                                borderColor:  feature.borderColor,
                                                opacity:      0,
                                            }}
                                        >
                                            {/* Radial glow */}
                                            <div
                                                className="feature-card-glow"
                                                style={{ background: `radial-gradient(400px circle at top right, ${feature.glowColor}, transparent 70%)` }}
                                            />

                                            <div className="feature-card-body">
                                                {/* Text */}
                                                <div className="feature-card-left">
                                                    <div className="feature-card-meta">
                                                        <span className="feature-card-number font-clash">{feature.number}</span>
                                                        <div
                                                            className="feature-card-icon-wrap"
                                                            style={{ background: feature.iconBg, color: feature.accentColor }}
                                                        >
                                                            {feature.icon}
                                                        </div>
                                                    </div>

                                                    <h3 className="feature-card-title font-clash" style={{ color: feature.accentColor }}>
                                                        {feature.title}
                                                    </h3>

                                                    <p className="feature-card-desc font-satoshi">{feature.description}</p>

                                                    <div className="feature-card-pills">
                                                        {feature.pills.map(pill => (
                                                            <span
                                                                key={pill}
                                                                className="feature-pill font-satoshi"
                                                                style={{ background: feature.pillBg, color: feature.accentColor, borderColor: feature.borderColor }}
                                                            >
                                                                {pill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Decorative icon */}
                                                <div className="feature-card-deco" style={{ color: feature.accentColor }} aria-hidden="true">
                                                    <div className="feature-deco-bg" style={{ background: feature.iconBg }} />
                                                    <div className="feature-deco-icon">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={0.8} className="w-full h-full opacity-60">
                                                            {feature.icon.props.children}
                                                        </svg>
                                                    </div>
                                                    <div className="feature-deco-dots" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}
