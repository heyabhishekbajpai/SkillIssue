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
import Footer from './components/Footer'
import SkillBuilder from './pages/SkillBuilder'
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
import SEO, { jsonLdSchemas } from './components/SEO'

function LandingPage() {
    return (
        <>
            <SEO
                title={null}
                description="Skill Issue is the marketplace for AI skill files. Discover, save, share and combine .md skill files for Claude, ChatGPT, Gemini, Cursor and more. 8,000+ skills available."
                path="/"
                jsonLd={{
                    '@graph': [
                        jsonLdSchemas.organization(),
                        jsonLdSchemas.website(),
                        jsonLdSchemas.softwareApplication(),
                        jsonLdSchemas.faqPage([
                            {
                                question: 'What is a skill file?',
                                answer: 'A skill file is a structured markdown (.md) document that gives an AI agent precise, actionable instructions for a specific task or domain. Think of it as an "app" for your AI — install a skill file and your agent instantly gains expert-level capability.',
                            },
                            {
                                question: 'Which AI agents work with skill files?',
                                answer: 'Skill files work with Claude, ChatGPT, Gemini, Cursor, GitHub Copilot, and most AI agents that accept system prompts or instruction files.',
                            },
                            {
                                question: 'Is Skill Issue free to use?',
                                answer: 'Yes, Skill Issue is free. You can browse, save, share, and build skill files at no cost. Sign in with GitHub to access all features.',
                            },
                            {
                                question: 'How do I install a skill file?',
                                answer: 'Copy the skill file markdown content and paste it into your AI agent\'s system prompt, custom instructions, or .md file directory. Each AI platform has specific instructions — browse our skills to see platform-specific guides.',
                            },
                        ]),
                    ],
                }}
            />
            <Hero />
            <VideoAndPlatforms />
            <Testimonials />
            <WhatIsSkillFile />
            <HowItWorks />
            <Features />
            <CTA />
            <Footer />
        </>
    )
}

export default function App() {
    const { showAuthModal, needsOnboarding } = useAuth()
    const [splashDone, setSplashDone] = useState(false)

    return (
        <div className="relative min-h-screen bg-navy text-white">
            {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
            <InstallPrompt />
            {/* Grid Background */}
            <div className="grid-bg" />

            {/* Content */}
            <div className="relative z-10">
                <Navbar />
                <div className="pb-20 md:pb-0">
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/build" element={<SkillBuilder />} />
                        <Route path="/browse" element={<BrowseSkills />} />
                        <Route path="/auth/callback" element={<AuthCallback />} />
                        <Route path="/user/:username" element={<UserProfile />} />
                        <Route path="/skill/github" element={<GitHubSkillPage />} />
                        <Route path="/skill/:id" element={<SkillDetailPage />} />
                        <Route path="/community" element={<Community />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/terms" element={<Terms />} />
                    </Routes>
                </div>
            </div>

            {/* Bottom nav — direct child of root so no ancestor overflow/transform
                can break position:fixed on iOS/Android Safari */}
            <BottomNav />

            {/* Global Modals (rendered above everything) */}
            {showAuthModal && <AuthModal />}
            {needsOnboarding && <OnboardingModal />}
        </div>
    )
}
