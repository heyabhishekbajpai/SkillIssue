# skill issue.

> *Does your AI agent have a skill issue?*

**Skill Issue** is a marketplace where people discover, save, share, and combine `.md` skill files that supercharge AI agents — think GitHub, but for AI skills.

Whether you're a developer dropping skill files into Cursor, or a teacher pasting one into your Custom GPT, Skill Issue has you covered.

---

## what's a skill file, anyway?

A skill file is a `.md` file containing instructions that tell your AI exactly how to behave for a specific task. Instead of explaining everything every time, you drop in a skill and your AI instantly knows what to do.

No code. No prompting expertise required. Just describe what you want, and we'll build the skill for you.

---

## what you can do here

- 🔍 **Browse** thousands of skills from Anthropic, Vercel, OpenAI, HuggingFace and the community
- ✨ **Build** your own skill by just describing what you want in plain English — our AI handles the rest
- 📦 **Download** skills as `.zip` folders or **copy** them straight to your clipboard
- 🔒 **Save privately** to your personal vault or **publish** for the world
- 🤝 **Combine** multiple skills into one powerful package
- 🌐 **Share** any skill with a single link

---

## built for everyone

A lawyer who wants their AI to draft contracts properly. A teacher who wants better student notices. A YouTuber who wants scripts that don't sound like a robot wrote them. A developer who wants their coding agent to stop making the same mistakes.

**Skill Issue is for all of them.**

---

## the stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Appwrite |
| Auth | Appwrite Google OAuth + Email/Password + Magic Link |
| AI (Skill Builder) | Groq — Llama 4 Scout (vision) + Llama 3.3 70B |
| Featured Skills | GitHub API — fetched in realtime |
| Hosting | Vercel |
| Domain | skillissue.bajpai.tech |

---

## featured sources

Skills are fetched live from GitHub — always up to date, never stale.

- [Anthropic](https://github.com/anthropics/skills) — official skills
- [Vercel](https://github.com/vercel-labs/agent-skills) — official skills
- [OpenAI](https://github.com/openai/skills) — official skills
- [HuggingFace](https://github.com/huggingface/skills) — official skills
- [OpenClaw](https://github.com/openclaw/skills) — community skills
- [Composio](https://github.com/ComposioHQ/awesome-claude-skills) — community skills

---

## how to use a skill

**For non-technical users (ChatGPT / Gemini / Claude):**
1. Find a skill you like
2. Hit **Copy**
3. Paste into your Custom GPT, Gem, or Claude Project instructions
4. Done — your AI just got smarter

**For developers (Cursor / Windsurf / Claude Code):**
1. Find a skill you like
2. Hit **Download .zip**
3. Drop the folder into your `.agents/` or `skills/` directory
4. Done

---

## running locally

```bash
git clone https://github.com/heyabhishekbajpai/SkillIssue
cd SkillIssue
npm install
```

Create a `.env` file:

```env
# Appwrite — https://cloud.appwrite.io
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=skill-issue-db
VITE_APPWRITE_USERS_TABLE_ID=users
VITE_APPWRITE_SKILLS_TABLE_ID=skills
VITE_APPWRITE_AVATARS_BUCKET_ID=avatars

# Groq — https://console.groq.com
VITE_GROQ_API_KEY=your_groq_api_key

# GitHub (optional, increases rate limit from 60 to 5000 req/hr)
VITE_GITHUB_TOKEN=your_github_token
```

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

> **Note:** If Appwrite is not configured, the app automatically falls back to a local mock user so you can still develop and test the UI without a live backend.

---

## contributing

Got a skill to share? Build it on [skillissue.bajpai.tech](https://skillissue.bajpai.tech) and publish it. That's it. No PRs needed.

If you want to contribute to the codebase itself — issues and PRs are welcome.

---

## the name

Yes, it's a meme. Yes, it's intentional.

Your AI has a skill issue. We fix that.



## made by

**Abhishek Bajpai** — [bajpai.tech](https://bajpai.tech) · [GitHub](https://github.com/heyabhishekbajpai)

*"there is nothing to read about me"* — my GitHub bio, apparently

---

<p align="center">
  <img src="public/skill-issue-white.png" width="200" alt="Skill Issue Logo" />
  <br/>
  <i>boost your AI productivity by up to 70%</i>
</p>