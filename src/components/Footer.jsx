import { Link } from 'react-router-dom'

export default function Footer() {
    return (
        <footer className="relative pt-16 pb-10 bg-[#05070d] border-t border-accent/10">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center mb-4">
                            <img
                                src="/skill-issue-white.png"
                                alt="Skill Issue"
                                className="h-8 w-auto"
                            />
                        </div>
                        <p className="font-satoshi text-sm text-white/30 leading-relaxed mb-6">
                            The marketplace for AI skill files.
                            Discover, save, share and combine
                            skills for every AI agent.
                        </p>
                        {/* Ko-fi Button */}
                        <a
                            href="https://ko-fi.com/abhishekbajpai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF5E5B]/10 border border-[#FF5E5B]/20 hover:bg-[#FF5E5B]/20 transition-all duration-300 group"
                        >
                            <svg className="w-4 h-4 text-[#FF5E5B]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311z" />
                            </svg>
                            <span className="font-satoshi text-sm font-medium text-[#FF5E5B]/80 group-hover:text-[#FF5E5B] transition-colors">
                                Support on Ko-fi
                            </span>
                        </a>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="font-clash font-semibold text-sm text-white/80 mb-5 tracking-wide">
                            Product
                        </h4>
                        <ul className="space-y-3">
                            {[
                                { label: 'Browse Skills', to: '/browse' },
                                { label: 'Skill Editor', to: '/build' },
                                { label: 'Public Marketplace', to: '/browse' },
                                { label: 'Private Vault', to: null },
                                { label: 'Pricing', to: null },
                            ].map(({ label, to }) => (
                                <li key={label}>
                                    {to ? (
                                        <Link to={to} className="font-satoshi text-sm text-white/30 hover:text-accent-light transition-colors duration-300">
                                            {label}
                                        </Link>
                                    ) : (
                                        <span className="font-satoshi text-sm text-white/30 cursor-default">{label}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="font-clash font-semibold text-sm text-white/80 mb-5 tracking-wide">
                            Resources
                        </h4>
                        <ul className="space-y-3">
                            {['Documentation', 'API Reference', 'Skill Format Guide', 'Blog', 'Changelog'].map((link) => (
                                <li key={link}>
                                    <a href="#" className="font-satoshi text-sm text-white/30 hover:text-accent-light transition-colors duration-300">
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="font-clash font-semibold text-sm text-white/80 mb-5 tracking-wide">
                            Company
                        </h4>
                        <ul className="space-y-3">
                            {['About', 'Discord Community', 'Twitter / X', 'GitHub', 'Contact'].map((link) => (
                                <li key={link}>
                                    <a href="#" className="font-satoshi text-sm text-white/30 hover:text-accent-light transition-colors duration-300">
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-white/5 pt-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <p className="font-satoshi text-xs text-white/20 text-center md:text-left order-2 md:order-1">
                        © 2026 Skill Issue. All rights reserved.
                    </p>

                    {/* Developed By - Centered, Minimal, Big */}
                    <a
                        href="https://www.bajpai.tech"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex justify-center items-center gap-3 order-1 md:order-2 w-fit mx-auto transition-transform hover:scale-105 duration-300 cursor-pointer group"
                    >
                        <span className="font-clash text-lg sm:text-xl text-white/50 group-hover:text-white transition-colors">Developed by</span>
                        <img
                            src="/bajpailogo.png"
                            alt="Bajpai Tech logo — developed by Abhishek Bajpai"
                            className="h-6 sm:h-7 w-auto opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                        />
                    </a>

                    <div className="flex gap-6 justify-center md:justify-end order-3">
                        <Link to="/about" className="font-satoshi text-xs text-white/20 hover:text-white/40 transition-colors">About</Link>
                        <Link to="/privacy" className="font-satoshi text-xs text-white/20 hover:text-white/40 transition-colors">Privacy</Link>
                        <Link to="/terms" className="font-satoshi text-xs text-white/20 hover:text-white/40 transition-colors">Terms</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
