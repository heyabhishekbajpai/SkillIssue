# External Integrations — SkillIssue

This document outlines the external APIs, SaaS integrations, web services, and third-party libraries that connect the **SkillIssue** platform to external environments.

---

## 🤖 AI Skill Generation: Groq Cloud API

SkillIssue utilizes the ultra-low latency Groq Cloud API to power its AI skill generator engine.

* **Endpoints:**
  * Client calls: `/api/generate`
  * Proxy configuration: `vite.config.js` shim catches POST requests in dev; Vercel Serverless maps requests in production to `api/generate.js`.
* **Models Selected:**
  * **Text Only:** `llama-3.3-70b-versatile` — High-intelligence Meta Llama model used for rich context text generation, planning, and skill refinement.
  * **Multimodal / Vision:** `meta-llama/llama-4-scout-17b-16e-instruct` — Vision-capable model used to read attached design screenshots, reference pages, or sketches to output self-contained, fully detailed skill documents.
* **Environment Keys:** `VITE_GROQ_API_KEY`, `NEXT_PUBLIC_GROQ_API_KEY`, or `GROQ_API_KEY`.

---

## 🐙 Code & Metadata Discovery: GitHub Integrations

To build a searchable index of open-source agent skills, SkillIssue features a multi-phase background crawler that interfaces directly with GitHub APIs:

1. **Size-Partitioned Code Search (REST):**
   * **Endpoint:** `https://api.github.com/search/code`
   * **Mechanism:** Queries files named `SKILL.md` across 6 distinct repository size ranges. This bypasses the 1,000-search result cap of GitHub's Search API to discover thousands of matching repositories.
2. **Batch Repository Metadata (GraphQL):**
   * **Endpoint:** `https://api.github.com/graphql`
   * **Mechanism:** Batches requests (50 repositories per query) to retrieve star counts, descriptions, topics, primary programming language, and default branches in a single network round-trip. Filtered to repositories with at least 10 stars (`MIN_STARS = 10`).
3. **Deep Discovery Trees API (REST):**
   * **Endpoint:** `https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=true`
   * **Mechanism:** Recursively scans the tree structure of every qualified repository to extract *all* matching `SKILL.md` files (even those nested deep in subdirectories), allowing support for monorepos or skill hubs.
4. **On-Demand CDN Fetching (Raw GitHub CDN):**
   * **Endpoint:** `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{file_path}`
   * **Mechanism:** The frontend retrieves the actual markdown file contents on-demand from the GitHub CDN instead of storing the files in MongoDB. This ensures that the marketplace index remains lightweight, fast, and always up to date.
* **Environment Keys:** `GITHUB_TOKEN` or `VITE_GITHUB_TOKEN`.

---

## 🛡️ Cloud Auth & Database: Appwrite Cloud

Appwrite serves as the backend platform for auth, user data, and storage.

* **Authentication Integration:**
  * **Google OAuth2:** `account.createOAuth2Session` initiates Google credentials authorization redirecting to `/auth/callback`.
  * **Email & Password:** Native session initiation (`account.createEmailPasswordSession`).
  * **Magic URL Link:** Email-based token generation (`account.createMagicURLToken`).
* **Database & Storage Collections:**
  * Collections: `users` (profiles), `skills` (user-created skills), `testimonials`.
  * RLS policies and permissions (e.g., `Permission.read(Role.any())`, `Permission.update(Role.user(userId))`) are applied directly in database transactions.
* **Avatars Service:**
  * Generates fallback user initials avatars (`new Avatars(client).getInitials(name)`) if no Google profile picture or custom avatar exists.
* **Environment Keys:** `VITE_APPWRITE_ENDPOINT`, `VITE_APPWRITE_PROJECT_ID`, `VITE_APPWRITE_DATABASE_ID`, `VITE_APPWRITE_USERS_TABLE_ID`, `VITE_APPWRITE_SKILLS_TABLE_ID`, `VITE_APPWRITE_TESTIMONIALS_TABLE_ID`, `VITE_APPWRITE_AVATARS_BUCKET_ID`.

---

## 📊 Database Engine: MongoDB Atlas

MongoDB Atlas stores the indexed records of crawled GitHub skills to enable quick search.

* **Driver:** `mongodb` (Node.js SDK)
* **API Proxy Endpoint:** `GET /api/github-skills` handles querying MongoDB Atlas directly, translating inputs into fast regular-expression based queries.
* **Optimization:** Leverages a pooled client configuration in `api/lib/mongodb.js` to prevent socket exhaustion during rapid Vercel serverless function invocations.
* **Environment Keys:** `MONGODB_URI`, `MONGODB_DB`.

---

## 🌐 Google OAuth API (UserInfo)

Used to fetch profile photos during Google Sign-in to sync avatar images seamlessly.

* **Endpoint:** `https://www.googleapis.com/oauth2/v3/userinfo`
* **Mechanism:** `AuthContext.jsx` queries this endpoint using the provider access token returned by Google OAuth. The retrieved `info.picture` is cached to Appwrite user preferences.

---

## 🎨 Asset Delivery: Fontshare API

* **Endpoint:** `https://api.fontshare.com/`
* **Mechanism:** Dynamically loads typography assets at runtime. These stylesheets and font packages are cached offline by the PWA's Workbox Service Worker cache strategies (`font-cache` CacheFirst configuration in `vite.config.js`).
