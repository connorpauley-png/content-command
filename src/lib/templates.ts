/**
 * Content Templates
 * Pre-built formats that work. Structured for any service business.
 */

import { getCurrentOrg, type Organization } from './tenant'

export interface ContentTemplate {
  id: string
  name: string
  description: string
  type: TemplateType
  industry: string | null // null = all industries
  platforms: string[]
  promptTemplate: string
  captionTemplate: string | null
  variables: TemplateVariable[]
  settings: {
    minPhotos: number
    maxPhotos: number
    autoApproveEligible: boolean
    requiresVideo?: boolean
  }
}

export interface TemplateVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'select'
  required: boolean
  default?: string | number | boolean
  options?: string[] // for select type
}

export type TemplateType = 
  | 'before_after'
  | 'transformation'
  | 'review_thanks'
  | 'seasonal'
  | 'hiring'
  | 'crew'
  | 'milestone'
  | 'tip'
  | 'promo'
  | 'story'
  | 'day_in_life'
  | 'hot_take'

// System templates available to all organizations
export const SYSTEM_TEMPLATES: ContentTemplate[] = [
  // === UNIVERSAL TEMPLATES ===
  {
    id: 'tpl-before-after',
    name: 'Before/After Transformation',
    description: 'Classic side-by-side transformation. The money format.',
    type: 'before_after',
    industry: null,
    platforms: ['instagram', 'facebook', 'nextdoor'],
    promptTemplate: `Generate a short caption for a before/after transformation photo.
Industry: {industry}
Brand voice: {brandVoice}
Rules: No emojis. Under 100 characters. Punchy. Do NOT mention time or hours.`,
    captionTemplate: null, // Use rotation captions below
    variables: [],
    settings: { minPhotos: 2, maxPhotos: 2, autoApproveEligible: true },
  },
  {
    id: 'tpl-review-thanks',
    name: 'Review Thank You',
    description: 'Thank a customer for leaving a review',
    type: 'review_thanks',
    industry: null,
    platforms: ['facebook', 'nextdoor', 'gmb'],
    promptTemplate: `Generate a brief thank you for a customer review.
Customer name: {customerName}
Stars: {stars}
Brand voice: {brandVoice}
Rules: Genuine, not corporate. No emojis. Under 150 characters.`,
    captionTemplate: 'Thank you {customerName} for the kind words. We appreciate you trusting us with your property.',
    variables: [
      { name: 'customerName', type: 'string', required: true },
      { name: 'stars', type: 'number', required: false, default: 5 },
    ],
    settings: { minPhotos: 0, maxPhotos: 1, autoApproveEligible: true },
  },
  {
    id: 'tpl-hiring',
    name: 'Now Hiring',
    description: 'Recruitment post for crew members',
    type: 'hiring',
    industry: null,
    platforms: ['instagram', 'facebook'],
    promptTemplate: `Generate a hiring post.
Industry: {industry}
Pay range: {payRange}
Phone: {phone}
Brand voice: {brandVoice}
Include: No experience needed, will train, outdoor work.
Rules: No emojis. Direct. Include phone.`,
    captionTemplate: 'We are hiring. {payRange}. No experience needed - we train. DM or call {phone}.',
    variables: [
      { name: 'payRange', type: 'string', required: false, default: '$12-15/hr' },
    ],
    settings: { minPhotos: 0, maxPhotos: 1, autoApproveEligible: false },
  },
  {
    id: 'tpl-crew',
    name: 'Crew Spotlight',
    description: 'Feature your team',
    type: 'crew',
    industry: null,
    platforms: ['instagram', 'facebook'],
    promptTemplate: `Generate a caption spotlighting the crew in this photo.
Brand voice: {brandVoice}
Rules: No emojis. No specific names unless provided. Emphasize hard work.`,
    captionTemplate: 'The crew that makes it happen.',
    variables: [],
    settings: { minPhotos: 1, maxPhotos: 3, autoApproveEligible: false },
  },
  {
    id: 'tpl-milestone',
    name: 'Milestone Celebration',
    description: 'Celebrate reviews, years, customers',
    type: 'milestone',
    industry: null,
    platforms: ['instagram', 'facebook', 'linkedin', 'nextdoor'],
    promptTemplate: `Generate a milestone post.
Milestone type: {milestoneType}
Milestone value: {milestoneValue}
Brand voice: {brandVoice}
Rules: No emojis. Grateful not boastful. Thank customers.`,
    captionTemplate: '{milestoneValue} {milestoneType}. Thank you for trusting us.',
    variables: [
      { name: 'milestoneType', type: 'select', required: true, options: ['Google reviews', 'years in business', 'customers served', 'jobs completed', 'employees'] },
      { name: 'milestoneValue', type: 'string', required: true },
    ],
    settings: { minPhotos: 0, maxPhotos: 1, autoApproveEligible: false },
  },
  {
    id: 'tpl-tip',
    name: 'Quick Tip',
    description: 'Helpful advice for homeowners',
    type: 'tip',
    industry: null,
    platforms: ['instagram', 'facebook', 'nextdoor'],
    promptTemplate: `Generate a helpful tip for homeowners.
Topic: {topic}
Industry: {industry}
Brand voice: {brandVoice}
Rules: No emojis. Actionable. Helpful neighbor tone, not salesy. Under 200 characters.`,
    captionTemplate: null, // AI generated
    variables: [
      { name: 'topic', type: 'string', required: true },
    ],
    settings: { minPhotos: 0, maxPhotos: 1, autoApproveEligible: false },
  },

  // === LAWN CARE SPECIFIC ===
  {
    id: 'tpl-spring-push',
    name: 'Spring Booking Push',
    description: 'Get spring services on the schedule',
    type: 'seasonal',
    industry: 'lawn_care',
    platforms: ['facebook', 'instagram', 'nextdoor'],
    promptTemplate: `Generate a spring booking reminder.
Services: first mow, spring cleanup, mulching
Phone: {phone}
Brand voice: {brandVoice}
Rules: No emojis. Soft CTA. Create urgency without being pushy.`,
    captionTemplate: 'Spring booking is open. First mow, cleanup, mulch - get on the schedule before the rush. {phone}',
    variables: [],
    settings: { minPhotos: 0, maxPhotos: 1, autoApproveEligible: true },
  },
  {
    id: 'tpl-fall-prep',
    name: 'Fall Prep Reminder',
    description: 'Fall cleanup and winterization',
    type: 'seasonal',
    industry: 'lawn_care',
    platforms: ['facebook', 'instagram', 'nextdoor'],
    promptTemplate: `Generate a fall prep reminder.
Services: leaf removal, bed cleanup, winterization
Phone: {phone}
Brand voice: {brandVoice}
Rules: No emojis. Helpful tone.`,
    captionTemplate: 'Fall cleanup time. Leaves, beds, and getting your lawn ready for winter. {phone}',
    variables: [],
    settings: { minPhotos: 0, maxPhotos: 1, autoApproveEligible: true },
  },

  // === PRESSURE WASHING SPECIFIC ===
  {
    id: 'tpl-pressure-wash-reveal',
    name: 'Pressure Wash Reveal',
    description: 'Satisfying cleaning transformation',
    type: 'transformation',
    industry: 'pressure_washing',
    platforms: ['instagram', 'facebook', 'nextdoor'],
    promptTemplate: `Generate a caption for a pressure washing transformation.
Surface: {surface}
Brand voice: {brandVoice}
Rules: No emojis. Emphasize the satisfying transformation.`,
    captionTemplate: 'Same {surface}. Just cleaned.',
    variables: [
      { name: 'surface', type: 'select', required: true, options: ['driveway', 'sidewalk', 'patio', 'deck', 'fence', 'house'] },
    ],
    settings: { minPhotos: 2, maxPhotos: 2, autoApproveEligible: true },
  },

  // === PERSONAL BRAND TEMPLATES ===
  {
    id: 'tpl-story-post',
    name: 'Story Post',
    description: 'Share a lesson or journey update',
    type: 'story',
    industry: null,
    platforms: ['instagram', 'linkedin', 'x'],
    promptTemplate: `Generate a personal story post.
Topic: {topic}
Key lesson: {lesson}
Brand voice: {brandVoice}
Rules: No emojis. Authentic. First person. 200-400 characters.`,
    captionTemplate: null,
    variables: [
      { name: 'topic', type: 'string', required: true },
      { name: 'lesson', type: 'string', required: false },
    ],
    settings: { minPhotos: 0, maxPhotos: 1, autoApproveEligible: false },
  },
  {
    id: 'tpl-hot-take',
    name: 'Hot Take',
    description: 'Contrarian opinion to spark engagement',
    type: 'hot_take',
    industry: null,
    platforms: ['x', 'linkedin'],
    promptTemplate: `Generate a contrarian take on a business topic.
Topic: {topic}
Brand voice: {brandVoice}
Rules: No emojis. Provocative but not offensive. Under 280 characters.`,
    captionTemplate: null,
    variables: [
      { name: 'topic', type: 'string', required: true },
    ],
    settings: { minPhotos: 0, maxPhotos: 0, autoApproveEligible: false },
  },
]

/**
 * Get templates available for an organization
 */
export function getTemplatesForOrg(org: Organization = getCurrentOrg()): ContentTemplate[] {
  return SYSTEM_TEMPLATES.filter(t => 
    t.industry === null || t.industry === org.industry
  )
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): ContentTemplate | undefined {
  return SYSTEM_TEMPLATES.find(t => t.id === id)
}

/**
 * Get templates by type
 */
export function getTemplatesByType(type: TemplateType): ContentTemplate[] {
  return SYSTEM_TEMPLATES.filter(t => t.type === type)
}

/**
 * Fill template with variables
 */
export function fillTemplate(template: ContentTemplate, variables: Record<string, string | number>): string {
  const org = getCurrentOrg()
  
  // Merge org variables
  const allVars: Record<string, string | number> = {
    industry: org.industry,
    brandVoice: org.brandVoice,
    phone: org.contactPhone,
    website: org.website,
    ...variables,
  }
  
  // Use caption template if exists, otherwise return prompt for AI
  let text = template.captionTemplate || template.promptTemplate
  
  // Replace variables
  for (const [key, value] of Object.entries(allVars)) {
    text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value))
  }
  
  return text
}

/**
 * Get auto-approvable templates
 */
export function getAutoApproveTemplates(): ContentTemplate[] {
  return SYSTEM_TEMPLATES.filter(t => t.settings.autoApproveEligible)
}
