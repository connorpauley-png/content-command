import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Example seed data for a lawn care / home service business
// Replace with your own content
const SEED_POSTS = [
  // ── Instagram/Facebook Examples ──────────────────
  {
    content: `Spring is coming and your yard knows it.

We're booking lawn care, landscaping, mulch, and pressure washing for the season. Fully insured crew that actually shows up when we say we will.

If your yard needs some love after winter, give us a shout.

#LawnCare #SpringCleanup #Landscaping`,
    platforms: ['instagram', 'facebook'],
    status: 'approved',
    scheduled_at: '2026-02-10T11:00:00-06:00',
    tags: ['spring', 'lawn-care'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },
  {
    content: `Tuesday morning transformation. Started at 6 AM, finished by 10.

Not a bad way to start the week.

#Landscaping #BeforeAndAfter #LawnTransformation`,
    platforms: ['instagram'],
    status: 'draft',
    scheduled_at: '2026-02-11T10:00:00-06:00',
    tags: ['reel', 'before-after'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },
  {
    content: `Quick tip: February is when you need to put down pre-emergent.

It's basically a shield against crabgrass and clover. Skip it now and you'll be fighting weeds all summer.

We include it on every property we service, but if you're DIY — grab some Barricade or Dimension from your local hardware store and put it down this weekend.

#LawnCare #SpringPrep #LawnTips`,
    platforms: ['instagram', 'facebook'],
    status: 'approved',
    scheduled_at: '2026-02-12T12:00:00-06:00',
    tags: ['tips', 'lawn-care'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },
  {
    content: `Shoutout to the crew that makes this whole thing work.

These guys show up early, work hard, and make every yard look incredible.

We're also hiring for spring if you want to join the team — DM us.

#TeamWork #LawnCare #HiringNow`,
    platforms: ['instagram', 'facebook'],
    status: 'approved',
    scheduled_at: '2026-02-14T11:00:00-06:00',
    tags: ['team', 'hiring'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },

  // ── Twitter/X Examples ──────────────────
  {
    content: `The secret to winning customers in the service industry: answer the phone.

That's it. That's the whole strategy. 80% of our competitors send calls to voicemail. We pick up. We get the job.`,
    platforms: ['x'],
    status: 'approved',
    scheduled_at: '2026-02-10T12:00:00-06:00',
    tags: ['tips'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },
  {
    content: `Something I wish someone told me before starting a service business:

Your best employees will come from referrals from your best employees. Every single time.`,
    platforms: ['x'],
    status: 'approved',
    scheduled_at: '2026-02-13T12:00:00-06:00',
    tags: ['hiring', 'advice'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },

  // ── LinkedIn Example ──────────────────
  {
    content: `I started a service business because I needed extra money. Had no idea what I was getting into.

Along the way I learned that every CRM in our industry was either too expensive or too basic. So I started building tools to solve my own problems.

If you're in the service industry, I'd love to connect and hear what tools you use.`,
    platforms: ['linkedin'],
    status: 'approved',
    scheduled_at: '2026-02-10T07:30:00-06:00',
    tags: ['intro', 'story'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },

  // ── Facebook Examples ──────────────────
  {
    content: `Spring is closer than you think and we're already filling up the schedule. We're locking in spring cleanups, regular mowing schedules, and bed maintenance right now. If you want your yard looking right from day one, hit us up before the calendar fills.`,
    platforms: ['facebook'],
    status: 'approved',
    scheduled_at: '2026-02-10T11:30:00-06:00',
    tags: ['spring', 'booking'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },

  // ── Nextdoor Example ──────────────────
  {
    content: `Mid-February is the sweet spot to prep your lawn for spring in our area. Get your pre-emergent down now and you'll thank yourself in April. Happy to answer questions if anyone needs help.`,
    platforms: ['nextdoor'],
    status: 'approved',
    scheduled_at: '2026-02-10T09:00:00-06:00',
    tags: ['tips', 'spring'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },
]

export async function POST() {
  try {
    const { count, error: countError } = await supabaseAdmin
      .from('cc_posts')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    if (count && count > 0) {
      return NextResponse.json(
        { message: `Database already has ${count} posts. Skipping seed.`, count },
        { status: 200 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('cc_posts')
      .insert(SEED_POSTS)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { message: `Successfully seeded ${data.length} posts`, count: data.length },
      { status: 201 }
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to seed the database',
    postCount: SEED_POSTS.length,
  })
}
