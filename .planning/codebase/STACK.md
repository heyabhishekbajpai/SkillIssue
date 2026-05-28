# Tech Stack — SkillIssue

This document outlines the core technologies, frameworks, libraries, database engines, hosting systems, and package configurations that drive the **SkillIssue** platform.

---

## 💻 Core Languages & Runtime

* **Runtime:** Node.js (v18+ recommended)
* **Frontend Languages:** JavaScript (ES Modules, JSX), HTML5, CSS3
* **Backend Environment:** Vercel Serverless/Edge Functions (Node.js runtime environment)

---

## 🎨 Frontend Architecture

The frontend is constructed as a modern, high-performance Single Page Application (SPA) designed to feel instant and highly interactive.

* **Core Library:** React `^18.2.0`
* **Routing:** React Router DOM `^7.13.1` (Unified client-side routing)
* **State & Context:** React Context API for global state management (e.g., `AuthContext.jsx`)
* **Styling & CSS:**
  * Tailwind CSS `^3.4.1` (Utility-first styling ecosystem)
  * PostCSS `^8.4.35`
  * Autoprefixer `^10.4.17`
  * Next Themes `^0.4.6` (System-aware dark/light mode toggle support)

### Specialized UI & Animation Libraries

* **Framer Motion `^12.35.0`:** Powers highly polished animations, layout transitions, and micro-interactions.
* **React Icon Cloud `^4.1.7`:** Renders interactive, 3D rotating tag/icon spheres (as seen in `icon-sphere.html` and matching client components).
* **React Markdown `^10.1.0` & Remark GFM `^4.0.1`:** Parsers used to securely render generated AI agent skill files directly into readable markdown format.
* **React Textarea Autosize `^8.5.9`:** Dynamically sizing text fields for skill editing and inputs.
* **Lucide React `^0.575.0`:** The primary iconography library.

---

## 🗄️ Database & Storage Layer

SkillIssue uses a multi-database approach optimized for different access patterns, scaling needs, and environment configurations:

### 1. Appwrite Cloud
* **Role:** Primary authentication backend, user profile registry, user-created custom skills repository, and feedback/testimonials database.
* **Client Driver:** `appwrite` `^22.4.1`
* **Local Mock Mode:** Supported when `VITE_MOCK_AUTH=true` or when Appwrite is unconfigured to facilitate offline or local-only developer environments without external network dependencies.

### 2. MongoDB Atlas
* **Role:** Serves as the central repository for the massive collection of crawled, indexed open-source GitHub skills.
* **Client Driver:** `mongodb` `^7.1.1`
* **Key Advantages:** Used in Vercel Serverless Functions (`api/github-skills.js`) to perform high-speed, regex-based, paginated weighted searches bypassing standard limitations of other databases. Connection reuse is handled via a custom module-level socket caching system (`api/lib/mongodb.js`).

### 3. Supabase (PostgreSQL)
* **Role:** Originally slated as the primary database or used in parallel configurations.
* **Status:** Database setup schemas are preserved in `supabase_schema.sql` and `supabase_schema_backup.sql` outlining row-level security (RLS) policies, indexes, and triggers, though the active system has been heavily migrated to Appwrite and MongoDB.

---

## ⚙️ Backend, Serverless & Crawler Pipeline

The backend logic is decentralized and runs on serverless architecture:

* **Platform:** Vercel Serverless Functions (Node.js runtime)
* **API Endpoints:**
  * `POST /api/generate`: Intercepts and proxies prompt requests to Groq Cloud (handles vision and text skill synthesis).
  * `GET /api/github-skills`: Queries MongoDB Atlas for indexed GitHub skills.
  * `GET /api/sitemap`: Dynamically generates XML sitemaps.
* **GitHub Crawler:** Located in `api/cron/index-skills.js`. Automatically queries the GitHub API (REST & GraphQL) using partitioned code search queries, extracts all `SKILL.md` structures in qualified repositories, and performs parallel bulk upsert updates into MongoDB. Runs automatically as a cron job every 15 days as configured in `vercel.json`.

---

## 🛠️ Build Tools & Package Managers

* **Package Manager:** `npm` (inferred from `package-lock.json`)
* **Build System:** Vite `^5.1.4`
  * Dev plugin: `@vitejs/plugin-react` `^4.2.1`
* **Static Generation / Prerendering:** Custom prerender engine `node scripts/prerender.mjs` runs post-build to crawl public routes and render fully static HTML versions of pages for optimal SEO performance.
* **Progressive Web App (PWA):** `vite-plugin-pwa` `^1.2.0` automatically injects service worker runtime caches, manifest assets, and standalone app modes.
* **Sitemap Generation:** `vite-plugin-sitemap` `^0.8.2` for automated indexing maps.
