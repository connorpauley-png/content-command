'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'


import { cn } from '@/lib/utils'
import {
  Check, ArrowRight, ArrowLeft, Zap, Building2, Palette, Share2, Puzzle,
  Brain, Target, Rocket, Plus, X, Trash2, Sparkles, Loader2
} from 'lucide-react'
import { useConfigStore } from '@/lib/store/config'
import { useClientStore } from '@/lib/store/clients'
import { useScheduleStore } from '@/lib/store/schedule'
import type {
  AIProvider, BusinessConfig, PlatformAccount, ContentStrategy,
  IntegrationsConfig, BrandVoice, ContentPillar, ContentType, CalendarSlot, Platform
} from '@/types'

// ─── Industry Templates ───────────────────────────────────────────────
const INDUSTRIES = [
  'landscaping', 'lawn_care', 'pressure_washing', 'roofing', 'plumbing',
  'electrical', 'hvac', 'cleaning', 'pest_control', 'painting',
  'general_contractor', 'restaurant', 'cafe', 'fitness', 'salon',
  'real_estate', 'dental', 'medical', 'legal', 'accounting',
  'ecommerce', 'saas', 'agency', 'photography', 'other'
]

const INDUSTRY_LABELS: Record<string, string> = {
  landscaping: 'Landscaping / Lawn Care', lawn_care: 'Lawn Care', pressure_washing: 'Pressure Washing',
  roofing: 'Roofing', plumbing: 'Plumbing', electrical: 'Electrical', hvac: 'HVAC',
  cleaning: 'Cleaning Services', pest_control: 'Pest Control', painting: 'Painting',
  general_contractor: 'General Contractor', restaurant: 'Restaurant', cafe: 'Cafe / Coffee Shop',
  fitness: 'Fitness / Gym', salon: 'Salon / Barbershop', real_estate: 'Real Estate',
  dental: 'Dental Practice', medical: 'Medical Practice', legal: 'Law Firm',
  accounting: 'Accounting / CPA', ecommerce: 'E-Commerce', saas: 'SaaS / Software',
  agency: 'Marketing Agency', photography: 'Photography', other: 'Other',
}

interface IndustryDefaults {
  pillars: ContentPillar[]
  contentTypes: ContentType[]
  voiceSuggestions: BrandVoice[]
  services: string[]
  weeklySchedule: Omit<CalendarSlot, 'accountId'>[]
}

const INDUSTRY_DEFAULTS: Record<string, IndustryDefaults> = {
  landscaping: {
    pillars: [
      { id: 'showcase', name: 'Showcase Work', description: 'Before/after transformations, finished projects', examples: ['Before and after lawn renovation', 'Fresh mulch install'] },
      { id: 'education', name: 'Education', description: 'Tips, how-tos, seasonal advice', examples: ['When to fertilize your lawn', 'Spring cleanup checklist'] },
      { id: 'bts', name: 'Behind the Scenes', description: 'Crew at work, equipment, day in the life', examples: ['Monday morning crew dispatch', 'Equipment maintenance day'] },
      { id: 'social-proof', name: 'Social Proof', description: 'Reviews, testimonials, milestones', examples: ['Customer review spotlight', '100th job completed'] },
      { id: 'community', name: 'Community', description: 'Local events, seasonal content, engagement', examples: ['Supporting local sports team', 'Holiday decoration tips'] },
    ],
    contentTypes: ['photo', 'before_after', 'reel', 'testimonial', 'text', 'crew_spotlight', 'timelapse'],
    voiceSuggestions: ['professional', 'friendly', 'casual'],
    services: ['Lawn Mowing', 'Landscaping', 'Mulch Installation', 'Hedge Trimming', 'Leaf Cleanup', 'Spring/Fall Cleanup', 'Bed Maintenance'],
    weeklySchedule: [
      { dayOfWeek: 1, contentType: 'before_after', pillar: 'Showcase Work', time: '09:00' },
      { dayOfWeek: 2, contentType: 'text', pillar: 'Education', time: '12:00' },
      { dayOfWeek: 3, contentType: 'reel', pillar: 'Behind the Scenes', time: '09:00' },
      { dayOfWeek: 4, contentType: 'testimonial', pillar: 'Social Proof', time: '10:00' },
      { dayOfWeek: 5, contentType: 'photo', pillar: 'Showcase Work', time: '09:00' },
    ],
  },
  restaurant: {
    pillars: [
      { id: 'menu', name: 'Menu Highlights', description: 'Feature dishes, specials, new items', examples: ['New seasonal pasta', 'Chef special of the week'] },
      { id: 'bts', name: 'Behind the Scenes', description: 'Kitchen prep, team, sourcing', examples: ['Morning prep timelapse', 'Meet our head chef'] },
      { id: 'social-proof', name: 'Social Proof', description: 'Reviews, customer photos, press', examples: ['5-star review highlight', 'Customer food photo reshare'] },
      { id: 'events', name: 'Events & Specials', description: 'Happy hours, live music, seasonal events', examples: ['Friday happy hour', 'Valentines Day menu'] },
    ],
    contentTypes: ['photo', 'reel', 'story', 'carousel', 'video'],
    voiceSuggestions: ['friendly', 'casual', 'bold'],
    services: ['Dine-In', 'Takeout', 'Catering', 'Private Events', 'Delivery'],
    weeklySchedule: [
      { dayOfWeek: 1, contentType: 'photo', pillar: 'Menu Highlights', time: '11:00' },
      { dayOfWeek: 3, contentType: 'reel', pillar: 'Behind the Scenes', time: '14:00' },
      { dayOfWeek: 5, contentType: 'story', pillar: 'Events & Specials', time: '16:00' },
      { dayOfWeek: 6, contentType: 'carousel', pillar: 'Menu Highlights', time: '10:00' },
    ],
  },
  fitness: {
    pillars: [
      { id: 'workouts', name: 'Workouts & Tips', description: 'Exercise demos, routines, form tips', examples: ['5-minute ab routine', 'Proper deadlift form'] },
      { id: 'transformations', name: 'Transformations', description: 'Member success stories, progress', examples: ['Member spotlight: 30-day challenge', 'Before/after fitness journey'] },
      { id: 'motivation', name: 'Motivation', description: 'Quotes, challenges, accountability', examples: ['Monday motivation', 'Weekly challenge post'] },
      { id: 'community', name: 'Community', description: 'Events, classes, team highlights', examples: ['New class schedule', 'Group workout recap'] },
    ],
    contentTypes: ['reel', 'photo', 'video', 'carousel', 'story', 'quote_card'],
    voiceSuggestions: ['bold', 'inspirational', 'casual'],
    services: ['Personal Training', 'Group Classes', 'Nutrition Coaching', 'Online Programs'],
    weeklySchedule: [
      { dayOfWeek: 1, contentType: 'quote_card', pillar: 'Motivation', time: '06:00' },
      { dayOfWeek: 2, contentType: 'reel', pillar: 'Workouts & Tips', time: '09:00' },
      { dayOfWeek: 3, contentType: 'photo', pillar: 'Transformations', time: '12:00' },
      { dayOfWeek: 5, contentType: 'video', pillar: 'Workouts & Tips', time: '09:00' },
      { dayOfWeek: 6, contentType: 'story', pillar: 'Community', time: '10:00' },
    ],
  },
}

// Fallback defaults
const DEFAULT_INDUSTRY: IndustryDefaults = {
  pillars: [
    { id: 'showcase', name: 'Showcase', description: 'Feature your work and results', examples: [] },
    { id: 'education', name: 'Education', description: 'Share expertise and tips', examples: [] },
    { id: 'social-proof', name: 'Social Proof', description: 'Reviews, testimonials, milestones', examples: [] },
    { id: 'engagement', name: 'Engagement', description: 'Community interaction and fun content', examples: [] },
  ],
  contentTypes: ['photo', 'text', 'reel', 'carousel'],
  voiceSuggestions: ['professional', 'friendly'],
  services: [],
  weeklySchedule: [
    { dayOfWeek: 1, contentType: 'photo', time: '09:00' },
    { dayOfWeek: 3, contentType: 'text', time: '12:00' },
    { dayOfWeek: 5, contentType: 'reel', time: '09:00' },
  ],
}

function getIndustryDefaults(industry: string): IndustryDefaults {
  return INDUSTRY_DEFAULTS[industry] || DEFAULT_INDUSTRY
}

const VOICE_OPTIONS: BrandVoice[] = ['professional', 'casual', 'funny', 'educational', 'inspirational', 'bold', 'friendly']

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'twitter', label: 'X / Twitter' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'google_business', label: 'Google Business' },
  { id: 'nextdoor', label: 'Nextdoor' },
]

const steps = [
  { id: 'business', label: 'Your Business', icon: Building2 },
  { id: 'brand', label: 'Your Brand', icon: Palette },
  { id: 'accounts', label: 'Accounts', icon: Share2 },
  { id: 'integrations', label: 'Integrations', icon: Puzzle },
  { id: 'ai', label: 'AI Setup', icon: Brain },
  { id: 'strategy', label: 'Strategy', icon: Target },
  { id: 'review', label: 'Review & Launch', icon: Rocket },
]

export default function SetupPageV2() {
  const router = useRouter()
  const { getConfig, setConfig } = useConfigStore()
  const { currentClientId } = useClientStore()
  const { setSlots } = useScheduleStore()
  const config = getConfig()
  const [currentStep, setCurrentStep] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [generatingStrategy, setGeneratingStrategy] = useState(false)

  // ─── Step 1: Business ───
  const [businessName, setBusinessName] = useState(config?.business?.name || '')
  const [industry, setIndustry] = useState(config?.business?.industry || '')
  const [city, setCity] = useState(config?.business?.location?.city || '')
  const [state, setState] = useState(config?.business?.location?.state || '')
  const [services, setServices] = useState<string[]>(config?.business?.services || [])
  const [newService, setNewService] = useState('')
  const [targetAudience, setTargetAudience] = useState(config?.business?.targetAudience || '')

  // ─── Step 2: Brand ───
  const [brandVoice, setBrandVoice] = useState<BrandVoice[]>(config?.business?.brandVoice || [])
  const [usp, setUsp] = useState(config?.business?.usp || '')
  const [contentRules, setContentRules] = useState<string[]>(config?.business?.contentRules || [])
  const [newRule, setNewRule] = useState('')
  const [brandColor, setBrandColor] = useState('#6366f1')

  // ─── Step 3: Accounts ───
  const [accounts, setAccounts] = useState<PlatformAccount[]>(config?.accounts || [])

  // ─── Step 4: Integrations ───
  const [integrations, setIntegrations] = useState<IntegrationsConfig>(config?.integrations || {})

  // ─── Step 5: AI ───
  const [aiProvider, setAiProvider] = useState<AIProvider>(config?.ai?.provider || 'openai')
  const [aiKey, setAiKey] = useState(config?.ai?.apiKey || '')
  const [aiModel, setAiModel] = useState(config?.ai?.model || '')

  // ─── Step 6: Strategy (auto-generated) ───
  const [pillars, setPillars] = useState<ContentPillar[]>(config?.strategy?.pillars || [])
  const [strategySchedule, setStrategySchedule] = useState<Omit<CalendarSlot, 'accountId'>[]>([])
  const [strategyDoc, setStrategyDoc] = useState(config?.strategy?.document || '')

  // When industry changes, pre-fill
  useEffect(() => {
    if (!industry) return
    const defaults = getIndustryDefaults(industry)
    // Only pre-fill if fields are empty (don't overwrite user edits)
    if (services.length === 0 && defaults.services.length > 0) setServices(defaults.services)
    if (brandVoice.length === 0) setBrandVoice(defaults.voiceSuggestions)
    if (pillars.length === 0) setPillars(defaults.pillars)
    if (strategySchedule.length === 0) setStrategySchedule(defaults.weeklySchedule)
  }, [industry]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const industryDefaults = getIndustryDefaults(industry)

  const addService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()])
      setNewService('')
    }
  }

  const addRule = () => {
    if (newRule.trim() && !contentRules.includes(newRule.trim())) {
      setContentRules([...contentRules, newRule.trim()])
      setNewRule('')
    }
  }

  const addAccount = (platform: Platform) => {
    const id = `${platform}-${Date.now()}`
    setAccounts([...accounts, {
      id,
      platform,
      enabled: true,
      handle: '',
      displayName: '',
      credentials: {},
      goal: 'awareness',
      personality: 'business',
      contentTypes: industryDefaults.contentTypes.slice(0, 4),
      postsPerWeek: 3,
      bestTimes: ['09:00', '12:00'],
      hashtagStrategy: '',
      contentDescription: '',
      sampleTopics: [],
      examplePosts: [],
    }])
  }

  const updateAccount = (id: string, updates: Partial<PlatformAccount>) => {
    setAccounts(accounts.map(a => a.id === id ? { ...a, ...updates } : a))
  }

  const removeAccount = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id))
  }

  const handleGenerateStrategy = async () => {
    setGeneratingStrategy(true)
    try {
      // Try to auto-generate via API
      const res = await fetch('/api/generate/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business: { name: businessName, industry, location: { city, state }, services, targetAudience, brandVoice, usp, contentRules },
          accounts,
          ai: { provider: aiProvider, apiKey: aiKey, model: aiModel },
        }),
      })
      const data = await res.json()
      if (data.strategy) {
        if (data.strategy.pillars) setPillars(data.strategy.pillars)
        if (data.strategy.document) setStrategyDoc(data.strategy.document)
      }
    } catch {
      // Fallback: use industry defaults (already loaded)
    }
    setGeneratingStrategy(false)
  }

  const buildConfig = () => {
    const now = new Date().toISOString()
    const businessConfig: BusinessConfig = {
      name: businessName,
      industry,
      location: { city, state },
      services,
      targetAudience,
      brandVoice,
      usp,
      contentRules,
    }
    const strategy: ContentStrategy = {
      document: strategyDoc,
      pillars,
      samplePosts: [],
      calendar: strategySchedule.map((s, i) => ({
        ...s,
        accountId: accounts[i % Math.max(accounts.length, 1)]?.id || '',
      })),
    }
    return {
      clientId: currentClientId!,
      ai: { provider: aiProvider, apiKey: aiKey, model: aiModel || undefined },
      business: businessConfig,
      accounts,
      strategy,
      integrations,
      setupComplete: true,
      createdAt: config?.createdAt || now,
      updatedAt: now,
    }
  }

  const handleFinish = () => {
    if (!currentClientId) return
    const cfg = buildConfig()
    setConfig(cfg)
    // Also save weekly schedule
    if (strategySchedule.length > 0 && accounts.length > 0) {
      const slots: CalendarSlot[] = strategySchedule.map((s, i) => ({
        ...s,
        contentType: s.contentType as ContentType,
        accountId: accounts[i % accounts.length].id,
      }))
      setSlots(slots)
    }
    router.push('/')
  }

  const handleGenerateFirstWeek = async () => {
    if (!currentClientId) return
    // Save config first
    const cfg = buildConfig()
    setConfig(cfg)
    // Then navigate to generate page
    router.push('/generate')
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: return businessName.length > 0 && industry.length > 0
      case 4: return aiKey.length > 0
      default: return true
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Content Command Setup</h1>
          <p className="text-muted-foreground text-sm">Step {currentStep + 1} of {steps.length}</p>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex gap-1.5 mb-8 overflow-x-auto pb-2">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <button
              key={step.id}
              onClick={() => i < currentStep && setCurrentStep(i)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                i === currentStep && 'bg-primary text-primary-foreground',
                i < currentStep && 'bg-primary/20 text-primary cursor-pointer',
                i > currentStep && 'bg-muted text-muted-foreground'
              )}
            >
              {i < currentStep ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          )
        })}
      </div>

      {/* Step Content */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(() => { const Icon = steps[currentStep].icon; return <Icon className="h-5 w-5" /> })()}
            {steps[currentStep].label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Step 1: Business */}
          {currentStep === 0 && (
            <>
              <div>
                <Label>Business Name</Label>
                <Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Your Business Name" />
              </div>
              <div>
                <Label>Industry</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger><SelectValue placeholder="Select your industry" /></SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(ind => (
                      <SelectItem key={ind} value={ind}>{INDUSTRY_LABELS[ind] || ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {industry && (
                  <p className="text-xs text-primary mt-1">
                    We will pre-fill your strategy based on {INDUSTRY_LABELS[industry] || industry} best practices
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Monroe" />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value={state} onChange={e => setState(e.target.value)} placeholder="Louisiana" />
                </div>
              </div>
              <div>
                <Label>Services</Label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {services.map((s, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {s}
                      <button onClick={() => setServices(services.filter((_, j) => j !== i))}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newService} onChange={e => setNewService(e.target.value)} placeholder="Add a service" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addService())} />
                  <Button variant="outline" size="sm" onClick={addService}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
              <div>
                <Label>Target Audience</Label>
                <Textarea value={targetAudience} onChange={e => setTargetAudience(e.target.value)} placeholder="Describe your ideal customer..." rows={3} />
              </div>
            </>
          )}

          {/* Step 2: Brand */}
          {currentStep === 1 && (
            <>
              <div>
                <Label>Brand Voice (select all that apply)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {VOICE_OPTIONS.map(v => (
                    <button
                      key={v}
                      onClick={() => setBrandVoice(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm border transition-colors capitalize',
                        brandVoice.includes(v) ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent/50'
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                {industry && industryDefaults.voiceSuggestions.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Suggested for {INDUSTRY_LABELS[industry] || industry}: {industryDefaults.voiceSuggestions.join(', ')}
                  </p>
                )}
              </div>
              <div>
                <Label>Unique Selling Proposition</Label>
                <Textarea value={usp} onChange={e => setUsp(e.target.value)} placeholder="What makes your business different?" rows={3} />
              </div>
              <div>
                <Label>Content Rules</Label>
                <div className="space-y-1 mb-2">
                  {contentRules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="flex-1">{rule}</span>
                      <button onClick={() => setContentRules(contentRules.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newRule} onChange={e => setNewRule(e.target.value)} placeholder="Add a content rule" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRule())} />
                  <Button variant="outline" size="sm" onClick={addRule}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
              <div>
                <Label>Brand Color</Label>
                <div className="flex items-center gap-3 mt-1">
                  <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="h-10 w-16 rounded border border-border cursor-pointer" />
                  <Input value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-32" />
                </div>
              </div>
            </>
          )}

          {/* Step 3: Accounts */}
          {currentStep === 2 && (
            <>
              <div className="space-y-3">
                {accounts.map(acc => (
                  <Card key={acc.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="capitalize">{acc.platform.replace(/_/g, ' ')}</Badge>
                      <Button variant="ghost" size="icon" onClick={() => removeAccount(acc.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Handle</Label>
                        <Input value={acc.handle} onChange={e => updateAccount(acc.id, { handle: e.target.value })} placeholder="@yourhandle" />
                      </div>
                      <div>
                        <Label className="text-xs">Display Name</Label>
                        <Input value={acc.displayName} onChange={e => updateAccount(acc.id, { displayName: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs">Posts Per Week</Label>
                        <Input type="number" min={1} max={14} value={acc.postsPerWeek} onChange={e => updateAccount(acc.id, { postsPerWeek: parseInt(e.target.value) || 3 })} />
                      </div>
                      <div>
                        <Label className="text-xs">Goal</Label>
                        <Select value={acc.goal} onValueChange={v => updateAccount(acc.id, { goal: v as PlatformAccount['goal'] })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="awareness">Brand Awareness</SelectItem>
                            <SelectItem value="leads">Lead Generation</SelectItem>
                            <SelectItem value="personal_brand">Personal Brand</SelectItem>
                            <SelectItem value="community">Community</SelectItem>
                            <SelectItem value="sales">Sales</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Label className="text-xs">What is this account for?</Label>
                      <Textarea
                        value={acc.contentDescription}
                        onChange={e => updateAccount(acc.id, { contentDescription: e.target.value })}
                        rows={2}
                        placeholder="Describe the purpose and content style for this account..."
                      />
                    </div>
                  </Card>
                ))}
              </div>
              <div>
                <Label className="text-sm mb-2 block">Add Account</Label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(p => (
                    <Button key={p.id} variant="outline" size="sm" onClick={() => addAccount(p.id)}>
                      <Plus className="h-3 w-3 mr-1" /> {p.label}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 4: Integrations */}
          {currentStep === 3 && (
            <>
              <div>
                <Label>CompanyCam API Token</Label>
                <Input
                  value={integrations.companycam?.apiToken || ''}
                  onChange={e => setIntegrations({ ...integrations, companycam: { apiToken: e.target.value } })}
                  placeholder="Your CompanyCam API token (optional)"
                />
                <p className="text-xs text-muted-foreground mt-1">Pull job photos for social content</p>
              </div>
              <div>
                <Label>Weather Location</Label>
                <Input
                  value={integrations.weather?.location || ''}
                  onChange={e => setIntegrations({ ...integrations, weather: { location: e.target.value } })}
                  placeholder="Monroe, Louisiana"
                />
                <p className="text-xs text-muted-foreground mt-1">For weather-aware content suggestions</p>
              </div>
              <div>
                <Label>Google Drive Folder ID (optional)</Label>
                <Input
                  value={integrations.googleDrive?.folderId || ''}
                  onChange={e => setIntegrations({
                    ...integrations,
                    googleDrive: { ...integrations.googleDrive, enabled: true, folderId: e.target.value }
                  })}
                  placeholder="Folder ID for media assets"
                />
              </div>
            </>
          )}

          {/* Step 5: AI Setup */}
          {currentStep === 4 && (
            <>
              <div>
                <Label>AI Provider</Label>
                <Select value={aiProvider} onValueChange={v => setAiProvider(v as AIProvider)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="google">Google AI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>API Key</Label>
                <Input type="password" value={aiKey} onChange={e => setAiKey(e.target.value)} placeholder="sk-..." />
              </div>
              <div>
                <Label>Model (optional)</Label>
                <Input value={aiModel} onChange={e => setAiModel(e.target.value)} placeholder={aiProvider === 'openai' ? 'gpt-4o' : aiProvider === 'anthropic' ? 'claude-sonnet-4-20250514' : 'gemini-pro'} />
                <p className="text-xs text-muted-foreground mt-1">Leave blank for default</p>
              </div>
            </>
          )}

          {/* Step 6: Strategy */}
          {currentStep === 5 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {industry ? `Pre-filled based on ${INDUSTRY_LABELS[industry] || industry} best practices. Customize as needed.` : 'Set your industry in Step 1 for smart suggestions.'}
                </p>
                <Button variant="outline" size="sm" onClick={handleGenerateStrategy} disabled={generatingStrategy || !aiKey}>
                  {generatingStrategy ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                  AI Generate
                </Button>
              </div>

              <div>
                <Label>Content Pillars</Label>
                <div className="space-y-2 mt-2">
                  {pillars.map((p, i) => (
                    <Card key={p.id} className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <Input
                          value={p.name}
                          onChange={e => {
                            const updated = [...pillars]
                            updated[i] = { ...updated[i], name: e.target.value }
                            setPillars(updated)
                          }}
                          className="font-medium text-sm h-8 w-auto"
                        />
                        <button onClick={() => setPillars(pillars.filter((_, j) => j !== i))}>
                          <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                      <Input
                        value={p.description}
                        onChange={e => {
                          const updated = [...pillars]
                          updated[i] = { ...updated[i], description: e.target.value }
                          setPillars(updated)
                        }}
                        className="text-xs h-7"
                        placeholder="Description..."
                      />
                    </Card>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPillars([...pillars, { id: `pillar-${Date.now()}`, name: 'New Pillar', description: '', examples: [] }])}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Pillar
                  </Button>
                </div>
              </div>

              <div>
                <Label>Weekly Posting Schedule</Label>
                <div className="space-y-1 mt-2">
                  {strategySchedule.map((slot, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][slot.dayOfWeek]}</Badge>
                      <span className="text-muted-foreground">{slot.time}</span>
                      <span className="capitalize">{slot.contentType.replace(/_/g, ' ')}</span>
                      {slot.pillar && <span className="text-xs text-muted-foreground">({slot.pillar})</span>}
                      <button onClick={() => setStrategySchedule(strategySchedule.filter((_, j) => j !== i))} className="ml-auto">
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
                {industry && strategySchedule.length === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setStrategySchedule(getIndustryDefaults(industry).weeklySchedule)}
                  >
                    Load {INDUSTRY_LABELS[industry]} Template
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Step 7: Review */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="p-3">
                  <h4 className="text-sm font-semibold mb-2">Business</h4>
                  <p className="text-sm">{businessName}</p>
                  <p className="text-xs text-muted-foreground">{INDUSTRY_LABELS[industry] || industry} -- {city}, {state}</p>
                  <p className="text-xs text-muted-foreground mt-1">{services.length} services</p>
                </Card>
                <Card className="p-3">
                  <h4 className="text-sm font-semibold mb-2">Brand</h4>
                  <div className="flex flex-wrap gap-1">
                    {brandVoice.map(v => <Badge key={v} variant="outline" className="text-[10px] capitalize">{v}</Badge>)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{contentRules.length} content rules</p>
                </Card>
                <Card className="p-3">
                  <h4 className="text-sm font-semibold mb-2">Accounts</h4>
                  {accounts.map(a => (
                    <p key={a.id} className="text-xs">@{a.handle || '(unnamed)'} -- {a.platform} ({a.postsPerWeek}/week)</p>
                  ))}
                  {accounts.length === 0 && <p className="text-xs text-muted-foreground">No accounts added</p>}
                </Card>
                <Card className="p-3">
                  <h4 className="text-sm font-semibold mb-2">AI</h4>
                  <p className="text-sm capitalize">{aiProvider}</p>
                  <p className="text-xs text-muted-foreground">{aiKey ? 'Key configured' : 'No key set'}</p>
                </Card>
                <Card className="p-3 sm:col-span-2">
                  <h4 className="text-sm font-semibold mb-2">Strategy</h4>
                  <div className="flex flex-wrap gap-1">
                    {pillars.map(p => <Badge key={p.id} variant="secondary" className="text-[10px]">{p.name}</Badge>)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{strategySchedule.length} weekly posting slots</p>
                </Card>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleFinish} size="lg" className="flex-1">
                  <Rocket className="h-4 w-4 mr-2" /> Launch Content Command
                </Button>
                <Button onClick={handleGenerateFirstWeek} variant="outline" size="lg">
                  <Sparkles className="h-4 w-4 mr-2" /> Generate First Week
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      {currentStep < 6 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Button onClick={() => setCurrentStep(s => s + 1)} disabled={!canProceed()}>
            Next <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
      {currentStep === 6 && (
        <div className="flex justify-start">
          <Button variant="outline" onClick={() => setCurrentStep(s => s - 1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>
      )}
    </div>
  )
}
