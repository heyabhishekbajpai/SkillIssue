import { Routes, Route } from 'react-router-dom'
import { useState, lazy, Suspense } from 'react'
import { useAuth } from './context/AuthContext'

// Layout & Global Components
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import VideoAndPlatforms from './components/VideoAndPlatforms'
import { Testimonials } from './components/Testimonials'
import WhatIsSkillFile from './components/WhatIsSkillFile'
import HowItWorks from './components/HowItWorks'
import Features from './components/Features'
import CTA from './components/CTA'
import FAQ from './components/FAQ'
import Footer from './components/Footer'
import AuthModal from './components/AuthModal'
import OnboardingModal from './components/OnboardingModal'
import BottomNav from './components/BottomNav'
import SplashScreen from './components/SplashScreen'
import InstallPrompt from './components/InstallPrompt'
import BackToTop from './components/BackToTop'
import SEO, { jsonLdSchemas } from './components/SEO'

// Critical synchronous pages (keeps OAuth redirects and initial load fast)
import AuthCallback from './pages/AuthCallback'

// 🚀 Lazy loaded heavy & secondary pages
const SkillBuilder = lazy(() => import('./pages/SkillBuilder'))
const SkillUploader = lazy(() => import('./pages/SkillUploader'))
const BrowseSkills = lazy(() => import('./pages/BrowseSkills'))
const UserProfile = lazy(() => import('./pages/UserProfile'))
const SkillDetailPage = lazy(() => import('./pages/SkillDetailPage'))
const GitHubSkillPage = lazy(() => import('./pages/GitHubSkillPage'))
const Community = lazy(() => import('./pages/Community'))
const About = lazy(() => import('./pages/About'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))
const ComingSoon = lazy(() => import('./pages/ComingSoon'))
const NotFound = lazy(() => import('./pages/NotFound'))

function LandingPage() {
    return (
        <>
            <SEO
                title={null}
                description="Skill Issue is the AI skills marketplace. Discover, build, share and combine AI skills for Claude, ChatGPT, Gemini, Cursor and more. 50,000+ skills available."
                path="/"
                jsonLd={{
                    '@graph': [
                        jsonLdSchemas.website(),
                        jsonLdSchemas.organization(),
                        jsonLdSchemas.softwareApplication(),
                    ],
                }}
            />
            <Hero />
            <VideoAndPlatforms />
            <Testimonials />
            <WhatIsSkillFile />
            <HowItWorks />
            <Features />
            <FAQ />
            <CTA />
            <Footer />
        </>
    )
}

// Detect if visitor is a bot/crawler — skip splash screen for them
const isBot = typeof navigator !== 'undefined' && /bot|crawl|spider|slurp|googlebot|bingbot|yandex|baidu|duckduckbot|facebookexternalhit|twitterbot|linkedinbot|perplexitybot|chatgpt|gptbot|claude|anthropic|prerender/i.test(navigator.userAgent)

export default function App() {
    const { showAuthModal, needsOnboarding } = useAuth()
    const [splashDone, setSplashDone] = useState(isBot)

    return (
        <div className="relative min-h-screen bg-navy text-white">
            {!splashDone && !isBot && <SplashScreen onDone={() => setSplashDone(true)} />}
            <InstallPrompt />
            {/* Grid Background */}
            <div className="grid-bg" />

            {/* Content */}
            <div className="relative z-10">
                <Navbar />
                <main className="pb-20 md:pb-0">
                    <Suspense fallback={
                        <div className="min-h-[80vh] flex flex-col items-center justify-center">
                            <svg className="w-8 h-8 text-accent animate-spin mb-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span className="font-satoshi text-sm text-white/40">Loading...</span>
                        </div>
                    }>
                        <Routes>
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/build" element={<SkillBuilder />} />
                            <Route path="/upload" element={<SkillUploader />} />
                            <Route path="/browse" element={<BrowseSkills />} />
                            <Route path="/auth/callback" element={<AuthCallback />} />
                            <Route path="/user/:username" element={<UserProfile />} />
                            <Route path="/skill/github" element={<GitHubSkillPage />} />
                            <Route path="/skill/:id" element={<SkillDetailPage />} />
                            <Route path="/community" element={<Community />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/privacy" element={<Privacy />} />
                            <Route path="/terms" element={<Terms />} />
                            <Route path="/coming-soon" element={<ComingSoon />} />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </Suspense>
                </main>
            </div>

            {/* Bottom nav — direct child of root so no ancestor overflow/transform
                can break position:fixed on iOS/Android Safari */}
            <BackToTop />
            <BottomNav />

            {/* Global Modals (rendered above everything) */}
            {showAuthModal && <AuthModal />}
            {needsOnboarding && <OnboardingModal />}
        </div>
    )
}