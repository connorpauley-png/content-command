# Content Command V2 — Master Build Plan
Generated: Feb 13, 2026

---

## PHASE 1: Stop the Bleeding (Today)
Fix critical bugs, strip dead code, make it safe.

### 1.1 — Fix Drag-and-Drop Publish Bug
- [ ] `pipeline/page.tsx`: Remove `movePost()` from `handleDragOver` — only track visual state
- [ ] `handleDragEnd`: Add confirmation modal before publishing (drag to Posted or Scheduled)
- [ ] Add "Publish Lock" — once published, post is immutable

### 1.2 — Fix File Upload Stale Closure
- [ ] `pipeline/page.tsx`: Fix `onChange` handler — accumulate URLs via functional setState, not snapshot

### 1.3 — Fix TypeScript Compilation Errors
- [ ] Add `brandColors` to `BusinessConfig` type
- [ ] Expand `TemplateData.brandColors` to include `background` + `text`
- [ ] Fix Buffer response types in template render routes (`new Uint8Array(png)`)
- [ ] Fix `migration.ts` SSR issue

### 1.4 — Strip Dead Code (~800 lines)
- [ ] Delete `photo-source-dialog.tsx` (replaced by AssetSourceDialog)
- [ ] Delete `post-card-v2.tsx` (unused)
- [ ] Delete `content-type-filter.tsx` (unused)
- [ ] Delete `template-preview.tsx` (unused)
- [ ] Delete all unused setup step components (`step-accounts.tsx`, `step-business.tsx`, `step-ai.tsx`, `step-integrations.tsx`, `step-strategy.tsx`)
- [ ] Delete `store/used-photos.ts` (never imported)
- [ ] Delete `store/schedule.ts` (duplicates config schedule)
- [ ] Delete `api/accounts/route.ts` (stub)
- [ ] Delete `api/config/route.ts` (vestigial file-based config)

### 1.5 — Fix Dead API Routes
- [ ] Remove `api/posts/[id]/route.ts` and `api/posts/[id]/move/route.ts` (filesystem-based, won't work on Vercel)
- [ ] Remove or fix `api/command/route.ts` hardcoded sqlite paths

### 1.6 — Calendar Hydration Fix
- [ ] Add `useEffect(() => setMounted(true), [])` guard to calendar page

### 1.7 — Save Brand Color in Setup
- [ ] Wire `brandColor` state into `buildConfig()` so it persists

---

## PHASE 2: New Render Engine (Day 2)
Replace Playwright with Satori + Resvg. 10x faster, no browser.

### 2.1 — Install Dependencies
- [ ] `npm install satori @resvg/resvg-js`
- [ ] Remove Playwright dependency

### 2.2 — Build New Render Engine
- [ ] Create `src/lib/template-engine.ts` — Satori + Resvg pipeline
- [ ] Load fonts: Newsreader (serif headlines), Inter (body), IBM Plex Mono (accents)
- [ ] 1080x1080 default, 1080x1350 portrait option

### 2.3 — Rebuild 5 Premium Editorial Templates
- [ ] **The Quote** — Large serif text, attribution, subtle logo, grain texture
- [ ] **The Proof** — Customer review + star rating + job photo overlay
- [ ] **Before/After** — Split frame, transformation labels, consistent crop
- [ ] **The Tip** — Numbered list, bold headline, actionable format
- [ ] **The Promo** — Offer/CTA, urgency, seasonal-ready

### 2.4 — Design System Constants
- [ ] Color palette: Deep forest #0A1F0A, sage accent #81C784, warm gold #E2B93B, off-white #F5F5F0
- [ ] Type scale: 72/48/32/20/16
- [ ] Spacing: 4px grid, 60px minimum padding
- [ ] Subtle grain texture SVG filter

### 2.5 — Update Render API Route
- [ ] Swap `api/templates/render/route.ts` to use new engine
- [ ] Swap `api/templates/gemini-render/route.ts` or delete
- [ ] Update asset attachment to use new engine

---

## PHASE 3: Unified Publisher (Day 2-3)
One interface, per-platform adapters, background job queue.

### 3.1 — Publisher Interface
- [ ] Create `src/lib/publishers/core/types.ts` — Publisher interface (validate, preparePayload, publish, fetchMetrics, refreshCredentials)
- [ ] Create `src/lib/publishers/core/errors.ts` — PublisherError classes
- [ ] Create `src/lib/publishers/core/retry.ts` — Exponential backoff with jitter

### 3.2 — Platform Adapters
- [ ] Rebuild `publishers/twitter.ts` implementing Publisher interface
- [ ] Rebuild `publishers/linkedin.ts` — migrate to Posts API
- [ ] Rebuild `publishers/facebook.ts` implementing Publisher interface
- [ ] Rebuild `publishers/instagram.ts` implementing Publisher interface
- [ ] Add `publishers/gbp.ts` — Google Business Profile posting
- [ ] Add stubs for TikTok, Nextdoor (graceful "not available")

### 3.3 — Delete Duplicate Logic
- [ ] Remove `src/lib/platforms/*.ts` (old adapter layer)
- [ ] Remove `src/app/api/publish/twitter/route.ts` (per-platform routes)
- [ ] Remove `src/app/api/publish/facebook/route.ts`
- [ ] Remove `src/app/api/publish/instagram/route.ts`
- [ ] Remove `src/app/api/publish/linkedin/route.ts`

### 3.4 — Orchestrator
- [ ] Create `src/lib/publishers/orchestrator.ts`
- [ ] NormalizedPost format — universal content contract
- [ ] Parallel validation, sequential publish with rollback
- [ ] Idempotency keys: tenantId + postId + platform + scheduledAt + payloadHash

### 3.5 — Publish Job Queue
- [ ] Create `publish_jobs` table in Supabase (status, retries, payload_hash, result)
- [ ] Create `POST /api/publish-jobs` — validates approval + tokens, creates job
- [ ] Worker endpoint that consumes jobs every 5 min
- [ ] "Needs Reauth" as first-class status when tokens expire
- [ ] Audit log table for every publish action

### 3.6 — Update Unified Publish Route
- [ ] `api/publish/route.ts` → calls orchestrator directly (no internal fetch)

---

## PHASE 4: Auth + Multi-Tenant (Day 3-4)
Lock everything down before going multi-tenant.

### 4.1 — Auth Middleware
- [ ] Install `@supabase/auth-helpers-nextjs`
- [ ] Create `middleware.ts` — validate JWT on all `/api/*` routes
- [ ] Add API key auth option for background jobs

### 4.2 — Database Schema Updates
- [ ] Add `tenant_id` to `cc_posts`, `tasks`, `publish_jobs`, `assets`, `audit_log`
- [ ] Enable RLS on all tables
- [ ] Add policies: `tenant_id = auth.jwt() ->> 'tenant_id'`
- [ ] Encrypted token storage for OAuth credentials

### 4.3 — Multi-Tenant Data Model
- [ ] Create `businesses` table (id, name, slug, settings, subscription_tier)
- [ ] Create `users` table (references auth.users)
- [ ] Create `business_members` table (business_id, user_id, role)
- [ ] Create `connected_accounts` table (business_id, platform, tokens encrypted)

### 4.4 — Tenant Scoping
- [ ] Middleware extracts tenant from JWT/session
- [ ] Every API route scoped to tenant
- [ ] Every Supabase query scoped to tenant

---

## PHASE 5: Pipeline Rebuild (Day 4-5)
Requirements-based workflow, not column-based.

### 5.1 — New Pipeline Model
- [ ] Reduce to 5 columns: Ideas → In Progress → Approved → Scheduled → Published
- [ ] Add `requirements[]` and `completed_requirements[]` to Post type
- [ ] Requirements engine: auto-determines what each post needs based on type + platform
- [ ] Sub-states (needs assets, needs photo approval) become checklist items within cards

### 5.2 — Approval System
- [ ] Add `approvals` table (post_id, requirement_id, requested_by, approved_by, status)
- [ ] Email/SMS notification when content needs review
- [ ] One-click approve/reject from notification
- [ ] Auto-approve after 24h option (configurable per tenant)
- [ ] Version locking — approved post version is immutable

### 5.3 — Client Approval Portal
- [ ] Shareable magic link (no login required)
- [ ] Shows pending posts with preview
- [ ] Thumbs up/down + comment field
- [ ] Rejection feeds back to "In Progress" with notes

### 5.4 — Confidence-Based Auto-Publishing
- [ ] AI scores each post (brand voice match, platform optimization, historical performance)
- [ ] Above 85% → auto-schedule, notify owner
- [ ] 70-85% → queue for quick one-click approval
- [ ] Below 70% → full review required
- [ ] Configurable thresholds per tenant

### 5.5 — Smart Automation
- [ ] "Fill My Week" — one button fills pipeline from content pillars
- [ ] Auto-reschedule underperformers
- [ ] Evergreen recycler — top performers re-post every 90 days with fresh copy
- [ ] Gap detection — "You have nothing scheduled for Thursday"

---

## PHASE 6: Analytics + Lead Attribution (Day 5-6)
Prove ROI in dollars, not likes.

### 6.1 — Post Performance Tracking
- [ ] Create `post_analytics` table (post_id, platform, impressions, engagements, clicks, shares, comments, measured_at)
- [ ] Background job: fetch metrics 48h after publish via platform APIs
- [ ] Performance dashboard cards: engagement trends, best content types, follower growth

### 6.2 — Lead Attribution
- [ ] Auto-inject UTM parameters per platform/account/post on all links
- [ ] Call tracking number rotation per post (Twilio integration)
- [ ] Form fill tracking via UTM
- [ ] Dashboard: "This post generated X calls, Y forms, est. $Z revenue"

### 6.3 — Monthly ROI Report
- [ ] Auto-generate PDF/email report per tenant
- [ ] Sections: posts published, engagement, leads generated, estimated revenue
- [ ] Competitor comparison (if enabled)
- [ ] AI insights: "Your carousels outperform single images 3x — do more"

### 6.4 — Competitor Intelligence
- [ ] Input 3-5 local competitors during onboarding
- [ ] Background scraper for public social feeds
- [ ] `competitor_posts` table
- [ ] Weekly digest: what competitors posted, engagement rates, content gaps
- [ ] Auto-suggest counter-content

---

## PHASE 7: Integrations + Features (Day 6-7)
The stuff that makes it sticky.

### 7.1 — Review + Reputation Engine
- [ ] Pull Google Business reviews via API
- [ ] AI drafts responses in brand voice
- [ ] Push notification for new reviews
- [ ] One-click approve response
- [ ] Auto-generate social posts from 5-star reviews

### 7.2 — CompanyCam Deep Integration
- [ ] One-click "turn this album into 5 posts" (carousel, story, reel, GBP, tip)
- [ ] Auto-detect before/after pairs via vision AI
- [ ] Photo quality scoring
- [ ] Auto-tag by service type

### 7.3 — Google Business Profile Publishing
- [ ] Full GBP post creation (Offer, Event, Update types)
- [ ] Local SEO boost — auto-generate posts with location keywords
- [ ] Sync business hours, photos, services

### 7.4 — Seasonal/Event Content
- [ ] Industry-specific holiday calendar
- [ ] Local event detection
- [ ] Weather-triggered content suggestions
- [ ] Auto-generate seasonal campaigns

### 7.5 — Employee Advocacy
- [ ] "Shareable" post curation by owner
- [ ] Weekly digest to employees via magic link
- [ ] One-click share to personal LinkedIn with pre-approved copy
- [ ] Leaderboard: which employees drive most engagement

### 7.6 — Brand Asset Library
- [ ] Upload logos, photos, brand colors once
- [ ] Version control on brand assets
- [ ] Auto-reference in all templates
- [ ] Custom font uploads

---

## PHASE 8: Premium Polish (Day 7-8)
Production-ready, sellable product.

### 8.1 — Mobile-First Approval
- [ ] PWA with offline support
- [ ] SMS with image preview + approve/reject buttons
- [ ] Push notifications for pending approvals

### 8.2 — Content Calendar View
- [ ] Month/week grid view (not just kanban)
- [ ] Drag-to-reschedule
- [ ] Color-coded by platform/pillar
- [ ] Gap visualization

### 8.3 — A/B Testing
- [ ] Generate 2-3 variations per post
- [ ] Publish variation A, track 48h, compare
- [ ] Auto-learn which hooks/formats/times perform best
- [ ] Feed learnings back into generation prompts

### 8.4 — White-Label
- [ ] Custom domains per agency
- [ ] Custom branding (logo, colors, name)
- [ ] Remove all Content Command branding
- [ ] Agency dashboard (manage all client tenants)

### 8.5 — Onboarding Flow
- [ ] Brand voice calibration interview (AI-guided)
- [ ] Template customization wizard
- [ ] Account connection + test publish
- [ ] First week content bank generation
- [ ] Strategy session summary

---

## Pricing Structure

| Tier | Monthly | Setup Fee | Includes |
|------|---------|-----------|----------|
| Starter | $299 | $1,500 | 1 business, 3 platforms, 20 posts/mo, basic templates, scheduling |
| Growth | $499 | $2,500 | 1 business, all platforms, 60 posts/mo, analytics, CompanyCam, approval portal |
| Pro | $799 | $3,000 | 3 businesses, unlimited posts, A/B testing, competitor intel, ROI reports |
| Agency | $1,499 | $5,000 | Unlimited businesses, white-label, API access, priority support |

**Add-ons:**
- Extra AI posts: $25/post beyond plan limit
- Video generation: $99/mo
- Ad management: 15% of spend + $300/mo
- Extra location: $199/mo

---

## Execution Strategy
Phases 1-3 can run in parallel via spawned agents.
Phases 4-5 depend on Phase 3 (need publisher interface before auth scoping).
Phases 6-8 can partially parallelize.

**Estimated total: 8 focused build days.**

---

*This plan is the single source of truth. Update as phases complete.*
