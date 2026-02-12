'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { X, Plus } from 'lucide-react'
import type { BusinessConfig, BrandVoice } from '@/types'

const industries = [
  'Landscaping & Lawn Care', 'HVAC', 'Plumbing', 'Electrical', 'Roofing',
  'General Contracting', 'Cleaning Services', 'Pest Control', 'Real Estate',
  'Fitness & Wellness', 'Restaurant & Food', 'Retail', 'E-commerce',
  'SaaS / Tech', 'Consulting', 'Healthcare', 'Education', 'Other',
]

const voiceOptions: { id: BrandVoice; label: string; emoji: string }[] = [
  { id: 'professional', label: 'Professional', emoji: '👔' },
  { id: 'casual', label: 'Casual', emoji: '😎' },
  { id: 'funny', label: 'Funny', emoji: '😂' },
  { id: 'educational', label: 'Educational', emoji: '📚' },
  { id: 'inspirational', label: 'Inspirational', emoji: '💪' },
  { id: 'bold', label: 'Bold', emoji: '🔥' },
  { id: 'friendly', label: 'Friendly', emoji: '🤝' },
]

interface Props {
  config: BusinessConfig
  onChange: (config: BusinessConfig) => void
}

export function StepBusiness({ config, onChange }: Props) {
  const [newService, setNewService] = useState('')
  const [newRule, setNewRule] = useState('')

  const addService = () => {
    if (newService.trim() && !config.services.includes(newService.trim())) {
      onChange({ ...config, services: [...config.services, newService.trim()] })
      setNewService('')
    }
  }

  const addRule = () => {
    if (newRule.trim() && !config.contentRules.includes(newRule.trim())) {
      onChange({ ...config, contentRules: [...config.contentRules, newRule.trim()] })
      setNewRule('')
    }
  }

  const toggleVoice = (voice: BrandVoice) => {
    const voices = config.brandVoice.includes(voice)
      ? config.brandVoice.filter((v) => v !== voice)
      : [...config.brandVoice, voice]
    onChange({ ...config, brandVoice: voices })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Business Name *</Label>
          <Input
            value={config.name}
            onChange={(e) => onChange({ ...config, name: e.target.value })}
            placeholder="e.g., College Bros LLC"
          />
        </div>
        <div className="space-y-2">
          <Label>Industry</Label>
          <select
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            value={config.industry}
            onChange={(e) => onChange({ ...config, industry: e.target.value })}
          >
            <option value="">Select industry...</option>
            {industries.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
      </div>

      {config.industry === 'Other' && (
        <div className="space-y-2">
          <Label>Custom Industry</Label>
          <Input
            value={config.customIndustry || ''}
            onChange={(e) => onChange({ ...config, customIndustry: e.target.value })}
            placeholder="Describe your industry"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>City</Label>
          <Input
            value={config.location.city}
            onChange={(e) => onChange({ ...config, location: { ...config.location, city: e.target.value } })}
            placeholder="e.g., Monroe"
          />
        </div>
        <div className="space-y-2">
          <Label>State</Label>
          <Input
            value={config.location.state}
            onChange={(e) => onChange({ ...config, location: { ...config.location, state: e.target.value } })}
            placeholder="e.g., Louisiana"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Services Offered</Label>
        <div className="flex gap-2">
          <Input
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
            placeholder="Add a service..."
          />
          <Button variant="outline" size="icon" onClick={addService}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {config.services.map((s) => (
            <Badge key={s} variant="secondary" className="gap-1">
              {s}
              <button onClick={() => onChange({ ...config, services: config.services.filter((x) => x !== s) })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Target Audience</Label>
        <Textarea
          value={config.targetAudience}
          onChange={(e) => onChange({ ...config, targetAudience: e.target.value })}
          placeholder="Describe your ideal customer... (e.g., homeowners aged 30-55 in Northeast Louisiana)"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Brand Voice & Tone (select all that apply)</Label>
        <div className="flex flex-wrap gap-2">
          {voiceOptions.map((v) => (
            <button
              key={v.id}
              onClick={() => toggleVoice(v.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all',
                config.brandVoice.includes(v.id)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <span>{v.emoji}</span>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>What Makes You Different (USP)</Label>
        <Textarea
          value={config.usp}
          onChange={(e) => onChange({ ...config, usp: e.target.value })}
          placeholder="What sets you apart from competitors?"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Content Rules</Label>
        <p className="text-xs text-muted-foreground">Things the AI should never do in your content</p>
        <div className="flex gap-2">
          <Input
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
            placeholder='e.g., "no emojis", "never mention pricing"'
          />
          <Button variant="outline" size="icon" onClick={addRule}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {config.contentRules.map((r) => (
            <Badge key={r} variant="outline" className="gap-1 text-orange-400 border-orange-400/30">
              🚫 {r}
              <button onClick={() => onChange({ ...config, contentRules: config.contentRules.filter((x) => x !== r) })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
