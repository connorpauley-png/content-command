'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Copy } from 'lucide-react'
import type { Post, PlatformAccount } from '@/types'
import { useConfigStore } from '@/lib/store/config'
import { usePostsStore } from '@/lib/store/config'

interface RepurposeDialogProps {
  post: Post
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸', facebook: '📘', linkedin: '💼', twitter: '𝕏',
  tiktok: '🎵', google_business: '📍', nextdoor: '🏘️',
}

export function RepurposeDialog({ post, open, onOpenChange }: RepurposeDialogProps) {
  const config = useConfigStore((s) => s.getConfig(post.clientId))
  const addPost = usePostsStore((s) => s.addPost)
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const otherAccounts = (config?.accounts ?? []).filter(
    (a: PlatformAccount) => a.id !== post.accountId && a.enabled
  )

  const toggle = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleRepurpose = async () => {
    if (!config || selectedAccounts.length === 0) return
    setLoading(true)
    try {
      const res = await fetch('/api/generate/repurpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post, targetAccounts: selectedAccounts, config }),
      })
      const data = await res.json()
      if (data.posts) {
        data.posts.forEach((p: Post) => addPost(p))
      }
      onOpenChange(false)
      setSelectedAccounts([])
    } catch (e) {
      console.error('Repurpose failed:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-4 w-4" /> Repurpose Post
          </DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <p className="text-sm text-muted-foreground mb-3">
            Adapt this post for other platforms. AI will adjust length, tone, and hashtags automatically.
          </p>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2 italic">
            &ldquo;{post.content.slice(0, 120)}{post.content.length > 120 ? '…' : ''}&rdquo;
          </p>

          {otherAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No other accounts available.</p>
          ) : (
            <div className="space-y-2">
              {otherAccounts.map((account: PlatformAccount) => (
                <label key={account.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-md hover:bg-muted">
                  <Checkbox
                    checked={selectedAccounts.includes(account.id)}
                    onCheckedChange={() => toggle(account.id)}
                  />
                  <span className="text-lg">{PLATFORM_ICONS[account.platform] ?? '📱'}</span>
                  <div>
                    <div className="text-sm font-medium">{account.displayName || account.handle}</div>
                    <div className="text-xs text-muted-foreground capitalize">{account.platform.replace('_', ' ')}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleRepurpose} disabled={loading || selectedAccounts.length === 0} className="gap-1.5">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
            Repurpose to {selectedAccounts.length} account{selectedAccounts.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
