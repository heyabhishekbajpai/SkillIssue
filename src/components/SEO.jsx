import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'Skill Issue'
const SITE_URL = 'https://skillissue.bajpai.tech'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`
const TWITTER_HANDLE = '@BajpaiX'

/**
 * SEO component — sets <title>, meta description, OG tags, Twitter Cards,
 * canonical URL, and optional JSON-LD structured data per page.
 *
 * Usage:
 *   <SEO
 *     title="Browse AI Skills"
 *     description="Explore 8,000+ AI skill files for Claude, ChatGPT, Gemini, Cursor and more."
 *     path="/browse"
 *     jsonLd={{ "@type": "CollectionPage", ... }}
 *   />
 */
export default function SEO({
    title,
    description,
    path = '/',
    image,
    type = 'website',
    jsonLd,
    noindex = false,
}) {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — AI Skill Files Marketplace for Claude, ChatGPT, Gemini & Cursor`
    const canonicalUrl = `${SITE_URL}${path}`
    const ogImage = image || DEFAULT_IMAGE
    const metaDescription = description || 'Discover, save, share and combine AI skill files for Claude, ChatGPT, Gemini, Cursor and more. 8,000+ skills available.'

    return (
        <Helmet>
            {/* Basic */}
            <title>{fullTitle}</title>
            <meta name="description" content={metaDescription} />
            <link rel="canonical" href={canonicalUrl} />
            {noindex && <meta name="robots" content="noindex,nofollow" />}

            {/* Open Graph */}
            <meta property="og:type" content={type} />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:image" content={ogImage} />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content={TWITTER_HANDLE} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={ogImage} />

            {/* JSON-LD Structured Data */}
            {jsonLd && (
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        ...jsonLd,
                    })}
                </script>
            )}
        </Helmet>
    )
}

/**
 * Pre-built JSON-LD generators following schema.org specs
 */
export const jsonLdSchemas = {
    organization: () => ({
        '@type': 'Organization',
        name: 'Skill Issue',
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.png`,
        description: 'The marketplace for AI skill files. Discover, save, share and combine skill files for every AI agent.',
        sameAs: [
            'https://www.linkedin.com/company/bajpaitech/',
            'https://github.com/heyabhishekbajpai',
            'https://x.com/BajpaiX',
            'https://www.instagram.com/bajpai.tech/',
            'https://www.youtube.com/@abhishek.bajpai',
        ],
    }),

    website: () => ({
        '@type': 'WebSite',
        name: 'Skill Issue',
        url: SITE_URL,
        description: 'The marketplace for AI skill files.',
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${SITE_URL}/browse?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    }),

    softwareApplication: () => ({
        '@type': 'SoftwareApplication',
        name: 'Skill Issue',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web',
        url: SITE_URL,
        description: 'Marketplace for AI skill files — discover, save, share and combine .md skill files for Claude, ChatGPT, Gemini, Cursor and more.',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
    }),

    breadcrumb: (items) => ({
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            item: item.url ? `${SITE_URL}${item.url}` : undefined,
        })),
    }),

    skillPage: (skill) => ({
        '@type': 'CreativeWork',
        name: skill.title || skill.name,
        description: skill.description,
        url: `${SITE_URL}/skill/${skill.id}`,
        author: skill.authorName ? { '@type': 'Person', name: skill.authorName } : undefined,
        datePublished: skill.created_at,
        keywords: skill.tags?.join(', '),
    }),

    profilePage: (profile) => ({
        '@type': 'ProfilePage',
        mainEntity: {
            '@type': 'Person',
            name: profile.display_name || profile.username,
            url: `${SITE_URL}/user/${profile.username}`,
            image: profile.avatar_url,
            description: profile.bio,
        },
    }),

    faqPage: (faqs) => ({
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    }),
}
