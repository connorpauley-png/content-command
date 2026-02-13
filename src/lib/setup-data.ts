import { INDUSTRY_TEMPLATES, FullIndustryTemplate } from './industry-templates'
import type { AppConfig, BusinessConfig, BrandVoice, WeeklySchedule } from '@/types'

export interface IndustryOption {
  id: string
  label: string
  icon: string
}

export const INDUSTRIES: IndustryOption[] = [
  { id: 'lawn_care', label: 'Lawn Care / Landscaping', icon: '🌿' },
  { id: 'pressure_washing', label: 'Pressure Washing', icon: '💦' },
  { id: 'plumbing', label: 'Plumbing', icon: '🔧' },
  { id: 'hvac', label: 'HVAC', icon: '❄️' },
  { id: 'roofing', label: 'Roofing', icon: '🏠' },
  { id: 'cleaning', label: 'Cleaning Services', icon: '🧹' },
  { id: 'real_estate', label: 'Real Estate', icon: '🏡' },
  { id: 'restaurant', label: 'Restaurant / Food', icon: '🍽️' },
  { id: 'fitness', label: 'Fitness / Gym', icon: '💪' },
  { id: 'generic', label: 'Other', icon: '📋' },
]

export function getIndustryTemplate(industryId: string): FullIndustryTemplate | undefined {
  return INDUSTRY_TEMPLATES[industryId]
}

export interface BusinessInfo {
  businessName: string
  industry: string
  location: { city: string; state: string }
  services: string[]
  targetAudience?: string
  usp?: string
}

export function generateSmartConfig(industryId: string, info: BusinessInfo): Partial<AppConfig> {
  const template = INDUSTRY_TEMPLATES[industryId] ?? INDUSTRY_TEMPLATES['generic']

  const business: BusinessConfig = {
    name: info.businessName,
    industry: template.industry,
    location: info.location,
    services: info.services,
    targetAudience: info.targetAudience ?? `Local homeowners and businesses in ${info.location.city}, ${info.location.state}`,
    brandVoice: template.voiceSuggestions as BrandVoice[],
    usp: info.usp ?? '',
    contentRules: [
      'Always include a call to action',
      'Use local references when possible',
      'Keep it authentic — real photos over stock',
      `Mention ${info.location.city} area in 50%+ of posts`,
    ],
  }

  const strategy = {
    document: `Content strategy for ${info.businessName} — a ${template.industry} business in ${info.location.city}, ${info.location.state}. Focus areas: ${template.pillars.map(p => p.name).join(', ')}.`,
    pillars: template.pillars,
    samplePosts: template.samplePosts.map(sp => ({
      accountId: '__default__',
      content: sp.content.replace(/\[Business Name\]/g, info.businessName),
      pillar: template.pillars[0].id,
    })),
    calendar: template.weeklySchedule.map(slot => ({
      dayOfWeek: slot.dayOfWeek,
      accountId: slot.accountId,
      contentType: slot.contentType,
      pillar: slot.pillar ?? template.pillars[0].id,
      time: slot.time,
    })),
  }

  const weeklySchedule: WeeklySchedule = {
    slots: template.weeklySchedule,
  }

  return {
    business,
    strategy,
    weeklySchedule,
    accounts: [],
    setupComplete: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
