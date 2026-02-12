# Content Command v3

AI-powered social media content management for service businesses. Generate, schedule, and publish posts across Instagram, Facebook, LinkedIn, and Twitter/X — with CompanyCam integration for automatic job photo scoring.

## Features

- **Multi-platform publishing** — Instagram, Facebook, LinkedIn, Twitter/X
- **AI content generation** — OpenAI-powered post writing with brand voice
- **CompanyCam integration** — Auto-score job site photos for social media quality
- **Multi-client support** — Manage multiple businesses from one dashboard
- **Content calendar** — Visual scheduling and planning
- **Setup wizard** — Guided onboarding for new clients

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** Tailwind CSS + shadcn/ui
- **State:** Zustand (localStorage persistence)
- **AI:** OpenAI GPT-4o
- **Storage:** Supabase (image proxy)
- **APIs:** Meta Graph API, LinkedIn API, Twitter API v2, CompanyCam API

## Setup

1. Clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and fill in your API keys:
   ```bash
   cp .env.example .env.local
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) and complete the setup wizard.

## Environment Variables

See `.env.example` for all required variables. At minimum you need:

- `OPENAI_API_KEY` — for AI content generation
- `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — for image proxy
- Platform credentials for whichever social accounts you want to publish to

## License

Private — all rights reserved.
