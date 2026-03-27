import SEO from '../components/SEO'
import Breadcrumbs from '../components/Breadcrumbs'

export default function Terms() {
    return (
        <>
            <SEO
                title="Terms of Service"
                description="Skill Issue terms of service. Read the terms and conditions for using the AI skill files marketplace."
                path="/terms"
            />
            <section className="pt-28 pb-20 min-h-screen">
                <div className="max-w-3xl mx-auto px-6 lg:px-8">
                    <Breadcrumbs items={[{ label: 'Terms of Service' }]} />

                    <h1 className="font-clash font-bold text-4xl sm:text-5xl tracking-tight mb-6">
                        Terms of Service
                    </h1>

                    <div className="space-y-6 font-satoshi text-base text-white/60 leading-relaxed">
                        <p className="text-white/40 text-sm">Last updated: March 27, 2026</p>

                        <h2 className="font-clash font-semibold text-2xl text-white/90 pt-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using Skill Issue ("the Service"), you agree to be bound by these Terms of
                            Service. If you do not agree to these terms, please do not use the Service.
                        </p>

                        <h2 className="font-clash font-semibold text-2xl text-white/90 pt-4">2. Description of Service</h2>
                        <p>
                            Skill Issue is a marketplace for AI skill files — structured markdown documents that provide
                            instructions for AI agents. The Service allows users to discover, create, save, share, and
                            download skill files.
                        </p>

                        <h2 className="font-clash font-semibold text-2xl text-white/90 pt-4">3. User Accounts</h2>
                        <p>
                            You may create an account using GitHub authentication. You are responsible for maintaining the
                            security of your account and all activities that occur under your account.
                        </p>

                        <h2 className="font-clash font-semibold text-2xl text-white/90 pt-4">4. User Content</h2>
                        <ul className="list-disc list-outside pl-5 space-y-2">
                            <li>You retain ownership of skill files you create and publish.</li>
                            <li>By publishing a skill publicly, you grant other users the right to view, copy, and use that skill file.</li>
                            <li>You must not publish content that is illegal, harmful, or infringes on intellectual property rights.</li>
                            <li>We reserve the right to remove content that violates these terms.</li>
                        </ul>

                        <h2 className="font-clash font-semibold text-2xl text-white/90 pt-4">5. GitHub-Sourced Skills</h2>
                        <p>
                            Skills imported from GitHub repositories are subject to their respective licenses. Skill Issue
                            does not claim ownership of third-party skill files.
                        </p>

                        <h2 className="font-clash font-semibold text-2xl text-white/90 pt-4">6. Acceptable Use</h2>
                        <p>You agree not to:</p>
                        <ul className="list-disc list-outside pl-5 space-y-2">
                            <li>Use the Service for any unlawful purpose</li>
                            <li>Attempt to gain unauthorized access to other accounts or systems</li>
                            <li>Upload malicious code or content</li>
                            <li>Abuse, harass, or impersonate other users</li>
                            <li>Scrape data from the Service without permission</li>
                        </ul>

                        <h2 className="font-clash font-semibold text-2xl text-white/90 pt-4">7. Disclaimer</h2>
                        <p>
                            The Service is provided "as is" without warranties of any kind. We do not guarantee the
                            accuracy, quality, or reliability of user-generated skill files.
                        </p>

                        <h2 className="font-clash font-semibold text-2xl text-white/90 pt-4">8. Limitation of Liability</h2>
                        <p>
                            To the maximum extent permitted by law, Skill Issue shall not be liable for any indirect,
                            incidental, special, or consequential damages arising from the use of the Service.
                        </p>

                        <h2 className="font-clash font-semibold text-2xl text-white/90 pt-4">9. Changes to Terms</h2>
                        <p>
                            We may update these terms at any time. Continued use of the Service after changes constitutes
                            acceptance of the updated terms.
                        </p>

                        <h2 className="font-clash font-semibold text-2xl text-white/90 pt-4">10. Contact</h2>
                        <p>
                            For questions about these terms, contact us at{' '}
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
