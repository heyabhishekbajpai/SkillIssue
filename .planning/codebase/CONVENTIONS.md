# Codebase Conventions and Standards

This document outlines the coding standards, style guides, linting rules, naming conventions, and best practices observed across the **Skill Issue** codebase.

---

## 💻 Tech Stack & Standards

- **Core Runtime & Build:** Node.js, Vite build tool, ESM modules (`"type": "module"` in `package.json`).
- **Frontend Framework:** React 18 using JSX (`.jsx`) for components.
- **Styling:** Tailwind CSS, PostCSS, custom CSS variables in `src/index.css`.
- **Backend/API Architecture:** Serverless edge functions under `api/` deployed on Vercel, integrating with Supabase, MongoDB, Appwrite, and Groq APIs.

---

## 📁 Naming Conventions

Consistency in file naming helps developers navigate the project easily:

### 1. Components & Pages
- **Path:** `src/components/` and `src/pages/`
- **Format:** `PascalCase.jsx`
- **Examples:**
  - `src/components/FeaturedSkillCard.jsx`
  - `src/components/EditProfileModal.jsx`
  - `src/pages/SkillDetailPage.jsx`
  - `src/pages/BrowseSkills.jsx`

### 2. Custom Hooks
- **Path:** `src/hooks/`
- **Format:** `useCamelCase.js` (Must prefix with `use`)
- **Example:** `src/hooks/useScrollAnimation.js`

### 3. Utility & Library Modules
- **Path:** `src/lib/`
- **Format:** `camelCase.js`
- **Examples:**
  - `src/lib/parseSkillFile.js`
  - `src/lib/appwrite.js`
  - `src/lib/utils.js`

### 4. API Endpoints
- **Path:** `api/`
- **Format:** `kebab-case.js` or `camelCase.js` matching route names
- **Examples:**
  - `api/github-skills.js`
  - `api/cron/index-skills.js`

### 5. Automation & Database Migration Scripts
- **Path:** `scripts/`
- **Format:** `kebab-case.mjs` (Explicitly uses the `.mjs` extension to declare ES modules natively)
- **Examples:**
  - `scripts/setup-appwrite.mjs`
  - `scripts/migrate-github-skills-to-mongo.mjs`

---

## 🎨 Code Formatting & Syntax Rules

### 1. Indentation & Whitespace
- **Spacing:** **4 spaces** indentation in utility functions, scripts, and build configuration files; standard 4 or 2 spaces in JSX files.
- **Empty Lines:** Keep code legible by leaving single empty lines between logical blocks, functions, and imports.

### 2. Imports and Module Resolution
- ES6 Imports are mandatory. Do not use CommonJS `require()`.
- Group imports logically:
  1. React core & standard library imports.
  2. Third-party packages (e.g. Framer Motion, Lucide icons, Supabase, Appwrite).
  3. Custom context or hook imports.
  4. Component imports.
  5. Utility and style imports.

```javascript
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Terminal } from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import FeaturedSkillCard from './FeaturedSkillCard'
import { cn } from '../lib/utils'
```

### 3. Semicolons & Quotes
- **Semicolons:** Semicolons are optional but used consistently in critical algorithms (such as parsing modules). Use semicolons only where necessary or when it aligns with standard practice.
- **Quotes:** Use single quotes `'` for JavaScript strings and imports. Use double quotes `"` in JSX parameters/props.
- **Templates:** Use backticks `` ` `` for multiline strings or dynamic string interpolation.

### 4. DOM & JSX Elements
- Always close tags, even self-closing ones: `<input className="..." />`.
- Prefer multi-line JSX formatting for elements with multiple props to ensure readability.
- Maintain consistent aria attributes and screen-reader friendliness on buttons, modals, and images.

---

## 🚀 CSS & UI Conventions

### 1. Tailwind Classes
- Inline classes should follow the standard utility-first order:
  1. Display & Positioning (`flex`, `fixed`, `z-50`)
  2. Box model/Layout (`w-11`, `h-11`, `padding/margin`)
  3. Borders and Shapes (`rounded-full`, `border-2`)
  4. Colors & Typography (`bg-primary`, `text-primary-foreground`)
  5. Interactivity (`transition-all`, `hover:scale-110`)

### 2. Class Merging Utility (`cn`)
To safely join classes together based on conditional statements, the custom helper `cn` defined in `src/lib/utils.js` must be used:

```javascript
export function cn(...inputs) {
    return inputs
        .flatMap(input => {
            if (!input) return [];
            if (typeof input === 'string') return [input];
            if (Array.isArray(input)) return input.map(cn);
            if (typeof input === 'object') {
                return Object.entries(input)
                    .filter(([_, value]) => Boolean(value))
                    .map(([key, _]) => key);
            }
            return [];
        })
        .join(' ');
}
```

---

## 🛠️ Best Practices & Design Patterns

### 1. Separation of Concerns
- **UI Presentation:** Kept thin. Business logic and third-party SDK calls should be moved to service layers under `src/lib/`.
- **State Management:** Local states managed using `useState`, structural state (like Auth) managed via `AuthContext.jsx`.

### 2. Parsing & Client Validation
- Markdown files (.md) uploaded by users are processed locally using custom parsers inside `src/lib/parseSkillFile.js`.
- Make use of deterministic algorithms like scoring-based keyword matching (`extractCategory`) to categorise files quickly without hitting external LLM APIs.

### 3. Server Middlewares & Mocking
- Local development is optimized via Vite server plugins inside `vite.config.js` to mock serverless routes locally (`/api/generate`, `/api/github-skills`, `/api/sitemap`). Always make sure local environment variables mirror production edge functions.
