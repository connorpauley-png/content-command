-- Content Engine Multi-Tenant Schema
-- Run this in Supabase SQL editor

-- Organizations (tenants)
create table if not exists ce_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  industry text, -- lawn_care, pressure_washing, roofing, hvac, plumbing, cleaning, general
  brand_voice text default 'professional', -- professional, friendly, casual, bold
  brand_colors jsonb default '{"primary": "#254421", "secondary": "#e2b93b"}',
  contact_phone text,
  contact_email text,
  website text,
  timezone text default 'America/Chicago',
  settings jsonb default '{}',
  plan text default 'free', -- free, pro, agency
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Users
create table if not exists ce_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  phone text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Organization memberships
create table if not exists ce_org_members (
  org_id uuid references ce_organizations(id) on delete cascade,
  user_id uuid references ce_users(id) on delete cascade,
  role text default 'member', -- owner, admin, member, viewer
  notification_prefs jsonb default '{"email": true, "push": true}',
  joined_at timestamptz default now(),
  primary key (org_id, user_id)
);

-- Integrations (photo sources + social destinations)
create table if not exists ce_integrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references ce_organizations(id) on delete cascade,
  type text not null, -- companycam, jobber, housecallpro, instagram, facebook, x, linkedin, nextdoor, gmb
  category text not null, -- source, destination
  name text, -- display name
  credentials jsonb, -- encrypted tokens/keys
  config jsonb default '{}', -- platform-specific settings
  status text default 'active', -- active, paused, error, disconnected
  last_sync_at timestamptz,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Content sources (raw inputs from integrations)
create table if not exists ce_content_sources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references ce_organizations(id) on delete cascade,
  integration_id uuid references ce_integrations(id) on delete set null,
  source_type text not null, -- photo, video, voice, review, event
  external_id text, -- ID in source system
  external_url text, -- URL to original
  local_url text, -- our cached copy
  metadata jsonb default '{}', -- project name, customer, location, timestamp, etc.
  ai_analysis jsonb, -- vision results: scene, quality, services, social_worthy, etc.
  quality_score integer, -- 1-10
  is_processed boolean default false,
  processed_at timestamptz,
  created_at timestamptz default now()
);

-- Templates
create table if not exists ce_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid, -- null = system template available to all
  name text not null,
  description text,
  type text not null, -- before_after, review_thanks, tip, promo, milestone, hiring, seasonal, crew, transformation
  industry text, -- null = all industries
  platforms text[] not null,
  prompt_template text not null, -- AI prompt with {variables}
  caption_template text, -- Static caption template with {variables}
  variables jsonb default '[]', -- [{name, type, required, default}]
  example_output text,
  settings jsonb default '{}', -- min_photos, max_photos, requires_approval, etc.
  is_active boolean default true,
  usage_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Posts
create table if not exists ce_posts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references ce_organizations(id) on delete cascade,
  template_id uuid references ce_templates(id) on delete set null,
  content text not null,
  platforms text[] not null,
  photo_urls text[],
  video_urls text[],
  source_ids uuid[], -- ce_content_sources used
  hashtags text[],
  status text default 'draft', -- draft, pending_review, approved, scheduled, posting, posted, failed
  scheduled_at timestamptz,
  posted_at timestamptz,
  posted_ids jsonb default '{}', -- {platform: external_post_id}
  posted_urls jsonb default '{}', -- {platform: post_url}
  performance jsonb default '{}', -- {platform: {likes, comments, shares, reach}}
  auto_approved boolean default false,
  approved_by uuid references ce_users(id),
  approved_at timestamptz,
  rejection_reason text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-posting rules
create table if not exists ce_auto_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references ce_organizations(id) on delete cascade,
  name text not null,
  description text,
  trigger_type text not null, -- new_photo, quality_score, template_match, time_based, event
  conditions jsonb not null, -- {quality_gte: 7, template_type: "before_after", etc.}
  action text not null, -- auto_approve, auto_schedule, notify, skip
  action_config jsonb default '{}', -- {schedule_delay_hours: 1, notify_users: [...]}
  is_active boolean default true,
  trigger_count integer default 0,
  last_triggered_at timestamptz,
  created_at timestamptz default now()
);

-- Activity log
create table if not exists ce_activity_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references ce_organizations(id) on delete cascade,
  user_id uuid references ce_users(id) on delete set null,
  action text not null, -- post_created, post_approved, post_published, integration_connected, etc.
  entity_type text, -- post, integration, template, etc.
  entity_id uuid,
  details jsonb default '{}',
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_ce_posts_org_status on ce_posts(org_id, status);
create index if not exists idx_ce_posts_scheduled on ce_posts(scheduled_at) where status = 'scheduled';
create index if not exists idx_ce_content_sources_org on ce_content_sources(org_id, is_processed);
create index if not exists idx_ce_integrations_org on ce_integrations(org_id, category);
create index if not exists idx_ce_templates_org on ce_templates(org_id) where is_active = true;

-- Insert system templates
insert into ce_templates (id, org_id, name, description, type, industry, platforms, prompt_template, caption_template, settings) values
  -- Before/After (all industries)
  (gen_random_uuid(), null, 'Before/After Transformation', 'Classic side-by-side or swipe transformation', 'before_after', null, 
   array['instagram', 'facebook', 'nextdoor'], 
   'Generate a short, punchy caption for a before/after transformation photo. Industry: {industry}. Time taken: {hours} hours. No emojis. Professional but approachable.',
   '{hours} hours. Same property.',
   '{"min_photos": 2, "max_photos": 2, "auto_approve_eligible": true}'::jsonb),
  
  -- Review Thank You
  (gen_random_uuid(), null, 'Review Thank You', 'Thank a customer for leaving a review', 'review_thanks', null,
   array['facebook', 'nextdoor', 'gmb'],
   'Generate a brief thank you message for a customer who left a {stars}-star review. Their name is {customer_name}. Keep it genuine, not corporate. No emojis.',
   'Thank you {customer_name} for the kind words. We appreciate you trusting us with your property.',
   '{"min_photos": 0, "max_photos": 1}'::jsonb),
  
  -- Lawn Care Seasonal
  (gen_random_uuid(), null, 'Spring Booking Push', 'Seasonal booking reminder for spring services', 'seasonal', 'lawn_care',
   array['facebook', 'instagram', 'nextdoor'],
   'Generate a post reminding customers to book spring lawn services. Mention: first mow, spring cleanup, mulching. Include a soft call to action. No emojis.',
   'Spring booking is open. First mow, cleanup, mulch - get on the schedule before the rush. {phone}',
   '{"min_photos": 0, "max_photos": 1}'::jsonb),

  -- Hiring
  (gen_random_uuid(), null, 'Now Hiring', 'Recruitment post for crew members', 'hiring', null,
   array['instagram', 'facebook'],
   'Generate a hiring post for a {industry} company looking for crew members. Mention: no experience needed, will train, flexible hours, outdoor work. Include pay range if provided: {pay_range}. No emojis.',
   'We are hiring. {pay_range}. No experience needed - we train. DM or call {phone}.',
   '{"min_photos": 0, "max_photos": 1}'::jsonb),

  -- Crew Spotlight
  (gen_random_uuid(), null, 'Crew Spotlight', 'Feature a team member or the whole crew', 'crew', null,
   array['instagram', 'facebook'],
   'Generate a short caption spotlighting the crew in this photo. Emphasize hard work, reliability, being the real heroes of the business. No emojis. No specific names unless provided.',
   'The crew that makes it happen. Showing up early, working hard, making properties look right.',
   '{"min_photos": 1, "max_photos": 3}'::jsonb),

  -- Milestone
  (gen_random_uuid(), null, 'Milestone Celebration', 'Celebrate reviews, years in business, customers served', 'milestone', null,
   array['instagram', 'facebook', 'linkedin', 'nextdoor'],
   'Generate a milestone celebration post. Milestone: {milestone_type} - {milestone_value}. Be grateful, not boastful. Thank customers. No emojis.',
   '{milestone_value} {milestone_type}. Thank you for trusting us. We are just getting started.',
   '{"min_photos": 0, "max_photos": 1}'::jsonb),

  -- Tip/Educational  
  (gen_random_uuid(), null, 'Quick Tip', 'Educational tip related to the industry', 'tip', null,
   array['instagram', 'facebook', 'nextdoor'],
   'Generate a helpful tip for homeowners about {topic}. Industry: {industry}. Keep it actionable and brief. Position as helpful neighbor, not salesy. No emojis.',
   null,
   '{"min_photos": 0, "max_photos": 1}'::jsonb),

  -- Pressure Washing specific
  (gen_random_uuid(), null, 'Pressure Wash Reveal', 'Satisfying cleaning transformation', 'transformation', 'pressure_washing',
   array['instagram', 'facebook', 'nextdoor'],
   'Generate a caption for a pressure washing before/after. Surface cleaned: {surface}. Emphasize the satisfying transformation. No emojis.',
   'Same {surface}. Just cleaned.',
   '{"min_photos": 2, "max_photos": 2, "auto_approve_eligible": true}'::jsonb)

on conflict do nothing;

-- Create College Bros organization as first tenant
insert into ce_organizations (id, name, slug, industry, brand_voice, contact_phone, contact_email, website, plan) values
  ('11111111-1111-1111-1111-111111111111', 'Example Business', 'example-biz', 'lawn_care', 'friendly', '(555) 000-0000', 'hello@example.com', 'example.com', 'pro')
on conflict (slug) do nothing;

-- Add CompanyCam integration for College Bros
insert into ce_integrations (org_id, type, category, name, credentials, status) values
  ('11111111-1111-1111-1111-111111111111', 'companycam', 'source', 'CompanyCam', 
   '{"token": "YOUR_COMPANYCAM_TOKEN"}'::jsonb, 'active')
on conflict do nothing;
