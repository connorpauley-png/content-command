'use client'

import { useState } from 'react'
import { useConfigStore } from '@/lib/store/config'
import { useClientStore } from '@/lib/store/clients'
import { platformColors, platformIcons } from '@/lib/platform-colors'
import type { PlatformAccount, Platform, AccountGoal, ContentType } from '@/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Wifi, WifiOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'google_business', label: 'Google Business' },
  { value: 'nextdoor', label: 'Nextdoor' },
]

const PLATFORM_CREDENTIALS: Record<Platform, { key: string; label: string; secret?: boolean }[]> = {
  instagram: [
    { key: 'igAccountId', label: 'IG Account ID' },
    { key: 'pageToken', label: 'Page Token', secret: true },
  ],
  facebook: [
    { key: 'pageId', label: 'Page ID' },
    { key: 'pageToken', label: 'Page Token', secret: true },
  ],
  linkedin: [
    { key: 'accessToken', label: 'Access Token', secret: true },
    { key: 'personUrn', label: 'Person URN (e.g. urn:li:person:abc123)' },
  ],
  twitter: [
    { key: 'consumerKey', label: 'Consumer Key (API Key)' },
    { key: 'consumerSecret', label: 'Consumer Secret', secret: true },
    { key: 'accessToken', label: 'Access Token' },
    { key: 'accessTokenSecret', label: 'Access Token Secret', secret: true },
  ],
  tiktok: [
    { key: 'accessToken', label: 'Access Token', secret: true },
  ],
  google_business: [
    { key: 'accessToken', label: 'Access Token', secret: true },
    { key: 'locationId', label: 'Location ID' },
  ],
  nextdoor: [
    { key: 'accessToken', label: 'Access Token', secret: true },
  ],
}

const GOALS: { value: AccountGoal; label: string }[] = [
  { value: 'awareness', label: 'Brand Awareness' },
  { value: 'leads', label: 'Lead Generation' },
  { value: 'personal_brand', label: 'Personal Brand' },
  { value: 'community', label: 'Community' },
  { value: 'sales', label: 'Sales' },
  { value: 'education', label: 'Education' },
]

const CONTENT_TYPES: ContentType[] = ['photo', 'video', 'reel', 'text', 'story', 'carousel']

const emptyAccount: Omit<PlatformAccount, 'id'> = {
  platform: 'instagram',
  enabled: true,
  handle: '',
  displayName: '',
  credentials: {},
  goal: 'awareness',
  personality: 'business',
  contentTypes: ['photo', 'text'],
  postsPerWeek: 3,
  bestTimes: ['12:00'],
  hashtagStrategy: 'mix of branded and trending',
  contentDescription: '',
  sampleTopics: [],
  examplePosts: [],
}

export default function AccountsPage() {
  const { getConfig, updateConfig } = useConfigStore()
  const { currentClientId } = useClientStore()
  const config = getConfig()
  const [editing, setEditing] = useState<PlatformAccount | null>(null)
  const [creating, setCreating] = useState(false)
  const [newAccount, setNewAccount] = useState<Omit<PlatformAccount, 'id'>>(emptyAccount)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, boolean | null>>({})

  const accounts = config?.accounts || []

  if (!currentClientId || !config) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Client Selected</h2>
          <p className="text-muted-foreground mb-4">
            Please select a client from the sidebar or create a new one to manage accounts.
          </p>
        </div>
      </div>
    )
  }

  const toggleEnabled = (id: string) => {
    if (!config) return
    const updated = config.accounts.map(a =>
      a.id === id ? { ...a, enabled: !a.enabled } : a
    )
    updateConfig({ accounts: updated })
  }

  const handleCreate = () => {
    if (!config || !newAccount.handle) return
    const account: PlatformAccount = {
      ...newAccount,
      id: crypto.randomUUID(),
    }
    updateConfig({ accounts: [...config.accounts, account] })
    setCreating(false)
    setNewAccount(emptyAccount)
  }

  const handleSaveEdit = () => {
    if (!config || !editing) return
    updateConfig({
      accounts: config.accounts.map(a => a.id === editing.id ? editing : a)
    })
    setEditing(null)
  }

  const handleDelete = (id: string) => {
    if (!config) return
    updateConfig({ accounts: config.accounts.filter(a => a.id !== id) })
    setDeleteConfirm(null)
  }

  const handleTest = async (id: string) => {
    setTesting(id)
    setTestResult(prev => ({ ...prev, [id]: null }))
    // Simulate test — in real app would call platform API
    await new Promise(r => setTimeout(r, 1500))
    setTestResult(prev => ({ ...prev, [id]: true }))
    setTesting(null)
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const AccountForm = ({ account, onChange }: { account: any; onChange: (a: any) => void }) => (
    <div className="space-y-4 max-h-[70vh] overflow-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Platform</Label>
          <Select value={account.platform} onValueChange={v => onChange({ ...account, platform: v as Platform })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PLATFORMS.map(p => (
                <SelectItem key={p.value} value={p.value}>
                  {platformIcons[p.value]} {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Handle</Label>
          <Input
            value={account.handle}
            onChange={e => onChange({ ...account, handle: e.target.value })}
            placeholder="@handle"
          />
        </div>
      </div>

      <div>
        <Label>Display Name</Label>
        <Input
          value={account.displayName}
          onChange={e => onChange({ ...account, displayName: e.target.value })}
        />
      </div>

      <div>
        <Label>Goal</Label>
        <Select value={account.goal} onValueChange={v => onChange({ ...account, goal: v as AccountGoal })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {GOALS.map(g => (
              <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Content Types</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {CONTENT_TYPES.map(type => (
            <div key={type} className="flex items-center gap-1.5">
              <Checkbox
                checked={account.contentTypes.includes(type)}
                onCheckedChange={checked => {
                  const types = checked
                    ? [...account.contentTypes, type]
                    : account.contentTypes.filter((t: string) => t !== type)
                  onChange({ ...account, contentTypes: types })
                }}
              />
              <span className="text-sm capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Posts Per Week</Label>
          <Input
            type="number"
            min={1}
            max={21}
            value={account.postsPerWeek}
            onChange={e => onChange({ ...account, postsPerWeek: parseInt(e.target.value) || 1 })}
          />
        </div>
        <div>
          <Label>Best Posting Times</Label>
          <Input
            value={account.bestTimes.join(', ')}
            onChange={e => onChange({ ...account, bestTimes: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
            placeholder="12:00, 18:00"
          />
        </div>
      </div>

      <div>
        <Label>Hashtag Strategy</Label>
        <Textarea
          value={account.hashtagStrategy}
          onChange={e => onChange({ ...account, hashtagStrategy: e.target.value })}
          rows={2}
        />
      </div>

      <div className="border-t pt-4">
        <Label className="text-base font-semibold">API Credentials</Label>
        <p className="text-xs text-muted-foreground mb-3">Required for auto-publishing. Tokens are stored locally in your browser.</p>
        <div className="space-y-3">
          {(PLATFORM_CREDENTIALS[account.platform as Platform] || []).map(cred => (
            <div key={cred.key}>
              <Label className="text-xs">{cred.label}</Label>
              <div className="flex gap-2">
                <Input
                  type={cred.secret ? 'password' : 'text'}
                  value={account.credentials?.[cred.key] || ''}
                  onChange={e => onChange({ ...account, credentials: { ...account.credentials, [cred.key]: e.target.value } })}
                  placeholder={cred.label}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          ))}
          {account.credentials && Object.keys(account.credentials).length > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs text-green-600">
                {Object.values(account.credentials).filter(Boolean).length} of {PLATFORM_CREDENTIALS[account.platform as Platform]?.length || 0} credentials set
              </span>
            </div>
          )}
        </div>
      </div>

      <div>
        <Label>Account Personality</Label>
        <Select value={account.personality || 'business'} onValueChange={v => onChange({ ...account, personality: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="business">Business — Promote services, share work</SelectItem>
            <SelectItem value="personal">Personal — Your story, behind the scenes</SelectItem>
            <SelectItem value="both">Both — Mix of business and personal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Voice / Tone Override</Label>
        <p className="text-xs text-muted-foreground mb-1">Leave empty to use business default</p>
        <div className="flex flex-wrap gap-2">
          {['professional', 'casual', 'funny', 'educational', 'inspirational', 'bold', 'friendly'].map(v => (
            <button
              key={v}
              type="button"
              onClick={() => {
                const current = account.voiceOverride || []
                const updated = current.includes(v) ? current.filter((x: string) => x !== v) : [...current, v]
                onChange({ ...account, voiceOverride: updated })
              }}
              className={`px-3 py-1 rounded-full text-xs border transition-all capitalize ${
                (account.voiceOverride || []).includes(v)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>What is this account about?</Label>
        <p className="text-xs text-muted-foreground mb-1">Describe what kind of content goes here — the AI uses this to generate unique content for this account</p>
        <Textarea
          value={account.contentDescription || ''}
          onChange={e => onChange({ ...account, contentDescription: e.target.value })}
          placeholder="e.g., 'Weekly life updates, behind the scenes of running a business at 21. Real stories, not polished corporate content.'"
          rows={3}
        />
      </div>

      <div>
        <Label>Example Posts</Label>
        <p className="text-xs text-muted-foreground mb-1">Paste real posts to teach the AI your voice (Ctrl+Enter to add)</p>
        {(account.examplePosts || []).map((post: string, i: number) => (
          <div key={i} className="relative bg-muted/50 rounded-lg p-3 pr-8 text-sm mb-2">
            <p className="whitespace-pre-wrap">{post.length > 200 ? post.slice(0, 200) + '...' : post}</p>
            <button type="button" className="absolute top-2 right-2 text-muted-foreground hover:text-foreground" onClick={() => onChange({ ...account, examplePosts: (account.examplePosts || []).filter((_: string, j: number) => j !== i) })}>x</button>
          </div>
        ))}
        <Textarea
          placeholder="Paste an example post here and press Ctrl+Enter"
          rows={3}
          onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && (e.target as HTMLTextAreaElement).value.trim()) {
              e.preventDefault()
              onChange({ ...account, examplePosts: [...(account.examplePosts || []), (e.target as HTMLTextAreaElement).value.trim()] })
              ;(e.target as HTMLTextAreaElement).value = ''
            }
          }}
        />
      </div>

      <div>
        <Label>Sample Topics</Label>
        <p className="text-xs text-muted-foreground mb-1">Topics you want to post about on this account</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {(account.sampleTopics || []).map((topic: string, i: number) => (
            <span key={i} className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
              {topic}
              <button type="button" onClick={() => onChange({ ...account, sampleTopics: (account.sampleTopics || []).filter((_: string, j: number) => j !== i) })}>
                x
              </button>
            </span>
          ))}
        </div>
        <Input
          placeholder="Type a topic and press Enter"
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
              e.preventDefault()
              onChange({ ...account, sampleTopics: [...(account.sampleTopics || []), (e.target as HTMLInputElement).value.trim()] })
              ;(e.target as HTMLInputElement).value = ''
            }
          }}
        />
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">Manage your social media accounts</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <p className="text-lg">No accounts configured</p>
          <p className="text-sm mt-1">Add your first social media account to get started.</p>
          <Button className="mt-4" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Account
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {accounts.map(acc => {
            const colors = platformColors[acc.platform]
            return (
              <Card key={acc.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center text-2xl', colors.bg)}>
                    {platformIcons[acc.platform]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">@{acc.handle}</span>
                      <Badge variant="outline" className="capitalize">{acc.platform}</Badge>
                      <Badge variant="secondary" className="capitalize">{acc.goal}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {acc.postsPerWeek}x/week · {acc.contentTypes.join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTest(acc.id)}
                      disabled={testing === acc.id}
                    >
                      {testing === acc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : testResult[acc.id] === true ? (
                        <Wifi className="h-4 w-4 text-green-500" />
                      ) : testResult[acc.id] === false ? (
                        <WifiOff className="h-4 w-4 text-red-500" />
                      ) : (
                        <Wifi className="h-4 w-4" />
                      )}
                    </Button>

                    <Switch
                      checked={acc.enabled}
                      onCheckedChange={() => toggleEnabled(acc.id)}
                    />

                    <Button variant="ghost" size="sm" onClick={() => setEditing(acc)}>
                      Edit
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setDeleteConfirm(acc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Account</DialogTitle>
          </DialogHeader>
          <AccountForm account={newAccount} onChange={setNewAccount} />
          <Button onClick={handleCreate} className="w-full mt-2">Add Account</Button>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          {editing && <AccountForm account={editing} onChange={(a) => setEditing(a as PlatformAccount)} />}
          <Button onClick={handleSaveEdit} className="w-full mt-2">Save Changes</Button>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={open => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will remove the account and all its settings. Posts will remain in the pipeline.
          </p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
