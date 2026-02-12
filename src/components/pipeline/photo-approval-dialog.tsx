'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, RefreshCw, CheckCheck, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Post } from '@/types'

interface PhotoApprovalDialogProps {
  open: boolean
  onClose: () => void
  post: Post
  onApprove: (approvedUrls: string[]) => void
  onRegenerate: () => void
  onGenerateMore: (numImages: number) => void
}

export function PhotoApprovalDialog({ open, onClose, post, onApprove, onRegenerate, onGenerateMore }: PhotoApprovalDialogProps) {
  const [statuses, setStatuses] = useState<Record<number, 'approved' | 'rejected' | 'pending'>>(
    () => Object.fromEntries(post.mediaUrls.map((_, i) => [i, 'pending' as const]))
  )

  const allDecided = Object.values(statuses).every(s => s !== 'pending')
  const approvedUrls = post.mediaUrls.filter((_, i) => statuses[i] === 'approved')
  const hasRejected = Object.values(statuses).some(s => s === 'rejected')

  const setStatus = (idx: number, status: 'approved' | 'rejected') => {
    setStatuses(prev => ({ ...prev, [idx]: status }))
  }

  const approveAll = () => {
    setStatuses(Object.fromEntries(post.mediaUrls.map((_, i) => [i, 'approved' as const])))
  }

  const handleDone = () => {
    if (approvedUrls.length > 0) {
      onApprove(approvedUrls)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>✅ Approve Photos</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={approveAll}>
                <CheckCheck className="h-4 w-4 mr-1" /> Approve All
              </Button>
              <Button variant="outline" size="sm" onClick={() => onGenerateMore(2)}>
                <Sparkles className="h-4 w-4 mr-1" /> +2 More
              </Button>
              <Button variant="outline" size="sm" onClick={() => onGenerateMore(4)}>
                <Sparkles className="h-4 w-4 mr-1" /> +4 More
              </Button>
              <Button variant="outline" size="sm" onClick={onRegenerate}>
                <RefreshCw className="h-4 w-4 mr-1" /> Start Over
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {post.content && (
            <p className="text-sm text-muted-foreground line-clamp-2 bg-muted/50 rounded-lg p-3">
              {post.content}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            {post.mediaUrls.map((url, i) => (
              <div key={i} className={cn(
                'relative rounded-xl overflow-hidden border-2 transition-all',
                statuses[i] === 'approved' && 'border-green-500 ring-2 ring-green-500/20',
                statuses[i] === 'rejected' && 'border-red-500 ring-2 ring-red-500/20 opacity-50',
                statuses[i] === 'pending' && 'border-border'
              )}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-48 object-cover" />
                <div className="absolute top-2 left-2">
                  <Badge variant={statuses[i] === 'approved' ? 'default' : statuses[i] === 'rejected' ? 'destructive' : 'secondary'}>
                    {statuses[i] === 'approved' ? '✓ Approved' : statuses[i] === 'rejected' ? '✗ Rejected' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex gap-2 p-2 bg-background/80 backdrop-blur-sm">
                  <Button
                    variant={statuses[i] === 'approved' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setStatus(i, 'approved')}
                  >
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button
                    variant={statuses[i] === 'rejected' ? 'destructive' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setStatus(i, 'rejected')}
                  >
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {allDecided && (
            <div className="flex gap-2">
              {approvedUrls.length > 0 && (
                <Button onClick={handleDone} className="flex-1">
                  Continue with {approvedUrls.length} Photo{approvedUrls.length !== 1 ? 's' : ''} → Review
                </Button>
              )}
              {hasRejected && approvedUrls.length === 0 && (
                <Button variant="outline" onClick={onRegenerate} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-1" /> Pick New Photos
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
