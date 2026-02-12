'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check, ArrowRight, ArrowLeft, Zap } from 'lucide-react'
import { useConfigStore } from '@/lib/store/config'
import { useClientStore } from '@/lib/store/clients'
import { StepAIProvider } from '@/components/setup/step-ai'
import { StepBusiness } from '@/components/setup/step-business'
import { StepAccounts } from '@/components/setup/step-accounts'
import { StepStrategy } from '@/components/setup/step-strategy'
import { StepIntegrations } from '@/components/setup/step-integrations'
import type { AIConfig, BusinessConfig, PlatformAccount, ContentStrategy, IntegrationsConfig } from '@/types'

const steps = [
  { id: 'ai', label: 'AI Provider', description: 'Connect your AI' },
  { id: 'business', label: 'Your Business', description: 'Tell us about you' },
  { id: 'accounts', label: 'Accounts', description: 'Social platforms' },
  { id: 'strategy', label: 'Strategy', description: 'AI-generated plan' },
  { id: 'integrations', label: 'Integrations', description: 'Optional extras' },
]

export default function SetupPage() {
  const router = useRouter()
  const { getConfig, setConfig } = useConfigStore()
  const { currentClientId } = useClientStore()
  const config = getConfig()
  const [currentStep, setCurrentStep] = useState(0)
  const [mounted, setMounted] = useState(false)

  const [aiConfig, setAiConfig] = useState<AIConfig>(
    config?.ai || { provider: 'openai', apiKey: '' }
  )
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig>(
    config?.business || {
      name: 'College Bros Outdoor Services',
      industry: 'landscaping',
      location: { city: 'Monroe', state: 'Louisiana' },
      services: ['Landscaping', 'Lawn Care', 'Mowing', 'Bed Maintenance', 'Mulch Installation', 'Hedge Trimming', 'Pressure Washing', 'Soft Washing', 'Christmas Lights', 'Storm Cleanup', 'Leaf Cleanup', 'Junk Removal'],
      targetAudience: 'Homeowners in Monroe, West Monroe, and Sterlington, Louisiana. Middle to upper-middle class residential properties. Dual income families too busy for yard work, older homeowners who physically can\'t, and new homeowners without equipment.',
      brandVoice: ['professional', 'friendly', 'casual'],
      usp: 'Student-run, fully insured outdoor service company with multiple crews. Founded by a college entrepreneur at ULM. 4.9 stars on Google with 47 reviews. Professional results, local crew, fair prices.',
      contentRules: ['No emojis ever', 'Never mention specific crew or employee numbers', 'No client addresses posted publicly', 'Never post about pricing publicly', 'No cocky or condescending tone', 'Never reuse images across posts', 'No corporate speak', 'Links typed out not embedded', 'Never claim to be the best or cheapest'],
    }
  )
  const [accounts, setAccounts] = useState<PlatformAccount[]>(config?.accounts || [
    {
      id: 'ig-collegebros',
      platform: 'instagram',
      enabled: true,
      handle: 'collegebros31',
      displayName: 'College Bros Outdoor Services',
      credentials: {
        businessAccountId: '',
        pageAccessToken: '',
      },
      goal: 'awareness',
      personality: 'business',
      contentTypes: ['photo', 'reel', 'carousel'],
      postsPerWeek: 5,
      bestTimes: ['09:00', '12:00', '17:00'],
      hashtagStrategy: 'Max 5-8 hyperlocal hashtags: Monroe LA, West Monroe, Ouachita Parish, NELouisiana, etc.',
      contentDescription: 'Before/after job photos, crew at work, finished projects, seasonal service promos. Show the work, build trust, drive local leads.',
      sampleTopics: ['Before and after transformations', 'Seasonal tips', 'Crew spotlight', 'New service announcements', 'Customer testimonials', 'Job site shots'],
      examplePosts: [],
    },
    {
      id: 'ig-connor',
      platform: 'instagram',
      enabled: true,
      handle: '',
      displayName: 'Connor Pauley',
      credentials: {
        businessAccountId: '',
        pageAccessToken: '',
      },
      goal: 'personal_brand',
      personality: 'personal',
      voiceOverride: ['casual', 'inspirational'],
      contentTypes: ['photo', 'reel', 'story'],
      postsPerWeek: 3,
      bestTimes: ['08:00', '18:00'],
      hashtagStrategy: 'Entrepreneur, young CEO, college life, business growth — mix of personal and industry tags',
      contentDescription: 'Weekly life updates — what I\'m building, what I\'m learning, behind the scenes of running a business at 21. Real stories, not polished corporate content. College life, ski team, growing a company, lessons learned.',
      sampleTopics: ['Week recap', 'Lessons from running a business in college', 'Behind the scenes with the crew', 'Ski team life', 'Wins and failures', 'What I\'m working on this week'],
      examplePosts: [
        'Saturday night thought: a year ago I was mowing lawns by myself between classes. Now we have multiple people on the team and more work than we can handle.\n\nNot bragging. Just grateful. And still figuring it out every single day.\n\nIf you are building something on the side while in school -- keep going. It compounds faster than you think.',
        'Sunday prep day.\n\nEvery Saturday night we inventory every piece of equipment, top off fluids, sharpen blades, and build the supply list for Monday.\n\nIt is the most boring part of running a service company and also the reason we never show up to a job missing something.\n\nThe unglamorous stuff is what separates companies that last from companies that don\'t.',
        'Monday morning dispatch: 3 crews rolling out before most people hit snooze. February is slow season for a lot of landscaping companies. Not us. We use this time to lock in spring contracts while everyone else is waiting for the phone to ring. The companies that win in April started hustling in February.',
      ],
    },
    {
      id: 'fb-collegebros',
      platform: 'facebook',
      enabled: true,
      handle: 'Collegebrosllc',
      displayName: 'College Bros Outdoor Services',
      credentials: {
        pageId: '',
        pageAccessToken: '',
      },
      goal: 'community',
      personality: 'business',
      contentTypes: ['photo', 'video', 'text'],
      postsPerWeek: 4,
      bestTimes: ['09:00', '12:00', '18:00'],
      hashtagStrategy: 'Light — 2-3 max. Focus on engaging captions that get shares and comments.',
      contentDescription: 'Community-focused business content. Job photos, helpful tips for homeowners, local engagement. Write for shares and comments, not just likes.',
      sampleTopics: ['Before and after transformations', 'Homeowner tips', 'Seasonal reminders', 'Community involvement', 'Service highlights'],
      examplePosts: [],
    },
    {
      id: 'li-connor',
      platform: 'linkedin',
      enabled: true,
      handle: 'connor-pauley-b427443ab',
      displayName: 'Connor Pauley',
      credentials: {
        accessToken: '',
        personUrn: '',
      },
      goal: 'personal_brand',
      personality: 'personal',
      voiceOverride: ['professional', 'inspirational'],
      contentTypes: ['text', 'photo'],
      postsPerWeek: 2,
      bestTimes: ['07:30', '12:00'],
      hashtagStrategy: '3-5 industry tags: #landscaping #entrepreneurship #homeservices #youngentrepreneur #businessgrowth',
      contentDescription: 'Thought leadership and personal journey. Building a company in college, scaling to multiple crews, lessons in leadership, hiring, operations. Longer form, more reflective. This is the professional story of building College Bros.',
      sampleTopics: ['Scaling from 1 to 27 employees', 'Lessons in hiring college students', 'What I learned this week running a company', 'Business growth milestones', 'Advice for young entrepreneurs', 'Operations and systems thinking'],
      examplePosts: [
        'I started a landscaping company in college because I needed gas money. Bought a mower, posted on Nextdoor, and hoped somebody called.\n\nThree years later, College Bros Outdoor Services has 27 employees running crews across Monroe, Louisiana. I genuinely have no idea how that happened.\n\nAlong the way I learned that every CRM in our industry was either $500/month or a spreadsheet someone\'s uncle made in 2012. So I built my own — an AI-powered tool called Apex Pro.\n\nI\'m 21, still in school at ULM, and most days I\'m dispatching crews between classes while pretending to pay attention in Accounting.\n\nI\'m going to start sharing what it\'s actually like to build a business in college. The wins, the embarrassing mistakes, and everything in between.\n\nIf you\'re in the service industry or just like watching someone figure it out in real time — stick around. It should be entertaining at minimum.',
        'Saturday night thought: a year ago I was mowing lawns by myself between classes. Now we have multiple people on the team and more work than we can handle.\n\nNot bragging. Just grateful. And still figuring it out every single day.\n\nIf you are building something on the side while in school -- keep going. It compounds faster than you think.',
        'Monday morning dispatch: 3 crews rolling out before most people hit snooze. February is slow season for a lot of landscaping companies. Not us. We use this time to lock in spring contracts while everyone else is waiting for the phone to ring. The companies that win in April started hustling in February.',
      ],
    },
    {
      id: 'tw-connor',
      platform: 'twitter',
      enabled: true,
      handle: 'pauley_connor',
      displayName: 'Connor Pauley',
      credentials: {
        bearerToken: '',
        consumerKey: '',
        consumerSecret: '',
        accessToken: '',
        accessTokenSecret: '',
      },
      goal: 'personal_brand',
      personality: 'personal',
      voiceOverride: ['casual', 'bold'],
      contentTypes: ['text', 'photo'],
      postsPerWeek: 3,
      bestTimes: ['08:00', '12:00', '20:00'],
      hashtagStrategy: 'Minimal — 1-2 max. Twitter is about the take, not the tags.',
      contentDescription: 'Quick takes, real-time thoughts, hot takes on business and life. Short, punchy, authentic. What\'s on my mind right now. This is the raw, unfiltered Connor.',
      sampleTopics: ['Quick business observations', 'Real-time updates on what I\'m doing', 'Hot takes on entrepreneurship', 'College life moments', 'Things I learned today', 'Shoutouts and engagement'],
      examplePosts: [
        'I\'m 21, I run a landscaping company with 27 employees, and I just built an AI-powered CRM from scratch. Here\'s how that happened:',
        'Monday morning dispatch: 3 crews rolling out before most people hit snooze. February is slow season for a lot of landscaping companies. Not us. We use this time to lock in spring contracts while everyone else is waiting for the phone to ring. The companies that win in April started hustling in February.',
        'Sunday prep day.\n\nEvery Saturday night we inventory every piece of equipment, top off fluids, sharpen blades, and build the supply list for Monday.\n\nIt is the most boring part of running a service company and also the reason we never show up to a job missing something.\n\nThe unglamorous stuff is what separates companies that last from companies that don\'t.',
      ],
    },
  ])
  const [strategy, setStrategy] = useState<ContentStrategy | undefined>(config?.strategy)
  const [integrations, setIntegrations] = useState<IntegrationsConfig>(config?.integrations || {
    companycam: { apiToken: '' },
    weather: { location: 'Monroe, Louisiana' },
  })

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const handleFinish = () => {
    if (!currentClientId) {
      alert('No client selected. Please select a client first.')
      return
    }
    
    const now = new Date().toISOString()
    setConfig({
      clientId: currentClientId,
      ai: aiConfig,
      business: businessConfig,
      accounts,
      strategy,
      integrations,
      setupComplete: true,
      createdAt: config?.createdAt || now,
      updatedAt: now,
    })
    router.push('/')
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: return aiConfig.apiKey.length > 0
      case 1: return businessConfig.name.length > 0
      default: return true
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Content Command Setup</h1>
          <p className="text-muted-foreground text-sm">Step {currentStep + 1} of {steps.length}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {steps.map((step, i) => (
          <button
            key={step.id}
            onClick={() => i < currentStep && setCurrentStep(i)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
              i === currentStep && 'bg-primary text-primary-foreground',
              i < currentStep && 'bg-primary/20 text-primary cursor-pointer',
              i > currentStep && 'bg-muted text-muted-foreground'
            )}
          >
            {i < currentStep ? (
              <Check className="h-4 w-4" />
            ) : (
              <span className="h-5 w-5 rounded-full border flex items-center justify-center text-xs">
                {i + 1}
              </span>
            )}
            <span className="hidden sm:inline">{step.label}</span>
          </button>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{steps[currentStep].label}</CardTitle>
          <p className="text-muted-foreground">{steps[currentStep].description}</p>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && <StepAIProvider config={aiConfig} onChange={setAiConfig} />}
          {currentStep === 1 && <StepBusiness config={businessConfig} onChange={setBusinessConfig} />}
          {currentStep === 2 && <StepAccounts accounts={accounts} onChange={setAccounts} />}
          {currentStep === 3 && (
            <StepStrategy
              aiConfig={aiConfig}
              business={businessConfig}
              accounts={accounts}
              strategy={strategy}
              onChange={setStrategy}
            />
          )}
          {currentStep === 4 && <StepIntegrations config={integrations} onChange={setIntegrations} />}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button onClick={() => setCurrentStep((s) => s + 1)} disabled={!canProceed()}>
            Next <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleFinish}>Launch Content Command 🚀</Button>
        )}
      </div>
    </div>
  )
}
