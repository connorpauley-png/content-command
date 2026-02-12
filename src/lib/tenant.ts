/**
 * Multi-tenant configuration
 * Currently hardcoded to College Bros, but structured for multi-tenant
 */

export interface Organization {
  id: string
  name: string
  slug: string
  industry: 'lawn_care' | 'pressure_washing' | 'roofing' | 'hvac' | 'plumbing' | 'cleaning' | 'general'
  brandVoice: 'professional' | 'friendly' | 'casual' | 'bold'
  brandColors: {
    primary: string
    secondary: string
  }
  contactPhone: string
  contactEmail: string
  website: string
  timezone: string
  plan: 'free' | 'pro' | 'agency'
}

export interface Integration {
  id: string
  orgId: string
  type: 'companycam' | 'jobber' | 'housecallpro' | 'instagram' | 'facebook' | 'x' | 'linkedin' | 'nextdoor' | 'gmb'
  category: 'source' | 'destination'
  name: string
  credentials: Record<string, string>
  config: Record<string, unknown>
  status: 'active' | 'paused' | 'error' | 'disconnected'
}

// Current tenant - College Bros
// In multi-tenant, this would come from auth/session
export const CURRENT_ORG: Organization = {
  id: 'collegebros-001',
  name: 'College Bros Outdoor Services',
  slug: 'collegebros',
  industry: 'lawn_care',
  brandVoice: 'friendly',
  brandColors: {
    primary: '#254421',
    secondary: '#e2b93b',
  },
  contactPhone: process.env.CONTACT_PHONE || '',
  contactEmail: process.env.CONTACT_EMAIL || '',
  website: 'collegebrosllc.com',
  timezone: 'America/Chicago',
  plan: 'pro',
}

// Current integrations
export const CURRENT_INTEGRATIONS: Integration[] = [
  {
    id: 'int-cc-001',
    orgId: CURRENT_ORG.id,
    type: 'companycam',
    category: 'source',
    name: 'CompanyCam',
    credentials: {
      token: process.env.COMPANYCAM_TOKEN || '',
    },
    config: {
      companyId: '1139758',
    },
    status: 'active',
  },
  {
    id: 'int-ig-001',
    orgId: CURRENT_ORG.id,
    type: 'instagram',
    category: 'destination',
    name: 'Instagram (@collegebros31)',
    credentials: {
      accountId: process.env.IG_BUSINESS_ACCOUNT_ID || '',
      pageToken: process.env.FB_PAGE_TOKEN || '',
    },
    config: {},
    status: 'active',
  },
  {
    id: 'int-fb-001',
    orgId: CURRENT_ORG.id,
    type: 'facebook',
    category: 'destination',
    name: 'Facebook (Collegebrosllc)',
    credentials: {
      pageId: process.env.FB_PAGE_ID || '',
      pageToken: process.env.FB_PAGE_TOKEN || '',
    },
    config: {},
    status: 'active',
  },
  {
    id: 'int-x-001',
    orgId: CURRENT_ORG.id,
    type: 'x',
    category: 'destination',
    name: 'X (@pauley_connor)',
    credentials: {
      consumerKey: process.env.TWITTER_CONSUMER_KEY || '',
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET || '',
      accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
      accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || '',
    },
    config: {},
    status: 'active',
  },
  {
    id: 'int-li-001',
    orgId: CURRENT_ORG.id,
    type: 'linkedin',
    category: 'destination',
    name: 'LinkedIn (Connor Pauley)',
    credentials: {
      accessToken: process.env.LINKEDIN_ACCESS_TOKEN || '',
      personUrn: process.env.LINKEDIN_PERSON_URN || '',
    },
    config: {},
    status: 'active',
  },
  {
    id: 'int-nd-001',
    orgId: CURRENT_ORG.id,
    type: 'nextdoor',
    category: 'destination',
    name: 'Nextdoor',
    credentials: {},
    config: {},
    status: 'paused', // No API, manual posting
  },
  {
    id: 'int-gmb-001',
    orgId: CURRENT_ORG.id,
    type: 'gmb',
    category: 'destination',
    name: 'Google Business',
    credentials: {},
    config: {},
    status: 'paused', // Needs setup
  },
]

// Helper to get current org (would use auth in multi-tenant)
export function getCurrentOrg(): Organization {
  return CURRENT_ORG
}

// Helper to get integrations for current org
export function getIntegrations(category?: 'source' | 'destination'): Integration[] {
  const integrations = CURRENT_INTEGRATIONS.filter(i => i.orgId === CURRENT_ORG.id)
  if (category) {
    return integrations.filter(i => i.category === category)
  }
  return integrations
}

// Helper to get active destinations
export function getActiveDestinations(): Integration[] {
  return getIntegrations('destination').filter(i => i.status === 'active')
}

// Platform display info
export const PLATFORM_INFO: Record<string, { name: string; icon: string; color: string }> = {
  instagram: { name: 'Instagram', icon: '📷', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  facebook: { name: 'Facebook', icon: 'f', color: 'bg-blue-600' },
  x: { name: 'X', icon: '𝕏', color: 'bg-black' },
  linkedin: { name: 'LinkedIn', icon: 'in', color: 'bg-blue-700' },
  nextdoor: { name: 'Nextdoor', icon: 'N', color: 'bg-emerald-600' },
  gmb: { name: 'Google Business', icon: 'G', color: 'bg-green-600' },
  tiktok: { name: 'TikTok', icon: '♪', color: 'bg-black' },
}
