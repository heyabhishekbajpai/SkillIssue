import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from './context/AuthContext'
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
import SkillBuilder from './pages/SkillBuilder'
import SkillUploader from './pages/SkillUploader'
import BrowseSkills from './pages/BrowseSkills'
import UserProfile from './pages/UserProfile'
import AuthCallback from './pages/AuthCallback'
import AuthModal from './components/AuthModal'
import OnboardingModal from './components/OnboardingModal'
import SkillDetailPage from './pages/SkillDetailPage'
import GitHubSkillPage from './pages/GitHubSkillPage'
import Community from './pages/Community'
import About from './pages/About'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import BottomNav from './components/BottomNav'
import SplashScreen from './components/SplashScreen'
import InstallPrompt from './components/InstallPrompt'
import BackToTop from './components/BackToTop'
import NotFound from './pages/NotFound'
import ComingSoon from './pages/ComingSoon'
import SEO, { jsonLdSchemas } from './components/SEO'

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
