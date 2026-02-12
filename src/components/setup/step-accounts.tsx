'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { allPlatforms, platformAdapters } from '@/lib/platforms'
import type { PlatformAccount, AccountGoal, AccountPersonality, ContentType, BrandVoice } from '@/types'

const personalityOptions: { id: AccountPersonality; label: string; desc: string }[] = [
  { id: 'business', label: 'Business', desc: 'Promote services, share work, drive leads' },
  { id: 'personal', label: 'Personal', desc: 'Your story, your life, behind the scenes' },
  { id: 'both', label: 'Both', desc: 'Mix of business and personal' },
]

const voiceOptions: { id: BrandVoice; label: string }[] = [
  { id: 'professional', label: 'Professional' },
  { id: 'casual', label: 'Casual' },
  { id: 'funny', label: 'Funny' },
  { id: 'educational', label: 'Educational' },
  { id: 'inspirational', label: 'Inspirational' },
  { id: 'bold', label: 'Bold' },
  { id: 'friendly', label: 'Friendly' },
]

const goalOptions: { id: AccountGoal; label: string }[] = [
  { id: 'awareness', label: 'Build Awareness' },
  { id: 'leads', label: 'Drive Leads' },
  { id: 'personal_brand', label: 'Personal Brand' },
  { id: 'community', label: 'Community' },
  { id: 'sales', label: 'Sales' },
  { id: 'education', label: 'Education' },
]

const contentTypeOptions: { id: ContentType; label: string }[] = [
  { id: 'photo', label: '📷 Photos' },
  { id: 'video', label: '🎬 Videos' },
  { id: 'reel', label: '🎞️ Reels' },
  { id: 'text', label: '✍️ Text' },
  { id: 'story', label: '📱 Stories' },
  { id: 'carousel', label: '🎠 Carousel' },
]

interface Props {
  accounts: PlatformAccount[]
  onChange: (accounts: PlatformAccount[]) => void
}

export function StepAccounts({ accounts, onChange }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const getAccount = (platformId: string): PlatformAccount | undefined =>
    accounts.find((a) => a.platform === platformId)

  const togglePlatform = (platformId: string) => {
    const existing = getAccount(platformId)
    if (existing) {
      onChange(
        accounts.map((a) =>
          a.platform === platformId ? { ...a, enabled: !a.enabled } : a
        )
      )
    } else {
      onChange([
        ...accounts,
        {
          id: `${platformId}-${Date.now()}`,
          platform: platformId as PlatformAccount['platform'],
          enabled: true,
          handle: '',
          displayName: '',
          credentials: {},
          goal: 'awareness',
          personality: 'business',
          contentTypes: ['photo', 'text'],
          postsPerWeek: 3,
          bestTimes: ['09:00', '12:00', '18:00'],
          hashtagStrategy: '',
          contentDescription: '',
          sampleTopics: [],
          examplePosts: [],
        },
      ])
    }
  }

  const updateAccount = (platformId: string, updates: Partial<PlatformAccount>) => {
    onChange(
      accounts.map((a) =>
        a.platform === platformId ? { ...a, ...updates } : a
      )
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        Enable the platforms you want to post to. You can configure details for each.
      </p>

      {allPlatforms.map((platformId) => {
        const adapter = platformAdapters[platformId]
        const account = getAccount(platformId)
        const isEnabled = account?.enabled || false
        const isExpanded = expanded === platformId

        return (
          <div
            key={platformId}
            className={cn(
              'rounded-lg border transition-all',
              isEnabled ? 'border-primary/50 bg-primary/5' : 'border-border'
            )}
          >
            <div className="flex items-center gap-3 p-4">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: adapter.color + '20' }}
              >
                {adapter.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium">{adapter.displayName}</p>
                {account?.handle && (
                  <p className="text-xs text-muted-foreground">@{account.handle}</p>
                )}
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={() => togglePlatform(platformId)}
              />
              {isEnabled && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpanded(isExpanded ? null : platformId)}
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              )}
            </div>

            {isEnabled && isExpanded && account && (
              <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Account Handle</Label>
                    <Input
                      value={account.handle}
                      onChange={(e) => updateAccount(platformId, { handle: e.target.value })}
                      placeholder="@handle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input
                      value={account.displayName}
                      onChange={(e) => updateAccount(platformId, { displayName: e.target.value })}
                      placeholder="Display name"
                    />
                  </div>
                </div>

                {/* Credentials */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">API Credentials</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {adapter.getCredentialFields().map((field) => (
                      <div key={field.key} className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{field.label}</Label>
                        <Input
                          type={field.type}
                          value={account.credentials[field.key] || ''}
                          onChange={(e) =>
                            updateAccount(platformId, {
                              credentials: { ...account.credentials, [field.key]: e.target.value },
                            })
                          }
                          placeholder={field.label}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Goal */}
                <div className="space-y-2">
                  <Label>Account Goal</Label>
                  <div className="flex flex-wrap gap-2">
                    {goalOptions.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => updateAccount(platformId, { goal: g.id })}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs border transition-all',
                          account.goal === g.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Personality */}
                <div className="space-y-2">
                  <Label>Account Personality</Label>
                  <p className="text-xs text-muted-foreground">What kind of content is this account for?</p>
                  <div className="grid grid-cols-3 gap-2">
                    {personalityOptions.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => updateAccount(platformId, { personality: p.id })}
                        className={cn(
                          'p-3 rounded-lg border text-left transition-all',
                          account.personality === p.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <p className="text-sm font-medium">{p.label}</p>
                        <p className="text-xs text-muted-foreground">{p.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voice Override */}
                <div className="space-y-2">
                  <Label>Voice / Tone for This Account</Label>
                  <p className="text-xs text-muted-foreground">Override the business voice for this specific account</p>
                  <div className="flex flex-wrap gap-2">
                    {voiceOptions.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => {
                          const current = account.voiceOverride || []
                          const updated = current.includes(v.id)
                            ? current.filter((x) => x !== v.id)
                            : [...current, v.id]
                          updateAccount(platformId, { voiceOverride: updated })
                        }}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs border transition-all',
                          (account.voiceOverride || []).includes(v.id)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Description */}
                <div className="space-y-2">
                  <Label>What is this account about?</Label>
                  <p className="text-xs text-muted-foreground">Describe in your own words what kind of content goes here. Be specific — the AI uses this to generate unique content for this account.</p>
                  <Textarea
                    value={account.contentDescription}
                    onChange={(e) => updateAccount(platformId, { contentDescription: e.target.value })}
                    placeholder="e.g., 'Weekly life updates — what I'm building, lessons learned, behind the scenes of running a business at 21. Real stories, not polished corporate content.'"
                    rows={3}
                  />
                </div>

                {/* Sample Topics */}
                <div className="space-y-2">
                  <Label>Sample Topics</Label>
                  <p className="text-xs text-muted-foreground">Add topics you want to post about on this account</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(account.sampleTopics || []).map((topic, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20 flex items-center gap-1"
                      >
                        {topic}
                        <button
                          onClick={() =>
                            updateAccount(platformId, {
                              sampleTopics: account.sampleTopics.filter((_, j) => j !== i),
                            })
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <Input
                    placeholder="Type a topic and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                        e.preventDefault()
                        updateAccount(platformId, {
                          sampleTopics: [...(account.sampleTopics || []), (e.target as HTMLInputElement).value.trim()],
                        })
                        ;(e.target as HTMLInputElement).value = ''
                      }
                    }}
                  />
                </div>

                {/* Example Posts */}
                <div className="space-y-2">
                  <Label>Example Posts</Label>
                  <p className="text-xs text-muted-foreground">Paste real posts that capture the voice you want. The AI will study these and match your style.</p>
                  {(account.examplePosts || []).map((post: string, i: number) => (
                    <div key={i} className="relative bg-muted/50 rounded-lg p-3 pr-8 text-sm">
                      <p className="whitespace-pre-wrap">{post}</p>
                      <button
                        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          updateAccount(platformId, {
                            examplePosts: (account.examplePosts || []).filter((_: string, j: number) => j !== i),
                          })
                        }
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <Textarea
                    placeholder="Paste an example post here and press Ctrl+Enter to add it"
                    rows={4}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && (e.target as HTMLTextAreaElement).value.trim()) {
                        e.preventDefault()
                        updateAccount(platformId, {
                          examplePosts: [...(account.examplePosts || []), (e.target as HTMLTextAreaElement).value.trim()],
                        })
                        ;(e.target as HTMLTextAreaElement).value = ''
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Press Ctrl+Enter to add</p>
                </div>

                {/* Content Types */}
                <div className="space-y-2">
                  <Label>Content Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {contentTypeOptions.map((ct) => (
                      <button
                        key={ct.id}
                        onClick={() => {
                          const types = account.contentTypes.includes(ct.id)
                            ? account.contentTypes.filter((t) => t !== ct.id)
                            : [...account.contentTypes, ct.id]
                          updateAccount(platformId, { contentTypes: types })
                        }}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs border transition-all',
                          account.contentTypes.includes(ct.id)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        {ct.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frequency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Posts per Week</Label>
                    <Input
                      type="number"
                      min={1}
                      max={21}
                      value={account.postsPerWeek}
                      onChange={(e) => updateAccount(platformId, { postsPerWeek: parseInt(e.target.value) || 3 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hashtag Strategy</Label>
                    <Input
                      value={account.hashtagStrategy}
                      onChange={(e) => updateAccount(platformId, { hashtagStrategy: e.target.value })}
                      placeholder="e.g., mix of local + industry tags"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
