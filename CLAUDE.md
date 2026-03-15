# pz-news — CLAUDE.md

> This is the single source of truth for Claude Code. Read this file fully before touching any code. The file `pz-news-prototype.html` in the project root is the approved visual reference — read it before building any frontend component.

---

## What is pz-news

pz-news is a mobile-first personalised briefing platform. Users follow topics (keywords), YouTube channels, and YouTube playlists. The system fetches content daily, deduplicates it via embeddings, summarises it with AI, and delivers a clean digest — readable like a newspaper or listenable as an audio brief.

---

## Monorepo Structure

```
pz-news/
├── frontend/                   # Next.js 14 (App Router), Tailwind, TypeScript
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Landing page
│   │   │   ├── signin/             # Google OAuth + Guest entry
│   │   │   ├── onboarding/         # 3-step setup flow
│   │   │   ├── dashboard/          # Main app (all tabs)
│   │   │   ├── profile/            # Profile + settings screen
│   │   │   └── interest/[id]/      # Per-interest news history
│   │   ├── components/
│   │   └── lib/
│   │       └── api.ts              # Typed fetch wrappers for all Worker endpoints
│   └── package.json
├── worker/                     # Cloudflare Worker (Hono, TypeScript)
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   ├── services/
│   │   └── db/
│   └── wrangler.toml
├── pz-news-prototype.html      # Approved design reference — read before building UI
└── CLAUDE.md
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 App Router, Tailwind CSS, TypeScript |
| Fonts | Satoshi Variable (UI, body, logo) + Instrument Serif (editorial headings, article titles) |
| Brand accent | `#1a5e3c` (forest green) |
| API | Cloudflare Workers, Hono router |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2 (audio files) |
| Cache / Limits | Cloudflare KV |
| Queue | Cloudflare Queues |
| Cron | Cloudflare Cron Triggers |
| Auth | Google OAuth 2.0 → JWT in KV |
| LLM preprocessing | Claude Haiku |
| LLM summarisation | Claude Sonnet |
| Embeddings | Cloudflare Workers AI |
| Audio | ElevenLabs API |
| YouTube | YouTube Data API v3 |
| News / RSS | NewsAPI + RSS |

---

## Design Tokens (never hardcode colours)

```css
--white: #ffffff;  --paper: #f6f8fa;  --surface: #eef1f4;
--sur2: #e4e8ed;   --rule: #dde2e8;   --rule2: #c8d0d9;
--ink: #0d1117;    --ink2: #24292f;   --ink3: #57606a;   --ink4: #8c959f;

/* Brand */
--a: #1a5e3c;  --a-dark: #124229;  --a-mid: #276b47;
--a-pale: #e8f5ee;  --a-rule: rgba(26,94,60,.14);

/* Category badges */
--c-violet: #4f46e5;  --c-violet-pale: #eeecff;
--c-rose:   #be123c;  --c-rose-pale:   #fff1f4;
--c-blue:   #1d4ed8;  --c-blue-pale:   #eff4ff;
--c-amber:  #b45309;  --c-amber-pale:  #fefce8;
--c-slate:  #334155;  --c-slate-pale:  #f1f5f9;
--c-teal:   #0d7490;  --c-teal-pale:   #ecfeff;

/* System */
--ok: #16a34a;  --ok-pale: #f0fdf4;
--warn: #b45309;  --warn-pale: #fffbeb;
--err: #dc2626;  --err-pale: #fef2f2;

--r: 8px;  --r-lg: 14px;
```

---

## Logo

Plain text wordmark, no icons or shapes. The `•` is a literal Unicode bullet character, coloured green.

```html
<div class="logo-word">pz<span class="lo-dot">•</span>news</div>
```

CSS: Satoshi 900, `font-size: 19px`, `letter-spacing: -.02em`. Only rule needed: `.logo-word .lo-dot { color: var(--a) }`.

---

## User Roles & Limits

| | Guest | Registered |
|---|---|---|
| Topics | Max 2 | Max 20 |
| YouTube channels | ✗ | ✓ |
| YouTube playlists | ✗ | ✓ |
| Daily refreshes | 3 total (lifetime) | 6/day |
| Audio listens | ✗ | 20/day |
| Quiz sessions | ✗ | 6/day |
| Session | 24h | Persistent |
| Auth | None | Google Sign-In only |

---

## Onboarding Flow (3 steps)

```
Sign in → Step 1: Occupation → Step 2: Add Interests + Verify → Step 3: Schedule → Dashboard
```

### Step 1 — Occupation
Six options: Student / Founder or Business owner / Full-time employee / Intern / Looking for jobs / Other.
Must select one before continuing. Stored in `users.occupation`. Shown in profile.

### Step 2 — Add Interests
- Topics: keyword input + 9 hardcoded suggestions
- YouTube Channels: paste URL + 9 hardcoded suggestions (disabled in guest mode)
- YouTube Playlists: paste URL + 9 hardcoded suggestions (disabled in guest mode)

**Blocked topics:** Run Haiku safety check before saving. In verify screen, blocked topics show greyed with strikethrough + "✗ Excluded". Safe topics show "✓ Safe".

**Guest:** Channels/playlists disabled. >2 topics shows upgrade nudge.

### Step 3 — Schedule
- **Once a day** — user picks time via `<input type="time">`. Default 07:00.
- **Twice a day** — user picks first time. Second = first + 12h, shown live.
- **On demand** — no time picker. Up to 6 refreshes/day.

---

## Hardcoded Suggestions (edit here to update)

```js
// Topics (9) — 2025/26 trends
['AI Agents','Space Commercialisation','Longevity Research','Climate Tech',
 'Indian Economy','Quantum Computing','Neurotech','Open Source AI','Geopolitics']

// Channels (9)
['Lex Fridman','Kurzgesagt','Veritasium','3Blue1Brown','Y Combinator',
 'TED','Fireship','Two Minute Papers','Real Engineering']

// Playlists (9)
['CS50 Harvard','MIT OpenCourseWare','Khan Academy Math','Stanford ML',
 'TED-Ed Science','freeCodeCamp','Andrej Karpathy ML','Yale Open Courses','NPTEL Engineering']
```

---

## Database Schema (Cloudflare D1)

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT, avatar_url TEXT,
  occupation TEXT,   -- student|founder|employee|intern|jobseeker|other
  role TEXT DEFAULT 'user',
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,          -- keyword|youtube_channel|youtube_playlist
  value TEXT NOT NULL,
  display_name TEXT,
  is_active INTEGER DEFAULT 1,
  is_archived INTEGER DEFAULT 0,
  backfill_done INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE refresh_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  triggered_at INTEGER DEFAULT (unixepoch()),
  completed_at INTEGER, error_text TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE topic_sources (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL, refresh_job_id TEXT NOT NULL,
  source_url TEXT, title TEXT, raw_content TEXT,
  embedding_vector TEXT,
  fetched_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (topic_id) REFERENCES topics(id)
);

CREATE TABLE summary_documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL, topic_id TEXT NOT NULL, refresh_job_id TEXT NOT NULL,
  title TEXT NOT NULL,
  intro TEXT NOT NULL,        -- opening paragraph, no italic in UI
  bullets TEXT NOT NULL,      -- JSON array
  closing TEXT NOT NULL,
  source_urls TEXT NOT NULL,  -- JSON array
  source_names TEXT NOT NULL, -- JSON array
  key_terms TEXT,             -- JSON array
  sentiment TEXT DEFAULT 'neutral',
  published_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (topic_id) REFERENCES topics(id)
);

CREATE TABLE glossary_terms (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL, topic_id TEXT NOT NULL,
  term TEXT NOT NULL, definition TEXT NOT NULL,
  source_summary_id TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE quiz_sets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL, topic_id TEXT NOT NULL,
  questions TEXT NOT NULL,  -- JSON [{question,options[],correct_index,explanation}]
  score INTEGER, completed_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE audio_assets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL, summary_id TEXT, topic_id TEXT,
  scope TEXT NOT NULL,    -- summary|topic_digest|daily_digest
  r2_key TEXT NOT NULL, duration_seconds INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE user_daily_limits (
  user_id TEXT NOT NULL, date TEXT NOT NULL,
  refresh_count INTEGER DEFAULT 0,
  audio_count INTEGER DEFAULT 0,
  quiz_count INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE user_schedules (
  user_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,   -- once|twice|manual
  time_1 TEXT,          -- HH:MM 24h, null for manual
  time_2 TEXT,          -- auto = time_1 + 12h for 'twice'
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## API Endpoints (Worker, all prefixed `/api/v1`)

```
POST   /auth/google
POST   /auth/logout
GET    /users/me
PATCH  /users/me

GET    /topics
POST   /topics              (runs safety check first)
PATCH  /topics/:id
DELETE /topics/:id

POST   /refresh
GET    /refresh/status/:id

GET    /summaries           ?topic_id= &date= &limit= &offset=
GET    /summaries/today
GET    /summaries/:id

GET    /glossary            ?topic_id=
POST   /glossary
DELETE /glossary/:id

POST   /quiz/generate       ?topic_id=
POST   /quiz/:id/submit
GET    /quiz                ?topic_id=

POST   /audio/summary/:id
POST   /audio/topic/:id
POST   /audio/daily
GET    /audio/:id

GET    /admin/users
GET    /admin/jobs          ?status=
POST   /admin/topics/block
```

---

## Content Pipeline

```
1. POST /refresh
   → KV limit check → 429 if exceeded
   → Create refresh_job → push to Queue → return job ID

2. Queue Worker per active topic:
   keyword     → NewsAPI + RSS (last 24h)
   yt_channel  → YouTube Data API v3
   yt_playlist → YouTube Data API v3 (new items only)

3. Deduplication
   → Workers AI embeddings → cosine > 0.85 → one per cluster

4. Haiku preprocessing
   → Strip boilerplate, max 300 words

5. Sonnet summarisation
   → {title, intro, bullets[], closing, key_terms[], sentiment}

6. Glossary upsert from key_terms

7. Audio on-demand (never automatic)
   → ElevenLabs → R2 → audio_assets

8. refresh_job → done
```

---

## First-Setup Backfill

| Type | Window |
|---|---|
| keyword | Last 7 days |
| youtube_channel | Last 1 month |
| youtube_playlist | Full playlist |

Set `backfill_done = 1` after. Show summary card at top of expanded interest view.

---

## LLM Prompts

### Haiku — safety check
```
Is this topic safe for a general news briefing platform?
Reply with only: SAFE or BLOCKED
Topic: {keyword}
```

### Haiku — preprocessing
```
Extract factual content only. Remove ads, nav, bios, boilerplate. Max 300 words.
Article: {raw_content}
```

### Sonnet — summarisation
```
Write a structured briefing about "{topic_name}". Return ONLY this JSON:
{
  "title": "Present-tense headline, max 15 words",
  "intro": "2-3 sentence context paragraph.",
  "bullets": ["Point 1","Point 2","Point 3","Point 4"],
  "closing": "1-2 sentence forward context.",
  "key_terms": ["Term1","Term2","Term3"],
  "sentiment": "positive|neutral|negative"
}
Articles: {cleaned_articles}
```

### Sonnet — quiz
```
Generate {n} multiple choice questions from these summaries about "{topic_name}".
Return ONLY a JSON array:
[{"question":"...","options":["A","B","C","D"],"correct_index":0,"explanation":"..."}]
Summaries: {summaries}
```

---

## Dashboard — Digest Tab

### Today's Digest
- Flat list, last 24h only. Empty state if nothing today.
- Greeting + "Listen to today's full digest" button.
- Cards: topic badge, time, Instrument Serif title, plain body intro (no italic), 2 bullets, source count, Listen + Quiz.

### Topics / Channels / Playlists tabs
- Grouped by interest, collapsed by default.
- Expand → backfill summary box + news by date descending.

### Detail View
Two actions only: **Listen** (primary, green) and **Quiz**. No share or save.
Intro paragraph in detail: Satoshi regular, no italic.

---

## Profile Screen

Tap avatar → profile. Contains: name, email, occupation, switch/delete account, briefing schedule (editable), AI disclaimer (mandatory, always visible), privacy policy, sign out.

### AI Disclaimer (mandatory)
> All briefings on pz·news are generated by AI from third-party sources. Content may contain errors or omissions. Do not cite it in your work. Use the linked original sources for accurate information.

---

## Rate Limit Keys (KV)

```
refresh:{user_id}:{YYYY-MM-DD}    Max 6/day
refresh:guest:{session_id}         Max 3 lifetime
audio:{user_id}:{YYYY-MM-DD}      Max 20/day
quiz:{user_id}:{YYYY-MM-DD}       Max 6/day
ratelimit:{ip}:{YYYY-MM-DD-HH}    Max 60 req/hour
```

---

## Cron

```
0 1 * * *    Daily refresh for all active users (1:30 AM IST)
```
Per-user scheduled delivery based on `user_schedules.time_1` / `time_2`.

---

## Environment Variables

### Worker
```
GOOGLE_CLIENT_ID  GOOGLE_CLIENT_SECRET  ANTHROPIC_API_KEY
YOUTUBE_API_KEY   NEWS_API_KEY          ELEVENLABS_API_KEY  JWT_SECRET
```

### Frontend .env.local
```
NEXT_PUBLIC_API_URL=https://pz-news.[account].workers.dev
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

---

## Security
- Never expose ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, JWT_SECRET to the frontend.
- All LLM and audio calls in the Worker only.
- JWT expires 7 days. Admin routes check `role === 'admin'` on every request.

---

## Deployment & Publishing

```bash
cd worker && wrangler deploy       # Cloudflare Worker
# Push frontend to GitHub → Vercel auto-deploys to pz-news.vercel.app
```

**Shareable URL (no domain needed):** `pz-news.vercel.app` is live as soon as the repo is connected to Vercel. Share this with users immediately. Add a custom domain later via Vercel Settings → Domains — zero code changes needed.

---

## Local Dev

```bash
cd frontend && npm run dev    # localhost:3000
cd worker && wrangler dev     # localhost:8787
```

---

## Not in v1
- Payments / subscription
- Hindi language support
- Mobile app
- Email digest delivery
- Browser extension
