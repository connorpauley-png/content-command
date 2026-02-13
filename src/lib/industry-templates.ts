import type { ContentType, ContentPillar, CalendarSlot, IndustryTemplate } from '@/types'

export interface FullIndustryTemplate extends IndustryTemplate {
  platformRecommendations: string[]
  samplePostsByPillar: Record<string, string[]>  // pillarId → 5 sample posts
}

function pillar(id: string, name: string, description: string, examples: string[]): ContentPillar {
  return { id, name, description, examples }
}

function weekSlots(pillars: string[], types: ContentType[]): CalendarSlot[] {
  // Mon-Fri posting, rotating pillars and types
  return [1, 2, 3, 4, 5].map((day, i) => ({
    dayOfWeek: day,
    accountId: '__default__',
    contentType: types[i % types.length],
    pillar: pillars[i % pillars.length],
    time: day <= 3 ? '09:00' : '17:00',
  }))
}

export const INDUSTRY_TEMPLATES: Record<string, FullIndustryTemplate> = {
  lawn_care: {
    id: 'lawn_care',
    industry: 'Lawn Care / Landscaping',
    pillars: [
      pillar('before_after', 'Before/After', 'Showcase transformations', ['Overgrown yard → pristine lawn', 'Leaf cleanup transformation']),
      pillar('seasonal_tips', 'Seasonal Tips', 'Educate homeowners on lawn care', ['Spring fertilizer schedule', 'Winter prep checklist']),
      pillar('crew_culture', 'Crew Culture', 'Show the team and personality', ['Meet the crew Monday', 'Day in the life']),
      pillar('customer_stories', 'Customer Stories', 'Social proof from happy clients', ['5-star review spotlight', 'Long-term client feature']),
    ],
    contentTypes: ['before_after', 'checklist', 'testimonial', 'flyer', 'crew_spotlight'],
    voiceSuggestions: ['friendly', 'casual', 'educational'],
    weeklySchedule: weekSlots(['before_after', 'seasonal_tips', 'crew_culture', 'customer_stories', 'seasonal_tips'], ['before_after', 'checklist', 'crew_spotlight', 'testimonial', 'flyer']),
    samplePosts: [
      { contentType: 'before_after', content: 'Another yard saved! Swipe to see the transformation 🌱➡️🏡' },
      { contentType: 'checklist', content: '5 things your lawn needs before summer hits ☀️' },
      { contentType: 'testimonial', content: '"Best lawn service in town!" — Happy homeowner' },
    ],
    samplePostsByPillar: {
      before_after: [
        'This yard was buried under 6 inches of leaves. Swipe to see it now! 🍂➡️✨',
        'From jungle to jewel — another transformation in the books 💪',
        'The neighbors definitely noticed this one. Before & after 👀',
        'When the homeowner saw their backyard they couldn\'t believe it was the same house',
        'Weekly mowing makes ALL the difference. Here\'s proof 📸',
      ],
      seasonal_tips: [
        '🌱 Spring is HERE. 5 things your lawn needs right now (save this!)',
        'Stop making this fall cleanup mistake — it\'s killing your grass 🛑',
        'Your summer watering schedule is probably wrong. Here\'s the fix 💧',
        'Aeration season is coming. Here\'s why your lawn is begging for it',
        'The #1 thing homeowners forget before winter (and regret in spring)',
      ],
      crew_culture: [
        'Meet the crew that keeps your neighborhood looking sharp 🤝',
        'Rain or shine, this crew shows up. That\'s the difference 💪',
        'POV: It\'s 6am and the mowers are already loaded 🌅',
        'When the whole crew is in sync > everything else',
        'Shoutout to our newest team member crushing it on week one 🙌',
      ],
      customer_stories: [
        '⭐⭐⭐⭐⭐ "They transformed our yard and now we actually USE our backyard"',
        'Mrs. Johnson has been with us 3 years. Here\'s why she stays 🏡',
        'Another 5-star review just dropped. We don\'t take that for granted 🙏',
        '"I wish I found you guys sooner" — we hear this a LOT',
        'This client went from embarrassed about their yard to hosting BBQs every weekend',
      ],
    },
    platformRecommendations: ['instagram', 'facebook', 'google_business', 'nextdoor'],
  },

  pressure_washing: {
    id: 'pressure_washing',
    industry: 'Pressure Washing',
    pillars: [
      pillar('transformations', 'Transformations', 'Satisfying cleaning results', ['Driveway grime removal', 'Deck restoration']),
      pillar('tips', 'Tips', 'Maintenance advice for property owners', ['How often to pressure wash', 'DIY vs pro']),
      pillar('equipment', 'Equipment', 'Show off your gear and expertise', ['Equipment tour', 'New machine unboxing']),
      pillar('reviews', 'Reviews', 'Customer testimonials and ratings', ['Google review spotlight', 'Video testimonial']),
    ],
    contentTypes: ['before_after', 'testimonial', 'stat_card', 'flyer'],
    voiceSuggestions: ['casual', 'bold', 'friendly'],
    weeklySchedule: weekSlots(['transformations', 'tips', 'equipment', 'reviews', 'transformations'], ['before_after', 'checklist', 'stat_card', 'testimonial', 'flyer']),
    samplePosts: [
      { contentType: 'before_after', content: 'This driveway hadn\'t been cleaned in 10 years. Swipe ➡️' },
      { contentType: 'stat_card', content: '2,500+ driveways cleaned and counting 💪' },
      { contentType: 'testimonial', content: '"My house looks brand new!" — Satisfied customer' },
    ],
    samplePostsByPillar: {
      transformations: [
        'This driveway was BLACK. Now look at it 🤯 Swipe ➡️',
        '10 years of grime, gone in 30 minutes. That\'s what we do.',
        'The most satisfying pressure wash of the week 💦',
        'Curb appeal: RESTORED. Another happy homeowner 🏠',
        'POV: Your deck hasn\'t been cleaned since 2018... until today',
      ],
      tips: [
        'How often should you pressure wash your driveway? (Most people wait too long)',
        'DIY pressure washing vs. hiring a pro — honest breakdown 🧵',
        '3 surfaces you should NEVER pressure wash yourself ⚠️',
        'The best time of year to pressure wash your house (it\'s not when you think)',
        'Soft wash vs pressure wash — what\'s the difference and when to use each',
      ],
      equipment: [
        'Just upgraded to 4000 PSI. Your grime doesn\'t stand a chance 💪',
        'A day in the life of a pressure washer (it\'s more than just spraying water)',
        'Our surface cleaner does in 10 minutes what a wand takes an hour to do',
        'Gear check: everything loaded and ready for a full day of transformations 🚛',
        'This nozzle tip is a game changer. Here\'s why 👇',
      ],
      reviews: [
        '⭐⭐⭐⭐⭐ "I didn\'t know my sidewalk was supposed to be THAT white"',
        'Another Google 5-star. 150+ and counting 🙏',
        '"Showed up on time, incredible results, fair price." That\'s the standard.',
        'This review made our whole week. We love what we do ❤️',
        '"My wife thought I replaced the driveway" 😂 Nope, just a good cleaning.',
      ],
    },
    platformRecommendations: ['instagram', 'facebook', 'tiktok', 'google_business'],
  },

  plumbing: {
    id: 'plumbing',
    industry: 'Plumbing',
    pillars: [
      pillar('tips_prevention', 'Tips & Prevention', 'Help homeowners avoid costly issues', ['How to prevent frozen pipes', 'Signs of a slab leak']),
      pillar('emergency', 'Emergency Response', 'Show urgency and reliability', ['24/7 availability', 'Fastest response story']),
      pillar('behind_scenes', 'Behind the Scenes', 'Day-in-the-life content', ['What\'s in our truck', 'Diagnosing a tricky problem']),
      pillar('reviews', 'Reviews', 'Build trust with social proof', ['Google review spotlight', 'Repeat customer stories']),
    ],
    contentTypes: ['checklist', 'hot_take', 'testimonial', 'flyer'],
    voiceSuggestions: ['professional', 'educational', 'friendly'],
    weeklySchedule: weekSlots(['tips_prevention', 'emergency', 'behind_scenes', 'reviews', 'tips_prevention'], ['checklist', 'hot_take', 'testimonial', 'flyer', 'checklist']),
    samplePosts: [
      { contentType: 'checklist', content: '5 signs you have a hidden water leak 💧🔍' },
      { contentType: 'hot_take', content: 'Hot take: Chemical drain cleaners are destroying your pipes' },
      { contentType: 'testimonial', content: '"They came at 11pm on a Sunday. Lifesavers!" ⭐⭐⭐⭐⭐' },
    ],
    samplePostsByPillar: {
      tips_prevention: [
        '5 signs you have a hidden leak (and what to do about each one) 💧',
        'Your water heater is trying to tell you something. Here are the warning signs ⚠️',
        'Winter is coming — here\'s how to prevent frozen pipes in 4 easy steps',
        'That "minor drip" is costing you $200/year. Fix it now, thank us later.',
        'The #1 thing clogging your drains (and it\'s not what you think) 🚿',
      ],
      emergency: [
        'Burst pipe at 2am? We\'ve got you. 24/7, 365 days. Call us. 📞',
        'Just wrapped up an emergency call — family is back to normal ✅',
        'Our average response time this month: 37 minutes. That\'s the standard.',
        'When water is pouring through your ceiling, you need someone NOW. That\'s us.',
        'Emergency plumbing isn\'t just a service — it\'s a promise. We show up.',
      ],
      behind_scenes: [
        'What\'s actually in a plumber\'s truck? Full tour 🚛👇',
        'This diagnosis took 2 hours but saved the homeowner $5,000 in damage',
        'POV: Camera-ing a sewer line and finding the root cause (literally, tree roots 🌳)',
        'A typical Tuesday: 4 calls, 2 emergencies, 0 complaints. Let\'s go.',
        'The most satisfying drain clearing of the month 🎬',
      ],
      reviews: [
        '⭐⭐⭐⭐⭐ "Honest, fast, and didn\'t try to upsell me"',
        'This family has called us 5 times in 3 years. Loyalty like that means everything 🙏',
        '"Fixed in 20 minutes what another plumber said would take all day"',
        'Another 5-star Google review. We don\'t just fix pipes — we earn trust.',
        '"I\'ll never call anyone else." — That\'s the goal with every single job.',
      ],
    },
    platformRecommendations: ['facebook', 'google_business', 'nextdoor', 'instagram'],
  },

  hvac: {
    id: 'hvac',
    industry: 'HVAC',
    pillars: [
      pillar('seasonal_prep', 'Seasonal Prep', 'Prepare for temperature changes', ['AC tune-up checklist', 'Furnace prep guide']),
      pillar('energy_savings', 'Energy Savings', 'Help customers save money', ['Thermostat settings', 'Insulation tips']),
      pillar('maintenance', 'Maintenance Tips', 'Extend equipment life', ['Filter change reminders', 'Ductwork inspection']),
      pillar('reviews', 'Reviews', 'Customer success stories', ['Comfort restored stories', 'Energy bill savings']),
    ],
    contentTypes: ['checklist', 'stat_card', 'testimonial', 'flyer'],
    voiceSuggestions: ['professional', 'educational', 'friendly'],
    weeklySchedule: weekSlots(['seasonal_prep', 'energy_savings', 'maintenance', 'reviews', 'energy_savings'], ['checklist', 'stat_card', 'testimonial', 'flyer', 'checklist']),
    samplePosts: [
      { contentType: 'checklist', content: 'Is your AC ready for summer? Here\'s a 5-point checklist ☀️' },
      { contentType: 'stat_card', content: 'The average family wastes $300/yr on inefficient HVAC 💸' },
      { contentType: 'testimonial', content: '"Our energy bill dropped 40% after their tune-up!" ⭐' },
    ],
    samplePostsByPillar: {
      seasonal_prep: [
        'Summer is 30 days away. Is your AC ready? Here\'s a quick checklist ☀️',
        'Don\'t wait until your furnace dies on the coldest night — schedule now ❄️',
        'Spring HVAC tune-up = no surprises in July. Book yours today.',
        'The #1 AC failure we see every summer (and how to prevent it)',
        'Fall maintenance checklist: 5 things before you turn on the heat 🍂',
      ],
      energy_savings: [
        'This ONE thermostat setting is costing you $30/month extra 💸',
        'Stat: Homes with maintained HVAC save 20-30% on energy bills',
        'Programmable vs smart thermostat — which actually saves more money?',
        'Your ductwork could be leaking 30% of your conditioned air. Here\'s how to check.',
        'The cheapest HVAC upgrade that pays for itself in 6 months',
      ],
      maintenance: [
        'When\'s the last time you changed your filter? (If you have to think, it\'s overdue)',
        'This is what your evaporator coil looks like after 5 years with no maintenance 😬',
        'Filter change reminder! Set a phone alarm for every 60 days. Your lungs will thank you.',
        '3 weird noises your HVAC makes and what each one means ⚠️',
        'Annual maintenance vs. emergency repair — the cost difference will shock you',
      ],
      reviews: [
        '⭐⭐⭐⭐⭐ "Our house has never been more comfortable — and our bill went DOWN"',
        '"They found a problem our last company missed for 3 years." Trust matters.',
        'Another family sleeping comfortably tonight. That\'s why we do this. 🙏',
        '"Showed up early, explained everything, fair price." — That\'s just how we operate.',
        'This customer\'s energy bill before vs after our tune-up: $280 → $170 📉',
      ],
    },
    platformRecommendations: ['facebook', 'google_business', 'nextdoor', 'instagram'],
  },

  roofing: {
    id: 'roofing',
    industry: 'Roofing',
    pillars: [
      pillar('storm_damage', 'Storm Damage', 'Educate on storm response', ['Post-storm inspection tips', 'Insurance claim process']),
      pillar('before_after', 'Before/After', 'Showcase roof transformations', ['Full reroof timelapse', 'Repair before/after']),
      pillar('materials', 'Materials Education', 'Help customers choose right', ['Shingle types compared', 'Metal vs asphalt']),
      pillar('reviews', 'Reviews', 'Build trust and credibility', ['Homeowner testimonials', 'Warranty stories']),
    ],
    contentTypes: ['before_after', 'checklist', 'testimonial', 'flyer'],
    voiceSuggestions: ['professional', 'educational', 'bold'],
    weeklySchedule: weekSlots(['storm_damage', 'before_after', 'materials', 'reviews', 'before_after'], ['checklist', 'before_after', 'stat_card', 'testimonial', 'flyer']),
    samplePosts: [
      { contentType: 'before_after', content: 'New roof, new curb appeal! Check out this transformation 🏠' },
      { contentType: 'checklist', content: 'Storm just hit? Here\'s your 5-step roof damage checklist 🌧️' },
      { contentType: 'testimonial', content: '"They handled everything with insurance. Zero stress!" ⭐⭐⭐⭐⭐' },
    ],
    samplePostsByPillar: {
      storm_damage: [
        'Storm just passed? Here are 5 things to check on your roof RIGHT NOW ⛈️',
        'How to file a roof insurance claim (step-by-step guide — save this!)',
        'That "minor" hail damage could void your warranty. Get it inspected free.',
        'We inspected 30 roofs after last week\'s storm. 22 had damage the homeowner couldn\'t see.',
        'Don\'t wait for a leak to tell you there\'s damage. Be proactive. Free inspections 📞',
      ],
      before_after: [
        'From leaking and worn to brand new and protected. Another roof transformation 🏠',
        'This 30-year-old roof was on borrowed time. Now it\'s got 50 years ahead of it.',
        'Drone shot before vs after. The difference is incredible 📸',
        'Curb appeal level: MAXED. This new roof changed the whole look of the house.',
        'When the homeowner pulled up and saw the finished roof — priceless reaction 😄',
      ],
      materials: [
        'Metal vs asphalt shingles — honest pros and cons from a roofer\'s perspective',
        'Architectural shingles vs 3-tab: Why the upgrade is worth every penny',
        'The shingle color that increases home value the most (backed by data) 📊',
        'How long does each roofing material ACTUALLY last? Real-world numbers.',
        'Impact-resistant shingles: Do they really prevent hail damage? Our honest take.',
      ],
      reviews: [
        '⭐⭐⭐⭐⭐ "From inspection to completion in 3 days. Incredible."',
        '"They handled the insurance company for us. Couldn\'t have been easier."',
        'Another referral from a happy customer. Word of mouth > everything 🙏',
        '"Third roofer we called. Only one who was honest about what we actually needed."',
        'This family\'s roof survived the last 2 storms with zero damage. Quality matters.',
      ],
    },
    platformRecommendations: ['facebook', 'google_business', 'instagram', 'nextdoor'],
  },

  cleaning: {
    id: 'cleaning',
    industry: 'Cleaning Services',
    pillars: [
      pillar('transformations', 'Transformations', 'Show dramatic cleaning results', ['Deep clean reveals', 'Move-out cleaning']),
      pillar('tips', 'Tips', 'Quick cleaning hacks', ['Stain removal tricks', 'Speed cleaning methods']),
      pillar('checklists', 'Checklists', 'Shareable cleaning guides', ['Spring cleaning list', 'Move-in checklist']),
      pillar('reviews', 'Reviews', 'Happy client testimonials', ['Recurring client stories', 'First-time reactions']),
    ],
    contentTypes: ['before_after', 'checklist', 'testimonial', 'stat_card'],
    voiceSuggestions: ['friendly', 'casual', 'educational'],
    weeklySchedule: weekSlots(['transformations', 'tips', 'checklists', 'reviews', 'tips'], ['before_after', 'checklist', 'testimonial', 'stat_card', 'checklist']),
    samplePosts: [
      { contentType: 'before_after', content: 'This kitchen hadn\'t been deep cleaned in a year. Swipe ➡️ ✨' },
      { contentType: 'checklist', content: 'The ultimate spring cleaning checklist (save this!) 🧹' },
      { contentType: 'testimonial', content: '"I came home and thought I was in the wrong house!" ⭐⭐⭐⭐⭐' },
    ],
    samplePostsByPillar: {
      transformations: [
        'This oven hadn\'t been cleaned in 2 years. Look at it now ✨',
        'Move-out clean complete. Security deposit: SECURED 💰',
        'The grout lines in this bathroom went from brown to WHITE 🤯',
        'When the homeowner walks in after a deep clean — that face is everything 😊',
        'Before vs After: This kitchen transformation is our best one yet',
      ],
      tips: [
        'The $3 product that removes ANY carpet stain (cleaning pros know this) 🧴',
        'How to clean your entire house in 60 minutes (our team\'s method)',
        'Stop using bleach on everything. Here\'s what to use instead ⚠️',
        'The cleaning order that saves you 30 minutes every time (top to bottom!)',
        'Microfiber vs paper towels: one of them is wasting your money 💸',
      ],
      checklists: [
        '🧹 Spring Cleaning Checklist — save this and thank us later!',
        'Moving out? Here\'s every single thing you need to clean for your deposit back',
        'Weekly cleaning schedule that keeps your house guest-ready at ALL times',
        'Holiday hosting prep: The cleaning checklist your guests will notice 🎄',
        'Bathroom deep clean checklist (most people forget #4 and #7)',
      ],
      reviews: [
        '⭐⭐⭐⭐⭐ "I didn\'t know my counters were supposed to shine like that"',
        '"Been using them weekly for 6 months. Never going back to cleaning myself."',
        'This review made us smile all week 😊 We love our clients!',
        '"They cleaned things I didn\'t even know were dirty" — yep, that\'s the deep clean.',
        'Another happy customer, another referral. Trust > ads every time 🙏',
      ],
    },
    platformRecommendations: ['instagram', 'facebook', 'google_business', 'nextdoor'],
  },

  real_estate: {
    id: 'real_estate',
    industry: 'Real Estate',
    pillars: [
      pillar('market_updates', 'Market Updates', 'Local market data and trends', ['Monthly market stats', 'Interest rate updates']),
      pillar('listings', 'Listings', 'Property showcases', ['Just listed highlights', 'Open house promos']),
      pillar('home_tips', 'Home Tips', 'Buyer/seller education', ['First-time buyer guides', 'Staging tips']),
      pillar('client_stories', 'Client Stories', 'Success stories and testimonials', ['Closing day photos', 'Client journey stories']),
    ],
    contentTypes: ['stat_card', 'flyer', 'testimonial', 'quote_card'],
    voiceSuggestions: ['professional', 'friendly', 'inspirational'],
    weeklySchedule: weekSlots(['market_updates', 'listings', 'home_tips', 'client_stories', 'listings'], ['stat_card', 'flyer', 'quote_card', 'testimonial', 'flyer']),
    samplePosts: [
      { contentType: 'stat_card', content: 'Market Update: Average home price up 3.2% this quarter 📊' },
      { contentType: 'flyer', content: 'JUST LISTED: Stunning 4BR/3BA — Open house Saturday! 🏡' },
      { contentType: 'testimonial', content: '"Found our dream home in 2 weeks!" — The Johnsons 🔑' },
    ],
    samplePostsByPillar: {
      market_updates: [
        '📊 Market Update: Median home price this month vs last year — here\'s the trend',
        'Interest rates just moved. Here\'s what it means for buyers AND sellers.',
        'Inventory is [up/down] this month. What that means for your home search 🏠',
        'How long are homes sitting on market in our area? The data might surprise you.',
        'Monthly market snapshot: 3 stats every homeowner should know right now',
      ],
      listings: [
        '🏡 JUST LISTED: 4BR/3BA with the kitchen of your dreams. DM for details!',
        'Open House Saturday 1-3pm! Come see this beauty in person 🔑',
        'This one won\'t last long. 3BR, updated everything, amazing neighborhood.',
        'Price improvement on this stunner! Now is the time to make your move.',
        'SOLD in 5 days over asking! The market is moving — are you ready?',
      ],
      home_tips: [
        'First-time buyer? Here are 5 things your lender won\'t tell you 💡',
        '3 staging tips that help homes sell 20% faster (backed by data)',
        'The home inspection items that scare buyers most (and which ones shouldn\'t)',
        'Thinking about selling? Start with these 3 high-ROI improvements.',
        'Renting vs buying in today\'s market — an honest breakdown with real numbers 📊',
      ],
      client_stories: [
        '🔑 Closing day! Welcome home, Johnson family! Another dream realized.',
        'From "we\'ll never find anything" to "it\'s PERFECT" in 3 weeks 🏡❤️',
        '"Best decision we ever made" — 1 year update from our clients',
        'This couple got outbid 4 times. On the 5th try, they got their dream home 🎉',
        'Another referral closed! Nothing means more than a client sending their friends 🙏',
      ],
    },
    platformRecommendations: ['instagram', 'facebook', 'linkedin', 'tiktok'],
  },

  restaurant: {
    id: 'restaurant',
    industry: 'Restaurant / Food',
    pillars: [
      pillar('menu', 'Menu Highlights', 'Showcase dishes and drinks', ['New menu items', 'Chef specials']),
      pillar('behind_kitchen', 'Behind the Kitchen', 'Show the craft and people', ['Chef at work', 'Prep process']),
      pillar('customer_love', 'Customer Love', 'Reviews and customer moments', ['Yelp review features', 'Happy customer photos']),
      pillar('events', 'Events', 'Promote happenings', ['Live music nights', 'Holiday specials']),
    ],
    contentTypes: ['photo', 'testimonial', 'flyer', 'hot_take'],
    voiceSuggestions: ['casual', 'bold', 'funny'],
    weeklySchedule: weekSlots(['menu', 'behind_kitchen', 'customer_love', 'events', 'menu'], ['photo', 'hot_take', 'testimonial', 'flyer', 'photo']),
    samplePosts: [
      { contentType: 'photo', content: 'New on the menu: Truffle Mushroom Burger 🍔🔥 Available now!' },
      { contentType: 'hot_take', content: 'Hot take: Fries are better than onion rings. Fight us. 🍟' },
      { contentType: 'flyer', content: 'Live music this Friday! Great food + great vibes 🎵' },
    ],
    samplePostsByPillar: {
      menu: [
        '🍔 NEW: Smoked Gouda Burger with caramelized onions. Your move.',
        'Our most ordered dish this month — and honestly, we get it 😋',
        'Seasonal menu drop! 3 new dishes for fall. Which one are you trying first?',
        'This dessert is the reason people drive 30 minutes to eat here 🍰',
        'The drink that\'s been trending on our menu all week 🍹 Have you tried it yet?',
      ],
      behind_kitchen: [
        'POV: Chef is in the zone and magic is happening 🔥🍳',
        '5am prep. This is where the magic starts — before the doors even open.',
        'Handmade pasta, every single day. No shortcuts. Never.',
        'The sauce recipe that took 6 months to perfect. Worth every minute.',
        'Meet our head chef! [Years] of experience and still experimenting every week 👨‍🍳',
      ],
      customer_love: [
        '⭐⭐⭐⭐⭐ "Best meal I\'ve had in this city. Period." — Thanks for the love!',
        'When the table goes silent after the first bite... that\'s how you know 😌',
        'This couple has been coming every Friday for 2 years. That\'s family. ❤️',
        'The Yelp reviews this week have us blushing 😊 Thank you!',
        '"We drove an hour and would do it again." THAT is the best compliment.',
      ],
      events: [
        '🎵 LIVE MUSIC this Friday! Great food, great drinks, great vibes. See you there.',
        'Taco Tuesday is BACK and better than ever 🌮 $3 tacos all night!',
        'Valentine\'s Day prix fixe menu — reservations are going FAST ❤️',
        'Sunday brunch special: bottomless mimosas + our famous French toast 🥂',
        'Private event space available! Book your next party with us 🎉',
      ],
    },
    platformRecommendations: ['instagram', 'tiktok', 'facebook', 'google_business'],
  },

  fitness: {
    id: 'fitness',
    industry: 'Fitness / Gym',
    pillars: [
      pillar('transformations', 'Transformations', 'Member success stories', ['Weight loss journeys', '90-day challenges']),
      pillar('tips', 'Tips', 'Workout and nutrition advice', ['Form checks', 'Meal prep ideas']),
      pillar('community', 'Community', 'Gym culture and events', ['Member spotlights', 'Group class energy']),
      pillar('motivation', 'Motivation', 'Inspirational content', ['Motivational quotes', 'Mindset posts']),
    ],
    contentTypes: ['before_after', 'quote_card', 'testimonial', 'hot_take'],
    voiceSuggestions: ['bold', 'inspirational', 'casual'],
    weeklySchedule: weekSlots(['transformations', 'tips', 'community', 'motivation', 'tips'], ['before_after', 'checklist', 'testimonial', 'quote_card', 'hot_take']),
    samplePosts: [
      { contentType: 'before_after', content: '90 days. Consistency. Results. 💪 Swipe to see the transformation' },
      { contentType: 'quote_card', content: '"The only bad workout is the one that didn\'t happen." 🔥' },
      { contentType: 'hot_take', content: 'Hot take: You don\'t need a 2-hour gym session. 45 focused minutes > everything.' },
    ],
    samplePostsByPillar: {
      transformations: [
        '90 days of showing up. That\'s it. Look at the results 💪',
        'From "I can\'t" to "watch me." This member\'s journey is incredible.',
        'Down 30 lbs and feeling unstoppable. This is why we do what we do 🙏',
        'Before vs After — but the REAL transformation is the confidence. Look at that smile.',
        'Started in January. It\'s now [month]. The consistency paid off BIG.',
      ],
      tips: [
        'The #1 reason you\'re not seeing results (it\'s not what you think) 🧵',
        'Perfect squat form in 4 steps. Save this and watch it before leg day 🦵',
        'Meal prep Sunday! Here\'s a simple plan that takes 1 hour for the whole week',
        'Stop skipping the warm-up. Here\'s a 5-minute routine that prevents injuries.',
        '3 exercises that burn more calories than running (and are way more fun)',
      ],
      community: [
        'Member Spotlight: Meet [Name] — 6 months in and absolutely crushing it 🌟',
        'Saturday morning class energy hits different 🔥 This crew is unmatched.',
        'When the whole gym cheers you through your last rep > everything',
        'New member welcome! Your first week is the hardest. After that? Addicted 💪',
        'Gym community > gym equipment. Every single time. This is why people stay.',
      ],
      motivation: [
        '"The only bad workout is the one that didn\'t happen." Get up. Show up. 🔥',
        'You\'re not tired. You\'re uninspired. Find your WHY and let\'s GO.',
        'A year from now you\'ll wish you started today. So start TODAY.',
        'Discipline > motivation. Motivation fades. Discipline is a decision.',
        'Your future self is counting on you. Don\'t let them down. 💪',
      ],
    },
    platformRecommendations: ['instagram', 'tiktok', 'facebook', 'twitter'],
  },

  generic: {
    id: 'generic',
    industry: 'Generic / Other',
    pillars: [
      pillar('value', 'Value Content', 'Educate and help your audience', ['Tips and how-tos', 'Industry insights']),
      pillar('bts', 'Behind the Scenes', 'Show authenticity and process', ['Day in the life', 'How it\'s made']),
      pillar('social_proof', 'Social Proof', 'Build trust with evidence', ['Customer reviews', 'Case studies']),
      pillar('promotions', 'Promotions', 'Drive action and sales', ['Limited offers', 'New product launches']),
    ],
    contentTypes: ['quote_card', 'testimonial', 'stat_card', 'flyer'],
    voiceSuggestions: ['friendly', 'professional', 'casual'],
    weeklySchedule: weekSlots(['value', 'bts', 'social_proof', 'promotions', 'value'], ['quote_card', 'stat_card', 'testimonial', 'flyer', 'checklist']),
    samplePosts: [
      { contentType: 'quote_card', content: '3 things our clients always ask (and our honest answers) 💡' },
      { contentType: 'testimonial', content: '"Working with them was the best decision for our business" ⭐⭐⭐⭐⭐' },
      { contentType: 'flyer', content: 'Limited time offer! Book this week and save 20% 🎉' },
    ],
    samplePostsByPillar: {
      value: [
        '3 things most people get wrong about [your industry] — here\'s the truth 💡',
        'The most common question we get (and our honest answer)',
        'Save this! A quick guide to [common problem your audience faces]',
        '5 [industry] myths that need to die in 2024 🚫',
        'Here\'s what [years] in business has taught us about [topic]',
      ],
      bts: [
        'POV: A regular day at [Business Name] — it\'s more than you\'d think 📸',
        'How we [do your main service] — from start to finish',
        'Meet the team! Here\'s who\'s behind the work you love 🤝',
        'Things you don\'t see: the prep that goes into every [service/product]',
        'Early mornings, late nights. That\'s the entrepreneur life. Worth it? Absolutely.',
      ],
      social_proof: [
        '⭐⭐⭐⭐⭐ Another happy customer! Here\'s what they had to say:',
        '[X] customers served and counting. Thank you for trusting us 🙏',
        '"I wish I found you sooner" — we hear this more than you\'d think ❤️',
        'Results speak louder than ads. Here\'s what we delivered this month 📊',
        'Another referral from a happy client. That\'s the best marketing there is.',
      ],
      promotions: [
        '🎉 This week only: [X]% off for new customers! DM to book.',
        'New [service/product] just dropped! Here\'s what you need to know 👇',
        'Spots are filling up for [month]. Book now before we\'re full!',
        'Refer a friend and you BOTH save. Details in bio 🔗',
        'We just hit [milestone]! To celebrate: special offer for the next 48 hours 🎊',
      ],
    },
    platformRecommendations: ['instagram', 'facebook', 'linkedin', 'google_business'],
  },
}

export function getTemplate(industryId: string): FullIndustryTemplate | undefined {
  return INDUSTRY_TEMPLATES[industryId]
}

export function getAllIndustryIds(): string[] {
  return Object.keys(INDUSTRY_TEMPLATES)
}
