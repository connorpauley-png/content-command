'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Loader2, Sparkles, RefreshCw, X, Plus } from 'lucide-react'
import type { AIConfig, BusinessConfig, PlatformAccount, ContentStrategy, ContentPillar } from '@/types'
import { platformAdapters } from '@/lib/platforms'

interface Props {
  aiConfig: AIConfig
  business: BusinessConfig
  accounts: PlatformAccount[]
  strategy?: ContentStrategy
  onChange: (strategy: ContentStrategy) => void
}

export function StepStrategy({ aiConfig, business, accounts, strategy, onChange }: Props) {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enabledAccounts = accounts.filter((a) => a.enabled)

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/setup/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiConfig, business, accounts: enabledAccounts }),
      })
      if (!res.ok) throw new Error('Failed to generate strategy')
      const data = await res.json()
      onChange(data.strategy)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate strategy')
    }
    setGenerating(false)
  }

  const updatePillar = (index: number, updates: Partial<ContentPillar>) => {
    if (!strategy) return
    const pillars = [...strategy.pillars]
    pillars[index] = { ...pillars[index], ...updates }
    onChange({ ...strategy, pillars })
  }

  const removePillar = (index: number) => {
    if (!strategy) return
    onChange({ ...strategy, pillars: strategy.pillars.filter((_, i) => i !== index) })
  }

  const addPillar = () => {
    if (!strategy) return
    onChange({
      ...strategy,
      pillars: [...strategy.pillars, { id: `pillar-${Date.now()}`, name: '', description: '', examples: [] }],
    })
  }

  return (
    <div className="space-y-6">
      {!strategy ? (
        <div className="text-center py-8">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Generate Your Content Strategy</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            Based on your business info and accounts, our AI will create a tailored content
            strategy with pillars, sample posts, and a posting calendar.
          </p>
          <Button onClick={handleGenerate} disabled={generating || enabledAccounts.length === 0} size="lg">
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Strategy...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Strategy
              </>
            )}
          </Button>
          {enabledAccounts.length === 0 && (
            <p className="text-xs text-orange-400 mt-2">Enable at least one account first</p>
          )}
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Your Content Strategy</h3>
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-1">Regenerate</span>
            </Button>
          </div>

          {/* Strategy Document */}
          <div className="space-y-2">
            <Label>Strategy Overview</Label>
            <Textarea
              value={strategy.document}
              onChange={(e) => onChange({ ...strategy, document: e.target.value })}
              rows={6}
              className="text-sm"
            />
          </div>

          {/* Content Pillars */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Content Pillars</Label>
              <Button variant="ghost" size="sm" onClick={addPillar}>
                <Plus className="h-4 w-4 mr-1" /> Add Pillar
              </Button>
            </div>
            {strategy.pillars.map((pillar, i) => (
              <Card key={pillar.id} className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={pillar.name}
                    onChange={(e) => updatePillar(i, { name: e.target.value })}
                    placeholder="Pillar name"
                    className="font-medium"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removePillar(i)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={pillar.description}
                  onChange={(e) => updatePillar(i, { description: e.target.value })}
                  placeholder="What this pillar covers..."
                  rows={2}
                  className="text-sm"
                />
                <div className="flex flex-wrap gap-1">
                  {pillar.examples.map((ex, j) => (
                    <Badge key={j} variant="secondary" className="text-xs">
                      {ex}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {/* Sample Posts */}
          {strategy.samplePosts.length > 0 && (
            <div className="space-y-3">
              <Label>Sample Posts</Label>
              {strategy.samplePosts.map((sp, i) => {
                const account = accounts.find((a) => a.id === sp.accountId)
                const adapter = account ? platformAdapters[account.platform] : null
                return (
                  <div key={i} className="p-3 rounded-lg border border-border text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{adapter?.icon}</span>
                      <Badge variant="outline" className="text-xs">{sp.pillar}</Badge>
                    </div>
                    <p className="text-muted-foreground">{sp.content}</p>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
