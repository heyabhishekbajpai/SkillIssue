import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import BottomNav from './components/BottomNav'
import InstallPrompt from './components/InstallPrompt'
import BackToTop from './components/BackToTop'
import AuthModal from './components/AuthModal'
import OnboardingModal from './components/OnboardingModal'
import Home from './pages/Home'
const SkillBuilder = lazy(() => import('./pages/SkillBuilder'))
const SkillUploader = lazy(() => import('./pages/SkillUploader'))
import BrowseSkills from './pages/BrowseSkills'
const UserProfile = lazy(() => import('./pages/UserProfile'))
import AuthCallback from './pages/AuthCallback'
const SkillDetailPage = lazy(() => import('./pages/SkillDetailPage'))
const GitHubSkillPage = lazy(() => import('./pages/GitHubSkillPage'))
const Community = lazy(() => import('./pages/Community'))
const About = lazy(() => import('./pages/About'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))
import NotFound from './pages/NotFound'
import { Spinner } from './components/ui/primitives'
const ComingSoon = lazy(() => import('./pages/ComingSoon'))

function ScrollToTop() {
    const { pathname } = useLocation()
    useEffect(() => { window.scrollTo(0, 0) }, [pathname])
    return null
}

export default function App() {
    const { showAuthModal, needsOnboarding } = useAuth()

    return (
        <div className="flex min-h-screen flex-col bg-canvas text-fg">
            <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[200] focus:rounded-md focus:bg-canvas focus:px-3 focus:py-2 focus:shadow-overlay">
                Skip to content
            </a>
            <ScrollToTop />
            <InstallPrompt />
            <Navbar />
            <main id="main" className="flex-1">
                <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center"><Spinner size={20} /></div>}>
                <Routes>
                    <Route path="/" element={<Home />} />
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
            <div className="pb-16 md:pb-0">
                <Footer />
            </div>

            {/* Fixed chrome sits at the root so no ancestor transform breaks position:fixed on mobile Safari */}
            <BackToTop />
            <BottomNav />

            {showAuthModal && <AuthModal />}
            {needsOnboarding && <OnboardingModal />}
        </div>
    )
}
