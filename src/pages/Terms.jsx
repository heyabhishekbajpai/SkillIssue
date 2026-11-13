import SEO, { jsonLdSchemas } from '../components/SEO'
import Breadcrumbs from '../components/Breadcrumbs'
import DocLayout from '../components/DocLayout'

export default function Terms() {
    return (
        <>
            <SEO
                title="Terms of Service"
                description="Skill Issue terms of service. Read the terms and conditions for using the AI skills marketplace."
                path="/terms"
                jsonLd={jsonLdSchemas.breadcrumb([
                    { name: 'Home', url: '/' },
                    { name: 'Terms of Service' },
                ])}
            />
            <DocLayout>
                <div>
                    <Breadcrumbs items={[{ label: 'Terms of Service' }]} />

                    <h1 className="border-b border-line-muted pb-4 font-display text-3xl font-semibold">
                        Terms of Service
                    </h1>

                    <div className="markdown-body mt-6">
                        <p className="text-sm !text-fg-muted">Last updated: March 27, 2026</p>

                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using Skill Issue ("the Service"), you agree to be bound by these Terms of
                            Service. If you do not agree to these terms, please do not use the Service.
                        </p>

                        <h2>2. Description of Service</h2>
                        <p>
                            Skill Issue is a marketplace for AI skill files — structured markdown documents that provide
                            instructions for AI agents. The Service allows users to discover, create, save, share, and
                            download skill files.
                        </p>

                        <h2>3. User Accounts</h2>
                        <p>
                            You may create an account using GitHub authentication. You are responsible for maintaining the
                            security of your account and all activities that occur under your account.
                        </p>

                        <h2>4. User Content</h2>
                        <ul>
                            <li>You retain ownership of skill files you create and publish.</li>
                            <li>By publishing a skill publicly, you grant other users the right to view, copy, and use that skill file.</li>
                            <li>You must not publish content that is illegal, harmful, or infringes on intellectual property rights.</li>
                            <li>We reserve the right to remove content that violates these terms.</li>
                        </ul>

                        <h2>5. GitHub-Sourced Skills</h2>
                        <p>
                            Skills imported from GitHub repositories are subject to their respective licenses. Skill Issue
                            does not claim ownership of third-party skill files.
                        </p>

                        <h2>6. Acceptable Use</h2>
                        <p>You agree not to:</p>
                        <ul>
                            <li>Use the Service for any unlawful purpose</li>
                            <li>Attempt to gain unauthorized access to other accounts or systems</li>
                            <li>Upload malicious code or content</li>
                            <li>Abuse, harass, or impersonate other users</li>
                            <li>Scrape data from the Service without permission</li>
                        </ul>

                        <h2>7. Disclaimer</h2>
                        <p>
                            The Service is provided "as is" without warranties of any kind. We do not guarantee the
                            accuracy, quality, or reliability of user-generated skill files.
                        </p>

                        <h2>8. Limitation of Liability</h2>
                        <p>
                            To the maximum extent permitted by law, Skill Issue shall not be liable for any indirect,
                            incidental, special, or consequential damages arising from the use of the Service.
                        </p>

                        <h2>9. Changes to Terms</h2>
                        <p>
                            We may update these terms at any time. Continued use of the Service after changes constitutes
                            acceptance of the updated terms.
                        </p>

                        <h2>10. Contact</h2>
                        <p>
                            For questions about these terms, contact us at{' '}
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
