import { Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import WhatIsSkillFile from './components/WhatIsSkillFile'
import HowItWorks from './components/HowItWorks'
import Features from './components/Features'
import CTA from './components/CTA'
import Footer from './components/Footer'
import SkillBuilder from './pages/SkillBuilder'
import UserProfile from './pages/UserProfile'
import AuthCallback from './pages/AuthCallback'
import AuthModal from './components/AuthModal'
import OnboardingModal from './components/OnboardingModal'

function LandingPage() {
    return (
        <>
            <Hero />
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

    return (
        <div className="relative min-h-screen bg-navy text-white">
            {/* Grid Background */}
            <div className="grid-bg" />

            {/* Content */}
            <div className="relative z-10">
                <Navbar />
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/build" element={<SkillBuilder />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/user/:username" element={<UserProfile />} />
                </Routes>
            </div>

            {/* Global Modals (rendered above everything) */}
            {showAuthModal && <AuthModal />}
            {needsOnboarding && <OnboardingModal />}
        </div>
    )
}
