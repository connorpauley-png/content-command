# Content Command V2 — Setup Guide

Everything you need to get Content Command running on your machine. Takes about 15 minutes.

---

## Step 1: Install Prerequisites

You need two things installed:
- **Node.js** (v18 or higher) — https://nodejs.org (download the LTS version)
- **Git** — https://git-scm.com/downloads

To check if you already have them, open your terminal and run:
```
node -v
git --version
```
If both show version numbers, you're good.

---

## Step 2: Clone the Repo

```bash
git clone https://github.com/connorpauley-png/content-command.git
cd content-command
npm install
```

---

## Step 3: Create a Supabase Project (Free)

1. Go to https://supabase.com and click **Start your project** (sign up with GitHub if you want)
2. Click **New Project**
3. Fill in:
   - **Name:** content-command (or whatever you want)
   - **Database Password:** pick something strong, save it somewhere
   - **Region:** pick the closest one to you
4. Click **Create new project** and wait ~2 minutes for it to spin up

---

## Step 4: Create the Database Tables

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Paste this entire block and click **Run**:

```sql
-- Posts table
CREATE TABLE IF NOT EXISTS cc_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL DEFAULT 'default',
  account_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'photo',
  status TEXT NOT NULL DEFAULT 'idea',
  content TEXT NOT NULL DEFAULT '',
  media_urls JSONB DEFAULT '[]'::jsonb,
  hashtags JSONB DEFAULT '[]'::jsonb,
  template_data JSONB,
  asset_notes TEXT,
  image_prompt TEXT,
  platform_tips TEXT,
  asset_type TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  pillar TEXT,
  ai_generated BOOLEAN DEFAULT true,
  publish_result JSONB,
  photo_source TEXT,
  content_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks table (for command center)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (but allow all for now)
ALTER TABLE cc_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Allow all operations (open access — fine for personal use)
CREATE POLICY "Allow all on cc_posts" ON cc_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cc_posts_updated_at
  BEFORE UPDATE ON cc_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

You should see "Success. No rows returned." That means it worked.

---

## Step 5: Create the Storage Bucket

1. In your Supabase dashboard, click **Storage** in the left sidebar
2. Click **New bucket**
3. Name it: `enhanced-photos`
4. Toggle **Public bucket** to ON
5. Click **Create bucket**

---

## Step 6: Get Your Supabase Keys

1. In your Supabase dashboard, click **Settings** (gear icon) in the left sidebar
2. Click **API** under Configuration
3. You need two things from this page:
   - **Project URL** — looks like `https://abcdefghijk.supabase.co`
   - **service_role key** (under "Project API keys") — the long one labeled `service_role` (NOT the `anon` key)

**Keep this tab open, you'll need these in the next step.**

---

## Step 7: Set Up Your Environment File

1. In the project folder, create a file called `.env.local`
2. Paste this in and fill in your values:

```
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# AI Provider (pick ONE — Google is free)
GOOGLE_AI_STUDIO_KEY=your-google-ai-key-here

# OR use OpenAI
# OPENAI_API_KEY=your-openai-key-here

# Social Media API Keys (OPTIONAL — only needed for auto-publishing)
# TWITTER_CONSUMER_KEY=
# TWITTER_CONSUMER_SECRET=
# TWITTER_ACCESS_TOKEN=
# TWITTER_ACCESS_TOKEN_SECRET=
# META_PAGE_TOKEN=
# META_PAGE_ID=
# META_IG_ACCOUNT_ID=
# LINKEDIN_ACCESS_TOKEN=
# LINKEDIN_PERSON_URN=
```

### Getting a Google AI Studio Key (free):
1. Go to https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click **Create API key**
4. Copy it into your `.env.local`

---

## Step 8: Run It

```bash
npm run dev
```

Open http://localhost:3000 in your browser. You should see the Content Command dashboard.

---

## Step 9: Initial Setup Wizard

The first time you open it, you'll go through a setup wizard:
1. **Business info** — your company name, industry, location, services
2. **AI config** — paste your Google AI Studio key (or OpenAI key)
3. **Accounts** — add your social media accounts (Instagram, Twitter, etc.)
4. **Strategy** — it auto-generates content pillars and a posting calendar

After setup, you're ready to generate content.

---

## Quick Start (After Setup)

1. Go to **Generate** → pick an account → generate ideas
2. Approve the ideas you like → they auto-build into full posts
3. Posts land in your **Pipeline** → drag them through the workflow
4. When a post hits "Scheduled" with a date/time → it auto-publishes

---

## Troubleshooting

**"Cannot connect to database"**
- Double-check your `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- Make sure there are no extra spaces or newlines in the keys

**"Module not found"**
- Run `npm install` again

**Port already in use**
- Run `npx next dev -p 3035` (or any open port)

**Posts not publishing**
- Social media API keys are optional — you need them filled in for auto-publish to work
- Without them, you can still generate/manage content and copy-paste manually

---

## Project Structure (If You Want to Customize)

```
src/
  app/           — Pages and API routes
  components/    — UI components (pipeline, cards, dialogs)
  lib/
    store/       — Zustand stores (config, posts, schedule — all localStorage)
    templates/   — 10 graphic templates (quote cards, before/after, etc.)
    publishers/  — Platform-specific publish logic
    ai/          — AI generation (ideas, posts, image prompts)
  types/         — TypeScript type definitions
```

Most of your data lives in **localStorage** (browser). The Supabase tables are used for the command center dashboard and image storage. If you clear your browser data, you'll lose your pipeline — so don't do that.

---

That's it. You're up and running. 🤙
