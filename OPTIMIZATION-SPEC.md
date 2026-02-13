# Content Command V2 — Optimization Spec
*Based on Personal Brand Playbook (Feb 12, 2026)*

---

## Current State

Content Command V2 is running on port 3035, built with Next.js + Zustand (localStorage) + shadcn/ui.

### What Exists
- **Pages:** Dashboard, Command Center, Pipeline (Kanban DnD), Calendar, Generate, Accounts, Clients, Setup
- **Content types:** photo, video, reel, text, story, carousel (6 types)
- **Pipeline stages:** idea → writing → needs_photos → approve_photos → review → scheduled → (published)
- **AI generation:** Batch generate via OpenAI/Anthropic/Google, per-account with voice/pillar awareness
- **Photo sources:** Astria AI generation, CompanyCam picker
- **Publishing:** Platform adapters for X, Facebook, Instagram, LinkedIn (all verified working)
- **Multi-client:** Client switcher in sidebar, per-client configs
- **Storage:** Zustand persist (localStorage) — no Supabase for posts in v2

### What's Missing (from Playbook)
1. **No content type awareness in generation** — AI generates generic "posts", not specific formats
2. **No template system** — no quote cards, flyers, stat cards, before/afters
3. **No content pillar enforcement** — pillars exist in config but generation doesn't rotate through them
4. **No weekly calendar template** — can't say "Monday = quote card for personal, before/after for business"
5. **Post model has no `contentType` field** — can't tag a post as "quote_card" vs "before_after"
6. **No image generation for graphics** — only Astria (AI photos) and CompanyCam. No template rendering.
7. **No repurposing engine** — can't take one post and adapt it for 6 platforms
8. **No engagement tracking** — no way to see what performed well

---

## Changes Required

### 1. Expand ContentType (types/index.ts)

```typescript
export type ContentType = 
  // Existing
  | 'photo' | 'video' | 'reel' | 'text' | 'story' | 'carousel'
  // Graphics (template-rendered)
  | 'quote_card' | 'before_after' | 'testimonial' | 'stat_card' 
  | 'flyer' | 'checklist' | 'hot_take' | 'x_vs_y'
  // Narrative
  | 'origin_story' | 'crew_spotlight' | 'day_in_life'
  // Future (video)
  | 'timelapse' | 'tutorial' | 'podcast_clip'
```

### 2. Add `contentType` to Post Interface

```typescript
export interface Post {
  id: string
  clientId: string
  accountId: string
  platform: Platform
  contentType: ContentType  // NEW
  status: PostStatus
  content: string
  mediaUrls: string[]
  hashtags: string[]
  templateData?: TemplateData  // NEW — data for template rendering
  scheduledAt?: string
  publishedAt?: string
  pillar?: string
  aiGenerated: boolean
  // ... rest unchanged
}

export interface TemplateData {
  template: string  // template id
  headline?: string
  subtext?: string
  stat?: string
  statLabel?: string
  quote?: string
  author?: string
  rating?: number
  beforeImage?: string
  afterImage?: string
  items?: string[]  // for checklists
  comparison?: { left: string; right: string }  // for x_vs_y
  brandColors?: { primary: string; accent: string }
}
```

### 3. Content Type-Aware Generation

Update `/api/generate/batch/route.ts` to include content type in the prompt:

```
When generating posts, specify the content type for each:
- quote_card: Dark background, bold statement. One powerful line.
- hot_take: Polarizing statement ending with "Agree?" or engagement CTA
- x_vs_y: Two concepts compared (e.g., "Employee Mindset vs Owner Mindset")
- before_after: Caption for a before/after transformation photo
- testimonial: Format a customer review as a post
- stat_card: Single impressive metric highlighted
- origin_story: Multi-part narrative (for carousel)
- crew_spotlight: Feature a team member
- checklist: Numbered actionable tips
- flyer: Promotional announcement with CTA
```

The AI should return `contentType` in each generated item so it lands in the pipeline tagged correctly.

### 4. Template Rendering Engine

New module: `src/lib/templates/`

```
templates/
  index.ts          — registry of all templates
  renderer.ts       — HTML → PNG rendering (puppeteer or satori)
  quote-card.tsx     — dark bg, bold white text
  before-after.tsx   — side by side with labels
  testimonial.tsx    — star rating, quote, customer name
  stat-card.tsx      — big number + label
  flyer.tsx          — branded promo (CB colors)
  checklist.tsx      — numbered list with branded header
  hot-take.tsx       — statement + "Agree?"
  x-vs-y.tsx         — split comparison
```

**Rendering approach:** Use `@vercel/og` (Satori) which is already available in Next.js — generates images from JSX server-side. No puppeteer needed. Add an API route `/api/templates/render` that takes template ID + data and returns a PNG.

### 5. Weekly Content Calendar Template

New config section in AppConfig:

```typescript
export interface WeeklySchedule {
  slots: CalendarSlot[]
}

export interface CalendarSlot {
  dayOfWeek: number  // 0=Sun, 1=Mon, etc
  accountId: string
  contentType: ContentType
  pillar?: string
  time: string  // "09:00"
}
```

Default for Connor (from playbook):
```
Mon: quote_card (personal, 9AM) + before_after (business, 9AM)
Tue: reel/talking_head (personal, 9AM) + crew_spotlight (business, 9AM)
Wed: origin_story (personal, 9AM) + checklist (business, 9AM)
Thu: clipboard_quote (personal, 9AM) + before_after (business, 9AM)
Fri: stat_card (personal, 9AM) + flyer (business, 9AM)
Sat: day_in_life (personal, biweekly)
```

### 6. Repurpose Engine

New feature: "Repurpose" button on any post in the pipeline.

Given a post for @connorpauleyski on Instagram:
- Generate X/Twitter version (shorter, punchier)
- Generate LinkedIn version (more professional, longer)
- Generate Facebook version (for College Bros page)

This is a one-click "turn 1 post into 4" feature. Saves to pipeline as linked posts.

### 7. Pipeline UI Updates

- **Content type badge** on each card in the Kanban (color-coded)
- **Filter by content type** in pipeline
- **Template preview** — when a post has templateData, show a mini preview of the rendered graphic
- **"Generate Graphics" button** — for posts tagged as quote_card/stat_card/etc, renders the template and attaches as media

### 8. Generate Page Updates

- **Content type selector** — pick which types to generate (checkboxes)
- **"Fill Week" button** — generates posts based on weekly calendar template
- **Pillar rotation** — ensures generated content cycles through all pillars evenly
- **Platform-specific formatting** — LinkedIn gets line breaks, X gets concise, IG gets hashtags

---

## Implementation Priority

### Phase 1 — Type System + Generation (Day 1)
1. Expand ContentType enum
2. Add contentType + templateData to Post interface
3. Update generate/batch to include contentType in AI output
4. Add content type badge to pipeline cards
5. Add content type filter to pipeline

### Phase 2 — Template Engine (Day 2)
1. Build Satori-based renderer at /api/templates/render
2. Create first 5 templates: quote_card, before_after, testimonial, stat_card, hot_take
3. Add "Render Graphic" button to pipeline cards with template contentTypes
4. Wire rendered images into mediaUrls

### Phase 3 — Smart Calendar + Repurpose (Day 3)
1. Weekly schedule config UI
2. "Fill Week" generation using schedule template
3. Repurpose button on pipeline cards
4. Cross-platform adaptation logic

### Phase 4 — Polish (Day 4)
1. Template preview in pipeline
2. More templates: flyer, checklist, x_vs_y, crew_spotlight
3. Content pillar dashboard showing distribution
4. Template customization UI (edit colors, fonts, layout per client)

---

## Files to Modify

```
src/types/index.ts                    — ContentType, Post, TemplateData
src/app/api/generate/batch/route.ts   — content-type-aware prompts
src/app/pipeline/page.tsx             — badges, filters, render button
src/app/generate/page.tsx             — type selector, fill week
src/app/calendar/page.tsx             — weekly template view
src/lib/store/config.ts               — WeeklySchedule in AppConfig
src/lib/templates/                    — NEW directory (all template files)
src/app/api/templates/render/route.ts — NEW API route
src/components/pipeline/              — template preview component
```
