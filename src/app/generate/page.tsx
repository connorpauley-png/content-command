'use client'

import { useState } from 'react'
import { useConfigStore, usePostsStore } from '@/lib/store/config'
import { useClientStore } from '@/lib/store/clients'
import { platformColors, platformIcons } from '@/lib/platform-colors'
import type { Post } from '@/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Sparkles, Loader2, Calendar, Kanban } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function GeneratePage() {
  const { getConfig } = useConfigStore()
  const { addPost } = usePostsStore()
  const { currentClientId } = useClientStore()
  const config = getConfig()
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [count, setCount] = useState('5')
  // timeRange removed — scheduling handled by Fill button in pipeline
  const [loading, setLoading] = useState(false)
  const [generatedPosts, setGeneratedPosts] = useState<Post[]>([])
  const [error, setError] = useState<string | null>(null)

  const toggleAccount = (id: string) => {
    setSelectedAccounts(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const handleGenerate = async () => {
    if (!config || selectedAccounts.length === 0) return
    setLoading(true)
    setError(null)
    setGeneratedPosts([])

    const postsPerAccount = Math.ceil(parseInt(count) / selectedAccounts.length)
    const allPosts: Post[] = []

    for (const accountId of selectedAccounts) {
      try {
        const res = await fetch('/api/generate/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config,
            accountId,
            count: postsPerAccount,
            timeRange: 'this_week',
          }),
        })
        const data = await res.json()
        if (data.error) {
          setError(data.error)
        } else {
          allPosts.push(...data.posts)
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    setGeneratedPosts(allPosts)
    setLoading(false)
  }

  const addToPipeline = () => {
    if (!currentClientId) return
    generatedPosts.forEach(post => addPost({ ...post, clientId: currentClientId, status: 'idea' }))
    setGeneratedPosts([])
  }

  const addToScheduled = () => {
    if (!currentClientId) return
    generatedPosts.forEach(post => addPost({ ...post, clientId: currentClientId, status: 'scheduled', scheduledAt: undefined }))
    setGeneratedPosts([])
  }

  if (!currentClientId || !config) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Client Selected</h2>
          <p className="text-muted-foreground mb-4">
            Please select a client from the sidebar or create a new one to generate content.
          </p>
          <Button asChild>
            <a href="/clients">Manage Clients</a>
          </Button>
        </div>
      </div>
    )
  }
  
  if (!config) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Complete setup first to generate content.</p>
      </div>
    )
  }

  const enabledAccounts = config.accounts.filter(a => a.enabled)

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          Generate Content
        </h1>
        <p className="text-muted-foreground mt-1">AI-powered content generation for your accounts</p>
      </div>

      <Card className="p-6 space-y-6">
        <div>
          <Label className="text-base font-semibold mb-3 block">Select Accounts</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {enabledAccounts.map(acc => (
              <div
                key={acc.id}
                onClick={() => toggleAccount(acc.id)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  selectedAccounts.includes(acc.id)
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-accent/50'
                )}
              >
                <Checkbox checked={selectedAccounts.includes(acc.id)} />
                <span className="text-lg">{platformIcons[acc.platform]}</span>
                <div>
                  <div className="font-medium text-sm">@{acc.handle}</div>
                  <div className="text-xs text-muted-foreground capitalize">{acc.platform}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Number of Posts</Label>
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 post</SelectItem>
                <SelectItem value="5">5 posts</SelectItem>
                <SelectItem value="10">10 posts</SelectItem>
                <SelectItem value="20">20 posts</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Time range removed — scheduling handled by Fill button in pipeline */}
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || selectedAccounts.length === 0}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" /> Generate {count} Posts</>
          )}
        </Button>

        {error && (
          <div className="text-sm text-red-500 bg-red-500/10 rounded-lg p-3">{error}</div>
        )}
      </Card>

      {generatedPosts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Generated Posts ({generatedPosts.length})</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={addToPipeline}>
                <Kanban className="h-4 w-4 mr-2" /> Add to Pipeline
              </Button>
              <Button onClick={addToScheduled}>
                <Calendar className="h-4 w-4 mr-2" /> Add to Scheduled
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {generatedPosts.map(post => {
              const acc = config.accounts.find(a => a.id === post.accountId)
              const colors = platformColors[post.platform]
              return (
                <Card key={post.id} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn('text-xs px-2 py-0.5 rounded', colors.pill)}>
                      {platformIcons[post.platform]} {acc?.handle || post.platform}
                    </span>
                    {post.pillar && <Badge variant="outline">{post.pillar}</Badge>}
                    {post.scheduledAt && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(post.scheduledAt).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                  {post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {post.hashtags.map((tag, i) => (
                        <span key={i} className="text-xs text-primary">#{tag.replace(/^#/, '')}</span>
                      ))}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
