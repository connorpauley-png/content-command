# Content Command v3

Open-source social media content management system built for local service businesses.

![Content Command](https://via.placeholder.com/800x400?text=Content+Command+Screenshot)

## What It Does

Content Command is a centralized dashboard for managing social media content across multiple platforms. Built specifically for home service businesses (lawn care, pressure washing, roofing, etc.), it combines AI-powered content generation with job photo management to keep your social media running on autopilot.

## Features

- **Multi-Platform Publishing** — Post to Instagram, Facebook, Twitter/X, LinkedIn, Nextdoor, and Google Business Profile from one place
- **AI Content Generation** — Generate platform-optimized captions using OpenAI GPT-4
- **CompanyCam Integration** — Pull job site photos directly into your content pipeline
- **Kanban Pipeline** — Visual drag-and-drop workflow: Draft → Approved → Scheduled → Published
- **Auto-Scheduling** — Set it and forget it. Posts go out at optimal times
- **AI Photo Generation** — Generate professional photos using Astria AI
- **Vision Analysis** — AI analyzes job photos and suggests captions automatically
- **Calendar View** — See your entire content calendar at a glance
- **Before/After Matching** — Automatically pair before and after job photos
- **Weather Triggers** — Auto-generate content based on local weather events
- **Multi-Tenant Ready** — Architecture supports multiple businesses

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS + shadcn/ui
- **AI:** OpenAI GPT-4 + Astria AI
- **Language:** TypeScript
- **Deployment:** Vercel

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/your-username/content-command.git
cd content-command
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your API keys (see [Platform Setup](#platform-setup) below).

### 4. Set up the database

Create a [Supabase](https://supabase.com) project and run the migration:

```bash
# Copy the SQL from migrations/002_v2_schema.sql
# and run it in your Supabase SQL Editor
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3034](http://localhost:3034).

### 6. Seed example content (optional)

```bash
curl -X POST http://localhost:3034/api/seed
```

## Platform Setup

### Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to Settings → API to find your URL, anon key, and service role key

### Twitter/X
1. Apply for a [developer account](https://developer.twitter.com)
2. Create an app with OAuth 1.0a (read/write)
3. Generate consumer keys and access tokens

### Facebook & Instagram Business
1. Create a [Meta Developer](https://developers.facebook.com) app
2. Add Facebook Login and Instagram Graph API products
3. Generate a Page Access Token with `pages_manage_posts` and `instagram_content_publish` permissions
4. Get your FB Page ID and IG Business Account ID from the API Explorer

### LinkedIn
1. Create an app at [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Request `w_member_social` scope
3. Generate an access token via OAuth 2.0

### CompanyCam
1. Get an API token from [CompanyCam](https://companycam.com)
2. Contact their support for API access

### Astria AI
1. Sign up at [astria.ai](https://www.astria.ai)
2. Create a tune (train a model on your subject)
3. Get your API key and tune ID

### OpenAI
1. Get an API key from [platform.openai.com](https://platform.openai.com)

## Database Schema

The main migration file is at `migrations/002_v2_schema.sql`. It creates:

- `cc_posts` — Content posts with platform targeting, scheduling, and status tracking
- `cc_photos` — Photo library with CompanyCam sync and AI analysis
- `cc_events` — Publishing event log
- `cc_templates` — Reusable content templates

## Architecture

```
src/
├── app/
│   ├── api/           # API routes (posting, generation, CompanyCam, etc.)
│   ├── pipeline/      # Main Kanban board view
│   ├── calendar/      # Calendar view
│   ├── photos/        # Photo library
│   └── generate/      # AI content generation
├── components/
│   ├── pipeline/      # Kanban board components
│   └── ui/            # shadcn/ui components
├── lib/
│   ├── publishers/    # Platform-specific publishing logic
│   ├── supabase.ts    # Database client
│   ├── companycam.ts  # CompanyCam API client
│   ├── astria.ts      # AI photo generation
│   └── tenant.ts      # Multi-tenant config
└── scripts/           # Python automation scripts
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License — see [LICENSE](LICENSE) for details.
