import { Link } from 'react-router-dom'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function CTA() {
    const sectionRef = useScrollAnimation()
    const { openAuthModal } = useAuth()
    const { theme } = useTheme()

    return (
        <section id="get-started" ref={sectionRef} className="relative py-16">
            <div className="section-divider mb-16" />

            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="scroll-reveal relative rounded-3xl overflow-hidden">
                    {/* Background */}
                    <div className={`absolute inset-0 ${theme === 'light' ? 'bg-gradient-to-br from-accent/10 via-white to-accent/5' : 'bg-gradient-to-br from-accent/10 via-navy-100 to-accent/5'}`} />
                    <div className="absolute inset-0 border border-accent/10 rounded-3xl" />

                    {/* Glow orbs */}
                    <div className="absolute -top-20 -right-20 w-60 h-60 bg-accent/15 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-accent/10 rounded-full blur-3xl" />

                    {/* Content */}
                    <div className="relative z-10 py-20 px-8 sm:px-16 text-center">
                        <h2 className="font-clash font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-6">
                            Ready to fix your
                            <br />
                            <span className="italic text-accent glow-text">skill issue?</span>
                        </h2>
                        <p className={`font-satoshi text-lg max-w-xl mx-auto mb-10 ${theme === 'light' ? 'text-navy/60' : 'text-white/40'}`}>
                            Join thousands of developers and AI enthusiasts who are already
                            building smarter agents with curated skill files.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button className="btn-primary text-base px-8 py-4" onClick={openAuthModal}>
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#0a0e1a" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#0a0e1a" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#0a0e1a" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#0a0e1a" />
                                </svg>
                                Sign up with Google — It's free
                            </button>
                            <Link to="/browse" className="btn-outline">
                                Browse Skills First
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
