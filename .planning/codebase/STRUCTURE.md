# Codebase Structure Documentation — Skill Issue

This document provides a comprehensive structural breakdown of the Skill Issue codebase. It catalogs the directory layouts, entry points, configuration sheets, page architectures, reusable components, and API service boundaries.

---

## 📁 Repository Directory Layout

```
SkillIssue/
├── .github/                  # CI/CD Workflows
├── .planning/
│   └── codebase/             # Technical architectural & structure documentation
├── api/                      # Vercel Serverless Functions
│   ├── cron/                 # Automated cron crawler jobs
│   └── lib/                  # Shared serverless utilities (MongoDB client pool)
├── diagrams/                 # Architectural visual assets (Excalidraw & PNGs)
├── public/                   # Static browser assets, SVG icons & robots.txt
├── scripts/                  # Seed engines, local migrations, and prerender engine
├── src/                      # Client-side SPA Application source
│   ├── components/           # Reusable UI component ecosystem
│   ├── context/              # Context-based global state managers (Auth)
│   ├── hooks/                # Custom React hooks (scroll animations)
│   ├── lib/                  # Service interfaces (Appwrite, GitHub, Cache)
│   └── pages/                # View screens mapping to route controllers
├── package.json              # Client/Server dependency definitions
├── tailwind.config.js        # Global CSS design tokens
├── vercel.json               # Serverless route rules, redirects, and crons
└── vite.config.js            # Build bundler and PWA/Sitemap setup
```

---

## 🚀 Entry Points & Global Configuration

* **`index.html`**: The root HTML shell. Contains initial viewport configurations, pre-bundled Google Fonts, meta tags, and the single root mounting `div#root`.
* **`src/main.jsx`**: The React DOM bootloader. Mounts the application inside `<React.StrictMode>`, wrapping it in `<HelmetProvider>` (dynamic SEO titles), `<BrowserRouter>` (React Router v7), and `<AuthProvider>` (Appwrite Auth state). Initiates the `prerender-ready` window event for static crawl compilers.
* **`src/App.jsx`**: The routing brain. Handles client-side paths:
  * `/` ➔ Hero, features, video platforms, and social testimonials
  * `/browse` ➔ Hybrid list of user-created and GitHub-indexed skills
  * `/build` ➔ Multi-modal AI skill generator (Groq prompt integration)
  * `/upload` ➔ Raw markdown parser and uploader (with automatic frontmatter extractor)
  * `/community` ➔ Developer directory listing
  * `/user/:username` ➔ User profile vaults showing public/private cards
  * `/skill/github` ➔ Deep-scanned remote GitHub skill detail renderer
  * `/skill/:id` ➔ Locally stored Appwrite skill detailed page
* **`vercel.json`**: Controls API routing, custom header caching directives (`s-maxage`), fallback index routes for SPA routing resilience, and schedules the semi-monthly GitHub Crawler (`cron` pattern).
* **`vite.config.js`**: Orchestrates bundling. Includes `vite-plugin-pwa` for desktop/mobile installability and `vite-plugin-sitemap` for generating static index lists.

---

## 📄 Page Architectures (`src/pages/`)

* **`BrowseSkills.jsx`**:
  * The heart of search. Performs unified browsing across official sources, community flat lists, and MongoDB Atlas indexed repos.
  * Encapsulates `SkillModal`, the premium file-modal which provides macOS-style code interfaces, dynamic markdown parsers (using `react-markdown` and `remark-gfm`), custom zip compilation via `jszip`, and guest-user obfuscating paywalls.
* **`SkillBuilder.jsx`**:
  * An AI generation console. Takes simple inputs, allows image/screenshot attachment for vision-driven layouts, and pipes requests to Vercel's Groq wrapper.
  * Employs live streaming simulators and editable raw markdown output nodes for direct copying or saving.
* **`SkillUploader.jsx`**:
  * Enables drag-and-drop or copy-pasting of custom `SKILL.md` documents.
  * Integrates an auto-regex frontmatter extractor (`parseSkillFile.js`) to parse `name` and `description` headers automatically.
* **`UserProfile.jsx`**:
  * Displays user biography, statistics (star counts, total downloads, cumulative copy metrics), and split panels separating public worksheets from private vaults.
  * Restricts access to private vault cards to authenticated owners.
* **`Community.jsx`**:
  * Renders a directory of contributors by scraping profiles across Appwrite's database collection.
* **`AuthCallback.jsx`**:
  * Captures inbound OAuth code handshakes from Google/Appwrite, completing the local secure session and redirecting the newly authorized user back to the homepage.

---

## 🧩 Critical Components (`src/components/`)

* **`AuthModal.jsx`**: Manages direct password connections, sign-ups, and magic-link delivery triggers.
* **`OnboardingModal.jsx`**: Displays when a newly created profile lacks a configured display name or username, requesting profile updates.
* **`IconSphere.jsx`**: Employs `react-icon-cloud` to render a 3D rotating visual sphere of brand logos representing supported developer frameworks (Cursor, Claude, Copilot, VS Code, Roo, etc.).
* **`FeaturedSkillCard.jsx` / `SkillCard.jsx`**: Present visual data indicators for individual skill cells (star ratings, programming languages, corporate author avatars).
* **`SEO.jsx`**: Encapsulates dynamic head insertions via `react-helmet-async` for titles, standard descriptions, og:tags, and custom dynamic JSON-LD structural graphs.
* **`SplashScreen.jsx`**: Prevents paint flashiness with a dark logo-fade entry block (bypassed entirely for web scrapers/crawlers).
* **`BottomNav.jsx`**: Provides desktop-to-mobile navigation adaptability, avoiding iOS viewport scale adjustments.
* **`InstallPrompt.jsx`**: Prompts the user to install the application as a Progressive Web App (PWA).

---

## ⚙️ Services & API Foundations

### Frontend Services (`src/lib/`)
* **`appwrite.js`**: Centralizes client SDK connection parameters, databases, collections, and storage bucket mappings.
* **`userService.js`**: Handles account lookups, updates profile biographies, and registers avatar uploads inside storage buckets.
* **`skillService.js`**: Saves user-created skills to Appwrite, lists user vaults, handles star count increments, and enforces document ownership permissions.
* **`githubService.js`**: Integrates with the GitHub CDN (`raw.githubusercontent.com`) to stream remote skill markdown files directly to client modals without using application storage.
* **`indexedSkillService.js`**: An interface for querying Vercel's MongoDB endpoints. Implements a session-level map cache to bypass duplicate network calls.
* **`parseSkillFile.js`**: Extracts frontmatter from uploaded markdown files using standard YAML regex blocks.
* **`profileCache.js`**: Implements basic cache-invalidation strategies for user profile lookups.

### Vercel Serverless Functions (`api/`)
* **`api/github-skills.js`**: Connects to the pooled MongoDB Atlas client to execute high-speed regex-based pagination searches on indexed repository documents.
* **`api/generate.js`**: Acts as a secure Groq LLM API proxy. Formulates system prompt engines and selects LLMs based on user payloads (`llama-3.3-70b-versatile` for text and `llama-4-scout-17b-16e-instruct` for visual layout extractions).
* **`api/sitemap.js`**: Dynamically compiles a valid sitemap XML containing static pathways and up to 10,000 GitHub-indexed dynamic routes.
* **`api/cron/index-skills.js`**: A deep-discovery web scraper. Employs size-partitioned code searching (bypassing the GitHub 1,000 search result threshold), aggregates repository stars using GraphQL batching, performs deep recursive Git Tree scans for dynamic files, and writes bulk upserts directly to MongoDB Atlas.
