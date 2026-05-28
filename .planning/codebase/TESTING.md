# Testing Setup and Verification Processes

This document details the test environment setup, verification scripts, manual testing processes, and automation rules in place for the **Skill Issue** codebase.

---

## 🔍 Current State of Automated Testing

> [!NOTE]
> Currently, the Skill Issue codebase **does not use an automated unit, integration, or E2E testing framework** (like Vitest, Jest, Playwright, or Cypress) in the `package.json` configurations.
>
> Testing is primarily driven by **script-based system verification**, **manual local runtime execution**, **client-side structural validation rules**, and **CI/CD cron workflow logs**.

---

## 🛠️ Verification Strategies & Scripts

Verification in this codebase relies on a combination of helper scripts, local proxies, and schema setups:

### 1. Script-Based Verification & Seeding
In the `scripts/` directory, several Node.js utility scripts are used to verify database setups, seed mocks, and check model validity.

| Script Name | Purpose |
|-------------|---------|
| `scripts/setup-appwrite.mjs` | Configures Appwrite databases and verify structural attributes. |
| `scripts/setup-testimonials.mjs` | Validates and creates the collections needed for testimonials. |
| `scripts/seed-testimonials.mjs` | Feeds mock testimonials to ensure the testimonial slider and display components work correctly. |
| `scripts/fix-testimonials-collection.mjs` | Patches collection permissions and attributes to solve database connectivity issues. |
| `scripts/migrate-github-skills-to-mongo.mjs` | Ensures skill data transitions correctly from Github to MongoDB without data loss. |

To run any script for local verification:
```bash
node scripts/<script-name>.mjs
```

### 2. Client-Side Input Validation Testing
The application validates skill file structural requirements before submission. The core algorithm in `src/lib/parseSkillFile.js` (`validateSkillFile` function) acts as an active validation testing layer:
- **File Type Verification:** Rejects non `.md` extensions.
- **File Size Constraint:** Ensures file does not exceed **5MB**.
- **Length Constraint:** Validates that content is not empty or below the minimum length.
- **Metadata Structure Verification:** Ensures title, description, and keywords are properly parsed and not empty.

### 3. Local Mock Proxy Testing
To test edge functions and external APIs locally without deploying, the Vite development server implements three custom local proxies inside `vite.config.js`:
- **Groq API Proxy (`groqApiPlugin`):** Intercepts `POST /api/generate` and routes it to the local Groq API handler to test LLM-driven skill file generation.
- **GitHub Skills Proxy (`githubSkillsPlugin`):** Sets up Vercel-like environment variables and redirects `api/github-skills` endpoints locally.
- **Sitemap Proxy (`sitemapPlugin`):** Serves `sitemap.xml` dynamic generators locally.

---

## 🤖 CI/CD and Integration Pipelines

### GitHub Actions Crawler Workflow
The only continuous integration workflow is `.github/workflows/crawl-skills.yml`. It acts as a recurring system integration test:
- **Trigger:** Configured to run every 1st and 15th of the month at 3:00 AM UTC, or manually via `workflow_dispatch`.
- **Steps executed:**
  1. Clones the repository.
  2. Sets up Node.js 20 environment with npm caching.
  3. Installs dependencies using `npm ci`.
  4. Runs the crawler execution script: `node scripts/run-crawler.mjs`.
  5. Uses secrets (`MONGODB_URI`, `GH_PAT`) to authenticate integrations.

---

## 📈 Recommended Future Testing Roadmap

To bring the codebase to a production-grade testing baseline, we recommend implementing the following tools and strategies:

### 1. Unit Testing with Vitest
Since the codebase relies on sophisticated client-side Markdown parsing (`src/lib/parseSkillFile.js` and `src/lib/utils.js`), setting up unit tests is highly recommended.
- **Installation:**
  ```bash
  npm install -D vitest
  ```
- **Target Modules:**
  - `src/lib/parseSkillFile.js` (Verify YAML frontmatter extraction, category word scoring).
  - `src/lib/utils.js` (Verify `cn` helper with multiple nested conditional formats).

### 2. E2E and UI Testing with Playwright
Given the rich animations (Framer Motion) and complex modal flows (Auth, Profiles, Skill Uploaders), End-to-End browser tests will ensure critical user paths remain unbroken.
- **Installation:**
  ```bash
  npm init playwright@latest
  ```
- **Target Flows:**
  - Standard user login and account creation (`src/components/AuthModal.jsx`).
  - Navigating, searching, and filtering skills (`src/pages/BrowseSkills.jsx`).
  - Uploading a valid/invalid `.md` skill file.
