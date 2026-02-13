'use client'

import { useState, useEffect } from 'react'
import { useConfigStore, usePostsStore } from '@/lib/store/config'
import { useClientStore } from '@/lib/store/clients'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Loader2, Check, X, ChevronDown, ChevronUp, ArrowRight, Image, Layout, Camera, Video, FileText, Zap, CalendarDays, Target } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { Post, ContentType } from '@/types'

interface Idea {
  concept: string
  hook: string
  pillar?: string
  format: { contentType: string; reason: string }
  assetRecommendation: { type: string; description: string; reason: string }
  engagementPotential: string
  engagementReason: string
  approved?: boolean
  building?: boolean
  built?: boolean
  builtPost?: Post & { assetNotes?: string; platformTips?: string; imagePrompt?: string }
  _accountId?: string
  _accountHandle?: string
  _platform?: string
}

const ASSET_ICONS: Record<string, typeof Image> = {
  graphic_template: Layout,
  ai_photo: Sparkles,
  real_photo: Camera,
  companycam: Camera,
  video_clip: Video,
  no_media: FileText,
}

const ENGAGEMENT_COLORS: Record<string, string> = {
  high: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export default function IdeasPage() {
  const { addPost } = usePostsStore()
  const currentClientId = useClientStore(s => s.currentClientId)
  const configs = useConfigStore(s => s.configs)
  const [hydrated, setHydrated] = useState(false)
  
  useEffect(() => {
    // Wait for both stores to hydrate from localStorage
    const checkHydration = () => {
      const clientHydrated = useClientStore.persist?.hasHydrated?.() ?? true
      const configHydrated = useConfigStore.persist?.hasHydrated?.() ?? true
      if (clientHydrated && configHydrated) {
        setHydrated(true)
      }
    }
    checkHydration()
    // Also subscribe to rehydration
    const unsub1 = useClientStore.persist?.onFinishHydration?.(() => checkHydration())
    const unsub2 = useConfigStore.persist?.onFinishHydration?.(() => checkHydration())
    // Fallback timeout
    const t = setTimeout(() => setHydrated(true), 500)
    return () => { unsub1?.(); unsub2?.(); clearTimeout(t) }
  }, [])
  
  const clientId = currentClientId
  const config = clientId ? configs[clientId] || null : null

  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [theme, setTheme] = useState('')
  const [count, setCount] = useState('10')
  const [loading, setLoading] = useState(false)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [error, setError] = useState<string | null>(null)
  const [expandedIdea, setExpandedIdea] = useState<number | null>(null)

  const enabledAccounts = config?.accounts?.filter(a => a.enabled) ?? []

  const handleGenerate = async () => {
    if (!config || !selectedAccount) return
    setLoading(true)
    setError(null)
    setIdeas([])

    try {
      const res = await fetch('/api/generate/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          accountId: selectedAccount,
          count: parseInt(count),
          theme: theme || undefined,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setIdeas(data.ideas.map((i: Idea) => ({ ...i, approved: false, building: false, built: false })))
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate ideas')
    }
    setLoading(false)
  }

  const toggleApprove = (idx: number) => {
    setIdeas(prev => prev.map((idea, i) => i === idx ? { ...idea, approved: !idea.approved } : idea))
  }

  const buildPost = async (idx: number) => {
    if (!config) return
    const idea = ideas[idx]
    setIdeas(prev => prev.map((i, j) => j === idx ? { ...i, building: true } : i))

    try {
      const res = await fetch('/api/generate/build-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          accountId: idea._accountId || selectedAccount,
          idea: {
            concept: idea.concept,
            hook: idea.hook,
            pillar: idea.pillar,
            format: idea.format,
            assetRecommendation: idea.assetRecommendation,
          },
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setIdeas(prev => prev.map((i, j) => j === idx ? { ...i, building: false } : i))
      } else {
        setIdeas(prev => prev.map((i, j) => j === idx ? {
          ...i,
          building: false,
          built: true,
          builtPost: {
            ...data.post,
            assetNotes: data.assetNotes,
            platformTips: data.platformTips,
            imagePrompt: data.imagePrompt,
          },
        } : i))
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to build post')
      setIdeas(prev => prev.map((i, j) => j === idx ? { ...i, building: false } : i))
    }
  }

  const buildAllApproved = async () => {
    const approvedIdxs = ideas.map((idea, idx) => idea.approved && !idea.built ? idx : -1).filter(i => i >= 0)
    for (const idx of approvedIdxs) {
      await buildPost(idx)
    }
  }

  const addToPipeline = (idx: number) => {
    const idea = ideas[idx]
    if (!clientId) return
    const accountId = idea._accountId || selectedAccount
    const account = enabledAccounts.find(a => a.id === accountId)

    const assetType = idea.assetRecommendation?.type || 'no_media'
    
    // Smart routing: determine where post lands based on what it has/needs
    const getSmartStatus = (hasCaption: boolean, asset: string): Post['status'] => {
      if (!hasCaption) return 'idea'
      if (asset === 'no_media' || asset === 'text') return 'review'
      if (asset === 'graphic_template') return 'review' // template auto-renders
      if (asset === 'ai_photo') return 'needs_photos' // needs generation
      if (asset === 'real_photo' || asset === 'companycam' || asset === 'video_clip') return 'needs_photos'
      return 'review'
    }

    if (idea.built && idea.builtPost) {
      // Post already has assetType, assetNotes, imagePrompt baked in from build-post API
      addPost({
        ...idea.builtPost,
        clientId,
        status: 'idea', // always start in Ideas, Auto-Move sorts them
      })
    } else {
      const status = getSmartStatus(false, assetType)
      addPost({
        id: crypto.randomUUID(),
        clientId,
        accountId,
        platform: (account?.platform || 'instagram') as Post['platform'],
        contentType: (idea.format?.contentType || 'text') as ContentType,
        status,
        content: `${idea.hook}\n\n[Concept: ${idea.concept}]`,
        mediaUrls: [],
        hashtags: [],
        pillar: idea.pillar,
        aiGenerated: true,
        assetType: assetType as Post['assetType'],
        assetNotes: idea.assetRecommendation?.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    setIdeas(prev => prev.map((i, j) => j === idx ? { ...i, addedToPipeline: true } as Idea : i))
  }

  const addAllToPipeline = () => {
    ideas.forEach((idea, idx) => {
      if (idea.approved && !(idea as any).addedToPipeline) addToPipeline(idx)
    })
  }

  const approvedCount = ideas.filter(i => i.approved).length
  const builtCount = ideas.filter(i => i.built).length

  // Pillar balance — count ideas per pillar
  const pillars = config?.strategy?.pillars || []
  const pillarCounts: Record<string, number> = {}
  ideas.forEach(idea => {
    const p = idea.pillar || 'Uncategorized'
    pillarCounts[p] = (pillarCounts[p] || 0) + 1
  })
  const totalIdeas = ideas.length
  const idealPerPillar = pillars.length > 0 ? Math.ceil(totalIdeas / pillars.length) : 0

  // Weekly goal tracker
  const selectedAccountData = enabledAccounts.find(a => a.id === selectedAccount)
  const weeklyGoal = selectedAccountData?.postsPerWeek || 5
  const pipelinePosts = usePostsStore.getState().posts.filter(
    p => p.clientId === clientId && p.accountId === selectedAccount
  )
  const postsThisWeek = pipelinePosts.length // simplified — count all in pipeline for this account
  const postsNeeded = Math.max(0, weeklyGoal - postsThisWeek)

  // Fill My Week — generate enough for selected account
  const handleFillWeek = async () => {
    if (!config || !selectedAccount || postsNeeded <= 0) return
    setLoading(true)
    setError(null)
    setIdeas([])

    try {
      const res = await fetch('/api/generate/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          accountId: selectedAccount,
          count: Math.max(postsNeeded + 3, 8),
          theme: theme || undefined,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setIdeas(data.ideas.map((i: Idea) => ({ ...i, approved: false, building: false, built: false })))
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate ideas')
    }
    setLoading(false)
  }

  // Fill ALL accounts
  const [fillingAll, setFillingAll] = useState(false)
  const allAccountGoals = enabledAccounts.map(acc => {
    const accPosts = usePostsStore.getState().posts.filter(
      p => p.clientId === clientId && p.accountId === acc.id
    )
    const goal = acc.postsPerWeek || 5
    const have = accPosts.length
    const need = Math.max(0, goal - have)
    return { ...acc, goal, have, need }
  })
  const totalNeeded = allAccountGoals.reduce((sum, a) => sum + a.need, 0)

  const handleFillAll = async () => {
    if (!config || totalNeeded <= 0) return
    setFillingAll(true)
    setError(null)
    setIdeas([])

    const accountsToFill = allAccountGoals.filter(a => a.need > 0)
    
    // Fire all accounts in parallel
    const results = await Promise.allSettled(
      accountsToFill.map(async (acc) => {
        const res = await fetch('/api/generate/ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config,
            accountId: acc.id,
            count: Math.max(acc.need + 2, 5),
            theme: theme || undefined,
          }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        return data.ideas.map((i: Idea) => ({
          ...i,
          approved: false,
          building: false,
          built: false,
          _accountId: acc.id,
          _accountHandle: acc.handle,
          _platform: acc.platform,
        }))
      })
    )

    const allIdeas: Idea[] = []
    for (const r of results) {
      if (r.status === 'fulfilled') allIdeas.push(...r.value)
    }

    setIdeas(allIdeas)
    setFillingAll(false)
    if (allIdeas.length === 0) setError('Failed to generate ideas for any account')
  }

  if (!hydrated) {
    return <div className="p-6 flex items-center justify-center min-h-[400px]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  if (!clientId || !config) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Client Selected</h2>
          <p className="text-muted-foreground mb-4">Select a client from the sidebar to start generating ideas.</p>
          <Button asChild><a href="/clients">Manage Clients</a></Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Content Ideas</h1>
        <p className="text-muted-foreground mt-1">Generate ideas, approve the good ones, then build them into full posts.</p>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm mb-1 block">Account</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger><SelectValue placeholder="Pick account" /></SelectTrigger>
                <SelectContent>
                  {enabledAccounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>@{a.handle} ({a.platform})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm mb-1 block">Theme / Direction (optional)</Label>
              <Input
                value={theme}
                onChange={e => setTheme(e.target.value)}
                placeholder="e.g. spring marketing, hot takes about landscaping, personal brand..."
              />
            </div>
            <div>
              <Label className="text-sm mb-1 block">How many</Label>
              <Select value={count} onValueChange={setCount}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['5', '10', '15', '20'].map(n => (
                    <SelectItem key={n} value={n}>{n} ideas</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!selectedAccount || loading}
            className="w-full"
          >
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Ideas...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Ideas</>}
          </Button>
        </CardContent>
      </Card>

      {/* All Accounts Goal Overview + Fill All */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Weekly Goals</span>
            </div>
            {totalNeeded > 0 && (
              <Button
                onClick={handleFillAll}
                disabled={fillingAll || loading}
                size="sm"
              >
                {fillingAll ? (
                  <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Filling all accounts...</>
                ) : (
                  <><CalendarDays className="h-3 w-3 mr-1" /> Fill All Accounts ({totalNeeded} needed)</>
                )}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allAccountGoals.map(acc => (
              <div key={acc.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">@{acc.handle}</span>
                  <span className="text-xs text-muted-foreground capitalize">{acc.platform}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      acc.have >= acc.goal ? 'bg-green-500' : acc.have > 0 ? 'bg-primary' : 'bg-muted-foreground/30'
                    )}
                    style={{ width: `${Math.min(100, (acc.have / acc.goal) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{acc.have} / {acc.goal} posts</span>
                  {acc.need > 0 ? (
                    <span className="text-yellow-400">{acc.need} needed</span>
                  ) : (
                    <span className="text-green-400">Done</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pillar Balance (shows after generation) */}
      {pillars.length > 0 && ideas.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium">Pillar Balance</span>
            </div>
            <div className="space-y-2">
              {pillars.map(pillar => {
                const cnt = pillarCounts[pillar.name] || 0
                const pct = totalIdeas > 0 ? (cnt / totalIdeas) * 100 : 0
                const isLow = pct < (100 / pillars.length) * 0.5
                return (
                  <div key={pillar.id} className="flex items-center gap-2">
                    <span className="text-xs w-24 truncate" title={pillar.name}>{pillar.name}</span>
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                      <div
                        className={cn('h-1.5 rounded-full transition-all', isLow ? 'bg-yellow-500' : 'bg-primary')}
                        style={{ width: `${Math.max(2, pct)}%` }}
                      />
                    </div>
                    <span className={cn('text-xs w-6 text-right', isLow ? 'text-yellow-400' : 'text-muted-foreground')}>{cnt}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
      )}

      {/* Action Bar */}
      {ideas.length > 0 && (
        <div className="flex items-center justify-between bg-card border rounded-lg p-3">
          <div className="text-sm text-muted-foreground">
            {approvedCount} approved / {builtCount} built / {ideas.length} total
          </div>
          <div className="flex gap-2">
            {approvedCount > 0 && builtCount < approvedCount && (
              <Button size="sm" onClick={buildAllApproved} variant="default">
                <Zap className="h-3 w-3 mr-1" /> Build {approvedCount - builtCount} Approved
              </Button>
            )}
            {approvedCount > 0 && (
              <Button size="sm" onClick={addAllToPipeline} variant="outline">
                <ArrowRight className="h-3 w-3 mr-1" /> Add {approvedCount} to Pipeline
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Ideas List */}
      <div className="space-y-3">
        {ideas.map((idea, idx) => {
          const AssetIcon = ASSET_ICONS[idea.assetRecommendation.type] || FileText
          const isExpanded = expandedIdea === idx

          return (
            <Card
              key={idx}
              className={`transition-all ${idea.approved ? 'border-green-500/50 bg-green-500/5' : ''} ${idea.built ? 'border-blue-500/50 bg-blue-500/5' : ''}`}
            >
              <CardContent className="p-4">
                {/* Main Row */}
                <div className="flex items-start gap-3">
                  {/* Approve Button */}
                  <button
                    onClick={() => toggleApprove(idx)}
                    className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      idea.approved ? 'bg-green-500 border-green-500 text-white' : 'border-muted-foreground/30 hover:border-green-500/50'
                    }`}
                  >
                    {idea.approved && <Check className="h-3 w-3" />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {idea._accountHandle && (
                          <span className="text-xs text-muted-foreground mb-0.5 block">@{idea._accountHandle} ({idea._platform})</span>
                        )}
                        <p className="font-medium">{idea.concept}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">Hook: &ldquo;{idea.hook}&rdquo;</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className={ENGAGEMENT_COLORS[idea.engagementPotential] || ''}>
                          {idea.engagementPotential}
                        </Badge>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {idea.format.contentType.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <AssetIcon className="h-3 w-3 mr-1" />
                        {idea.assetRecommendation.type.replace('_', ' ')}
                      </Badge>
                      {idea.pillar && (
                        <Badge variant="outline" className="text-xs">{idea.pillar}</Badge>
                      )}
                    </div>

                    {/* Expand/Collapse */}
                    <button
                      onClick={() => setExpandedIdea(isExpanded ? null : idx)}
                      className="text-xs text-muted-foreground mt-2 flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {isExpanded ? 'Less' : 'Why this format + asset'}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                        <p><span className="text-foreground font-medium">Format reasoning:</span> {idea.format.reason}</p>
                        <p><span className="text-foreground font-medium">Asset recommendation:</span> {idea.assetRecommendation.description} — {idea.assetRecommendation.reason}</p>
                        <p><span className="text-foreground font-medium">Engagement:</span> {idea.engagementReason}</p>
                      </div>
                    )}

                    {/* Built Post Preview */}
                    {idea.built && idea.builtPost && (
                      <div className="mt-3 border border-blue-500/20 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-blue-400">BUILT POST</span>
                          <Button size="sm" variant="outline" onClick={() => addToPipeline(idx)} className="h-7 text-xs">
                            <ArrowRight className="h-3 w-3 mr-1" /> Add to Pipeline
                          </Button>
                        </div>
                        <p className="text-sm whitespace-pre-line">{idea.builtPost.content}</p>
                        {idea.builtPost.hashtags?.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {idea.builtPost.hashtags.map(h => `#${h}`).join(' ')}
                          </p>
                        )}
                        {idea.builtPost.assetNotes && (
                          <p className="text-xs text-muted-foreground">
                            <span className="text-foreground">Asset:</span> {idea.builtPost.assetNotes}
                          </p>
                        )}
                        {idea.builtPost.platformTips && (
                          <p className="text-xs text-muted-foreground">
                            <span className="text-foreground">Tip:</span> {idea.builtPost.platformTips}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Build Button */}
                  {idea.approved && !idea.built && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => buildPost(idx)}
                      disabled={idea.building}
                      className="flex-shrink-0"
                    >
                      {idea.building ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
