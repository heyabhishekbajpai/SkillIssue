import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
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
import BottomNav from './components/BottomNav'
import SplashScreen from './components/SplashScreen'

function LandingPage() {
    return (
        <>
            <Hero />
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
