import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const SEED_POSTS = [
  // ── Instagram/Facebook Week 1 (@collegebros31) ──────────────────
  {
    content: `Spring is coming and your yard knows it.

We're booking lawn care, landscaping, mulch, and pressure washing for the season. 27-person crew, fully insured, and we actually show up when we say we will (revolutionary concept, I know).

If your yard needs some love after winter, give us a shout.

Call or text: (318) 600-9123
collegebrosllc.com

#MonroeLA #WestMonroe #LawnCare #SpringCleanup #CollegeBros`,
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

(318) 600-9123

#Landscaping #MonroeLA #BeforeAndAfter #LawnTransformation`,
    platforms: ['instagram'],
    status: 'draft',
    scheduled_at: '2026-02-11T10:00:00-06:00',
    tags: ['reel', 'before-after'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },
  {
    content: `Quick tip if you do your own lawn: February in Louisiana is when you need to put down pre-emergent.

It's basically a shield against crabgrass and clover. Skip it now and you'll be fighting weeds all summer wondering what went wrong.

We include it on every property we service, but if you're DIY — grab some Barricade or Dimension from your local hardware store and put it down this weekend. Your lawn will thank you in April.

Happy to answer questions if you're not sure what to use.

#LawnCare #Louisiana #SpringPrep #MonroeLA #LawnTips`,
    platforms: ['instagram', 'facebook'],
    status: 'approved',
    scheduled_at: '2026-02-12T12:00:00-06:00',
    tags: ['tips', 'lawn-care'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },
  {
    content: `I will never get tired of a clean edge.

If you need this kind of energy in your yard — (318) 600-9123

#Satisfying #PressureWashing #Landscaping #MonroeLA`,
    platforms: ['instagram'],
    status: 'draft',
    scheduled_at: '2026-02-13T10:00:00-06:00',
    tags: ['reel', 'satisfying'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },
  {
    content: `Shoutout to the crew that makes this whole thing work.

These guys show up early, work hard, and make every yard look incredible. College Bros wouldn't exist without them.

We're also hiring for spring if you want to join the team — DM us or text (318) 600-9123.

#CollegeBros #MonroeLA #HiringNow #TeamWork #LawnCare`,
    platforms: ['instagram', 'facebook'],
    status: 'approved',
    scheduled_at: '2026-02-14T11:00:00-06:00',
    tags: ['team', 'hiring'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },

  // ── Twitter/X Week 1 (@pauley_connor) ──────────────────
  {
    content: `I'm 21, I run a landscaping company with 27 employees, and I just built an AI-powered CRM from scratch. Here's how that happened: (1/10)

(2/10) May 2024: bought a mower to make gas money at ULM. Posted on Nextdoor. Got my first customer. Thought "ok cool, beer money." Had no idea what was coming.

(3/10) Turns out if you show up on time and do good work, people tell their neighbors. Within 6 months we had 10 employees. I was scheduling crews between classes and learning management by trial and a LOT of error.

(4/10) Today: 27 employees. 5-person crews. Lawn care, landscaping, pressure washing, Christmas lights. 47 Google reviews at 4.9 stars. Still a full-time student at ULM. Still occasionally late to class.

(5/10) The problem: every CRM in the home service industry is either $500/month (ServiceTitan, looking at you) or it's a spreadsheet someone's uncle made. Neither worked for us.

(6/10) So I built my own. Apex Pro — 144,000 lines of code. Scheduling, invoicing, customer pipeline, AI estimates, crew management, route optimization. Used Claude (Anthropic's AI) to help build it.

(7/10) The AI was incredible for writing code fast. But it doesn't know what happens at 6 AM when a mower breaks and three customers are calling. That part came from actually being in the field.

(8/10) Every feature exists because something went wrong first. Double-booked a crew → auto-scheduling. Lost a mower for two weeks → equipment tracker. Writing proposals at midnight → AI estimates from photos.

(9/10) The long-term plan: make College Bros franchise-ready with Apex Pro as the operating system. Give someone the software, the playbook, and the brand — and they can run a location anywhere.

(10/10) Going to build all of this in public. Real numbers, real code, real mistakes. If you're building something too, let's connect. Always happy to learn from people further along than me.

apex-pro-mu.vercel.app`,
    platforms: ['x'],
    status: 'approved',
    scheduled_at: '2026-02-10T08:00:00-06:00',
    tags: ['thread', 'intro'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },
  {
    content: `The secret to winning customers in the service industry: answer the phone.

That's it. That's the whole strategy. 80% of our competitors send calls to voicemail. We pick up. We get the job.

Would love to hear — what's the simplest thing you do that your competitors don't?`,
    platforms: ['x'],
    status: 'approved',
    scheduled_at: '2026-02-10T12:00:00-06:00',
    tags: ['tips'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },
  {
    content: `Built my own CRM because every option was either too expensive or too basic.

Honestly the hardest part wasn't the coding. It was admitting I'd spent two years dealing with bad software when I could have just... built what I needed.

Anyone else have that moment where you realize you should've started building sooner?`,
    platforms: ['x'],
    status: 'approved',
    scheduled_at: '2026-02-11T12:00:00-06:00',
    tags: ['apex-pro', 'build-in-public'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },
  {
    content: `Things I did before 10 AM today:
- Dispatched 3 crews
- Sent 4 estimates
- Attended an accounting lecture
- Fixed a bug in Apex Pro
- Ate a questionable gas station burrito

College CEO life is very glamorous.`,
    platforms: ['x'],
    status: 'approved',
    scheduled_at: '2026-02-12T10:00:00-06:00',
    tags: ['day-in-life'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },
  {
    content: `Something I wish someone told me before starting a service business:

Your best employees will come from referrals from your best employees. Every single time. Posting job ads gets you applicants. Asking your A players gets you A players.

What's the best hiring advice you've gotten?`,
    platforms: ['x'],
    status: 'approved',
    scheduled_at: '2026-02-13T12:00:00-06:00',
    tags: ['hiring', 'advice'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },
  {
    content: `Week 1 on Twitter. Don't know what I'm doing here yet but I'm figuring it out.

If you're building something — a business, software, anything — drop what it is below. Want to find good people to follow.`,
    platforms: ['x'],
    status: 'approved',
    scheduled_at: '2026-02-14T15:00:00-06:00',
    tags: ['community'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },

  // ── LinkedIn Week 1 ──────────────────
  {
    content: `I started a landscaping company in college because I needed gas money. Bought a mower, posted on Nextdoor, and hoped somebody called.

Three years later, College Bros Outdoor Services has 27 employees running crews across Monroe, Louisiana. I genuinely have no idea how that happened.

Along the way I learned that every CRM in our industry was either $500/month or a spreadsheet someone's uncle made in 2012. So I built my own — an AI-powered tool called Apex Pro.

I'm 21, still in school at ULM, and most days I'm dispatching crews between classes while pretending to pay attention in Accounting.

I'm going to start sharing what it's actually like to build a business in college. The wins, the embarrassing mistakes, and everything in between.

If you're in the service industry or just like watching someone figure it out in real time — stick around. It should be entertaining at minimum.`,
    platforms: ['linkedin'],
    status: 'approved',
    scheduled_at: '2026-02-10T07:30:00-06:00',
    tags: ['intro', 'story'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },
  {
    content: `Since I'm new here, figured I'd share some real numbers from running a landscaping company as a college student:

Employees: 27 (mostly ULM students who are way more reliable than I was at their age)
Crew structure: 5-person teams, 1 lead + 4 ops
Services: lawn care, landscaping, pressure washing, Christmas lights
Founded: May 2024
Google reviews: 47 at 4.9 stars
CRM: got frustrated with every option, accidentally built my own

Biggest lesson so far: your crew IS the business. I can sell and market all day, but if the team doesn't show up and do great work, none of it matters.

What would you want to hear more about? Happy to share whatever's helpful.`,
    platforms: ['linkedin'],
    status: 'approved',
    scheduled_at: '2026-02-12T12:00:00-06:00',
    tags: ['transparency', 'numbers'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },
  {
    content: `I accidentally built a 144,000-line CRM application.

I say "accidentally" because it started as "I just want a better way to schedule my lawn crews" and turned into a full operating system with invoicing, customer pipeline, AI features, route optimization, and crew management.

The tool that made it possible: Claude (Anthropic's AI assistant). But here's the thing — AI is incredible at writing code fast, but it has no idea what a landscaper actually needs at 6 AM when a mower breaks and three customers are calling.

That part came from three years of being in the field, making every mistake you can make, and knowing exactly what I wished I had on my phone.

It's called Apex Pro. Still early, still rough around the edges, but it's running my actual business right now.

Going to share the build process here — the architecture decisions, the features, and definitely the bugs. Should be fun.

apex-pro-mu.vercel.app if you're curious.`,
    platforms: ['linkedin'],
    status: 'approved',
    scheduled_at: '2026-02-14T08:00:00-06:00',
    tags: ['apex-pro', 'build-in-public'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },

  // ── Facebook Week of Feb 10 ──────────────────
  {
    content: `Spring is closer than you think and we're already filling up the schedule. Every year it's the same thing — everyone waits until March, then it's a scramble to get on the books. Don't be that person this year. We're locking in spring cleanups, regular mowing schedules, and bed maintenance right now. If you want your yard looking right from day one, hit us up before the calendar fills. Call or text to grab a spot. First cut is on us for new recurring customers.`,
    platforms: ['facebook'],
    status: 'approved',
    scheduled_at: '2026-02-10T11:30:00-06:00',
    tags: ['spring', 'booking'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },
  {
    content: `Quick tip for anyone with a lawn in the Monroe area. Mid-February is your window to put down pre-emergent if you want to stay ahead of crabgrass and other warm-season weeds. Soil temps are starting to climb and once they hit 55 degrees consistently, weed seeds are already germinating. By the time you see them, it's too late. If you're not sure what product to use or how to time it, shoot us a message. We handle this for customers every year and we're happy to point you in the right direction even if you're a DIY person.`,
    platforms: ['facebook'],
    status: 'approved',
    scheduled_at: '2026-02-11T18:00:00-06:00',
    tags: ['tips', 'lawn-care'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },
  {
    content: `This is what a few hours of work looks like. Overgrown beds, patchy turf, and a yard that just looked tired. We came in, edged everything out, cleared the beds, laid fresh mulch, and gave it a proper cut. Night and day difference. If your property looks like the left photo right now, that's fine — that's literally what we do. Spring is the best time to reset your yard. Let's make it happen.`,
    platforms: ['facebook'],
    status: 'draft',
    scheduled_at: '2026-02-12T12:00:00-06:00',
    tags: ['before-after'],
    notes: 'Need before/after photos from Connor',
    photo_urls: [],
    posted_ids: {},
  },
  {
    content: `We're not a franchise. We're not some big national chain. We're a crew of guys going to school at ULM who decided to build something real instead of waiting around for someone to hand us a job. College Bros started because we saw yards in Monroe that deserved better and we knew we could deliver. We show up on time, we communicate like normal people, and we actually care what your property looks like when we leave. That's it. No gimmicks. Just solid work from guys who are building their future one yard at a time. Appreciate every single customer who's trusted us so far.`,
    platforms: ['facebook'],
    status: 'draft',
    scheduled_at: '2026-02-13T17:30:00-06:00',
    tags: ['team'],
    notes: 'Need candid crew photo',
    photo_urls: [],
    posted_ids: {},
  },
  {
    content: `Real talk from a real customer:

"I've been using College Bros for months now and honestly I wish I'd found them sooner. They're always on time and my yard has never looked this good. If you're looking for a lawn crew that actually cares, these are your guys."

We don't run on ads. We run on word of mouth. If we've taken care of your yard, drop a review or tag someone who needs us. That's how we keep growing.`,
    platforms: ['facebook'],
    status: 'draft',
    scheduled_at: '2026-02-14T10:00:00-06:00',
    tags: ['testimonial'],
    notes: 'Need real customer quote',
    photo_urls: [],
    posted_ids: {},
  },

  // ── Google Business Week of Feb 10 ──────────────────
  {
    content: `Spring is right around the corner in Monroe and now is the time to get your property ready for the growing season. At College Bros Outdoor Services, we're currently booking spring cleanups for residential and commercial properties across the Monroe area.

Our spring cleanup service covers everything you need to start the season right. We handle leaf and debris removal, bed edging and reshaping, fresh mulch installation, shrub trimming and shaping, and a full first mow with clean edges. After a long winter, most yards need a reset before regular maintenance kicks in. Beds get overgrown, edges get soft, and leaves pile up in corners. A proper spring cleanup sets the foundation for a yard that looks good all season without playing catch-up.

We're a local crew based out of ULM and we've been serving the Monroe and West Monroe area for multiple seasons now. We show up when we say we will, we communicate clearly, and we take pride in how your property looks when we drive away.

Spots are filling up and we always book out faster than people expect once March hits. Get on the schedule now and skip the wait.

Call us at (318) 600-9123 or message us to book your spring cleanup today.`,
    platforms: ['gmb'],
    status: 'approved',
    scheduled_at: '2026-02-11T09:00:00-06:00',
    tags: ['spring', 'services'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },
  {
    content: `If you've been thinking about switching lawn care providers or hiring one for the first time, February is the best time to make that move. College Bros Outdoor Services is currently locking in weekly mowing schedules for the spring and summer season in Monroe, West Monroe, and surrounding areas.

Our weekly maintenance service includes mowing, edging, blowing, and line trimming on every visit. We keep your property looking sharp week after week without you having to think about it. We also offer add-on services like bed maintenance, hedge trimming, and seasonal fertilizer and weed control applications for customers who want the full package.

What makes us different is simple. We're local, we're consistent, and we actually communicate. You'll get a text when we're on the way. You'll get a follow-up if anything looks off. And if there's ever an issue, you can call or text us directly — you're not going through a call center or leaving a voicemail that never gets returned.

We started College Bros because we saw a gap in the market for reliable, professional lawn care that doesn't come with the headaches of dealing with bigger companies. Every property we service is a reflection of our reputation and we treat it that way.

Spring schedules fill up every year. Lock in your spot now and your yard will be dialed in from the first week of growing season.

Call (318) 600-9123 or send us a message to get on the schedule.`,
    platforms: ['gmb'],
    status: 'approved',
    scheduled_at: '2026-02-13T09:00:00-06:00',
    tags: ['maintenance', 'booking'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },

  // ── Nextdoor Week of Feb 10 ──────────────────
  {
    content: `Mid-February is the sweet spot to prep your lawn for spring in our area. Get your pre-emergent down now and you'll thank yourself in April. If you need a hand, we do lawn treatments across Monroe.`,
    platforms: ['nextdoor'],
    status: 'approved',
    scheduled_at: '2026-02-10T09:00:00-06:00',
    tags: ['tips', 'spring'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },
  {
    content: `Seeing winter weeds popping up in your yard? Pull them before they seed or they'll double next year. A clean edge along beds helps too — keeps everything from creeping in. Happy to answer questions if anyone needs help.`,
    platforms: ['nextdoor'],
    status: 'approved',
    scheduled_at: '2026-02-12T09:00:00-06:00',
    tags: ['tips', 'weeds'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },
  {
    content: `We're booking spring cleanups now if anyone in the neighborhood needs their yard reset before the growing season kicks in. College Bros Outdoor Services — local ULM guys. Call or message us anytime.`,
    platforms: ['nextdoor'],
    status: 'approved',
    scheduled_at: '2026-02-14T09:00:00-06:00',
    tags: ['booking', 'spring'],
    notes: null,
    photo_urls: [],
    posted_ids: {},
  },
]

export async function POST() {
  try {
    // Check if data already exists
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
