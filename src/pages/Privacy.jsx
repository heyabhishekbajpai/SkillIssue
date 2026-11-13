import SEO, { jsonLdSchemas } from '../components/SEO'
import Breadcrumbs from '../components/Breadcrumbs'
import DocLayout from '../components/DocLayout'

export default function Privacy() {
    return (
        <>
            <SEO
                title="Privacy Policy"
                description="Skill Issue privacy policy. Learn how we collect, use, and protect your data when you use the AI skills marketplace."
                path="/privacy"
                jsonLd={jsonLdSchemas.breadcrumb([
                    { name: 'Home', url: '/' },
                    { name: 'Privacy Policy' },
                ])}
            />
            <DocLayout>
                <div>
                    <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />

                    <h1 className="border-b border-line-muted pb-4 font-display text-3xl font-semibold">
                        Privacy Policy
                    </h1>

                    <div className="markdown-body mt-6">
                        <p className="text-sm !text-fg-muted">Last updated: March 27, 2026</p>

                        <h2>1. Information We Collect</h2>
                        <p>
                            When you create an account on Skill Issue, we collect information provided by your authentication
                            provider (GitHub), including your username, display name, email address, and profile picture.
                        </p>
                        <p>
                            We also collect usage data such as the skills you create, save, star, and share, as well as
                            standard web analytics data (page views, browser type, device information).
                        </p>

                        <h2>2. How We Use Your Information</h2>
                        <ul>
                            <li>To provide and maintain the Skill Issue platform</li>
                            <li>To display your public profile and published skills</li>
                            <li>To enable community features (stars, saves, testimonials)</li>
                            <li>To improve our service and user experience</li>
                            <li>To communicate important updates about the platform</li>
                        </ul>

                        <h2>3. Data Storage</h2>
                        <p>
                            Your data is stored securely using Appwrite (self-hosted backend-as-a-service) and Supabase.
                            We do not sell your personal data to third parties.
                        </p>

                        <h2>4. Third-Party Services</h2>
                        <p>We use the following third-party services:</p>
                        <ul>
                            <li><strong>GitHub</strong> — For authentication and skill file imports</li>
                            <li><strong>Groq API</strong> — For AI-powered skill generation</li>
                            <li><strong>Vercel</strong> — For hosting and deployment</li>
                            <li><strong>FontShare</strong> — For web fonts</li>
                        </ul>

                        <h2>5. Cookies</h2>
                        <p>
                            We use essential cookies for authentication and session management. We do not use
                            third-party advertising or tracking cookies.
                        </p>

                        <h2>6. Your Rights</h2>
                        <p>You have the right to:</p>
                        <ul>
                            <li>Access your personal data</li>
                            <li>Request correction of inaccurate data</li>
                            <li>Request deletion of your account and data</li>
                            <li>Export your skill files at any time</li>
                        </ul>

                        <h2>7. Contact</h2>
                        <p>
                            For privacy-related questions or requests, contact us at{' '}
                            <a href="mailto:bajpai.connect@gmail.com">
                                bajpai.connect@gmail.com
                            </a>
                        </p>
                    </div>
                </div>
            </DocLayout>
        </>
    )
}
