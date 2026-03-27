import SEO from '../components/SEO'
import Breadcrumbs from '../components/Breadcrumbs'

export default function Privacy() {
    return (
        <>
            <SEO
                title="Privacy Policy"
                description="Skill Issue privacy policy. Learn how we collect, use, and protect your data when you use our AI skill files marketplace."
                path="/privacy"
            />
            <section className="pt-28 pb-20 min-h-screen">
                <div className="max-w-3xl mx-auto px-6 lg:px-8">
                    <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />

                    <h1 className="font-clash font-bold text-4xl sm:text-5xl tracking-tight mb-6">
                        Privacy Policy
                    </h1>

                    <div className="space-y-6 font-satoshi text-base text-white/60 leading-relaxed">
                        <p className="text-white/40 text-sm">Last updated: March 27, 2026</p>

                        <h2 className="font-clash font-semibold text-2xl text-white/90 pt-4">1. Information We Collect</h2>
                        <p>
                            When you create an account on Skill Issue, we collect information provided by your authentication
                            provider (GitHub), including your username, display name, email address, and profile picture.
                        </p>
                        <p>
                            We also collect usage data such as the skills you create, save, star, and share, as well as
                            standard web analytics data (page views, browser type, device information).
                        </p>

                        <h2 className="font-clash font-semibold text-2xl text-white/90 pt-4">2. How We Use Your Information</h2>
                        <ul className="list-disc list-outside pl-5 space-y-2">
                            <li>To provide and maintain the Skill Issue platform</li>
                            <li>To display your public profile and published skills</li>
                            <li>To enable community features (stars, saves, testimonials)</li>
                            <li>To improve our service and user experience</li>
                            <li>To communicate important updates about the platform</li>
                        </ul>

                        <h2 className="font-clash font-semibold text-2xl text-white/90 pt-4">3. Data Storage</h2>
                        <p>
                            Your data is stored securely using Appwrite (self-hosted backend-as-a-service) and Supabase.
                            We do not sell your personal data to third parties.
                        </p>

                        <h2 className="font-clash font-semibold text-2xl text-white/90 pt-4">4. Third-Party Services</h2>
                        <p>We use the following third-party services:</p>
                        <ul className="list-disc list-outside pl-5 space-y-2">
                            <li><strong className="text-white/80">GitHub</strong> — For authentication and skill file imports</li>
                            <li><strong className="text-white/80">Groq API</strong> — For AI-powered skill generation</li>
                            <li><strong className="text-white/80">Vercel</strong> — For hosting and deployment</li>
                            <li><strong className="text-white/80">FontShare</strong> — For web fonts</li>
                        </ul>

                        <h2 className="font-clash font-semibold text-2xl text-white/90 pt-4">5. Cookies</h2>
                        <p>
                            We use essential cookies for authentication and session management. We do not use
                            third-party advertising or tracking cookies.
                        </p>

                        <h2 className="font-clash font-semibold text-2xl text-white/90 pt-4">6. Your Rights</h2>
                        <p>You have the right to:</p>
                        <ul className="list-disc list-outside pl-5 space-y-2">
                            <li>Access your personal data</li>
                            <li>Request correction of inaccurate data</li>
                            <li>Request deletion of your account and data</li>
                            <li>Export your skill files at any time</li>
                        </ul>

                        <h2 className="font-clash font-semibold text-2xl text-white/90 pt-4">7. Contact</h2>
                        <p>
                            For privacy-related questions or requests, contact us at{' '}
                            <a href="mailto:bajpai.connect@gmail.com" className="text-accent hover:text-[#6bbcff] underline underline-offset-2 transition-colors">
                                bajpai.connect@gmail.com
                            </a>
                        </p>
                    </div>
                </div>
            </section>
        </>
    )
}
