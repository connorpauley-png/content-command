'use client'

import { useEffect, useRef } from 'react'
import { usePostsStore } from '@/lib/store/config'
import { useConfigStore } from '@/lib/store/config'

const MAX_RETRIES = 3
const CHECK_INTERVAL = 60_000 // 60 seconds

export function useAutoPublish() {
  const publishingRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const interval = setInterval(async () => {
      const { posts, updatePost } = usePostsStore.getState()
      const config = useConfigStore.getState().getConfig()
      if (!config) return

      const now = Date.now()
      const duePosts = posts.filter(
        (p) =>
          p.status === 'scheduled' &&
          p.scheduledAt &&
          new Date(p.scheduledAt).getTime() <= now &&
          !publishingRef.current.has(p.id) &&
          (p.retryCount || 0) < MAX_RETRIES
      )

      for (const post of duePosts) {
        const account = config.accounts.find((a) => a.id === post.accountId)
        if (!account) continue

        publishingRef.current.add(post.id)
        updatePost(post.id, { publishStatus: 'publishing' })

        try {
          const res = await fetch('/api/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ post, account }),
          })
          const data = await res.json()

          if (data.success) {
            updatePost(post.id, {
              status: 'posted',
              publishStatus: 'verified',
              platformPostId: data.platformPostId,
              publishedAt: new Date().toISOString(),
            })
          } else {
            const retryCount = (post.retryCount || 0) + 1
            updatePost(post.id, {
              publishStatus: 'failed',
              publishError: data.error || 'Unknown error',
              retryCount,
              ...(retryCount >= MAX_RETRIES ? { status: 'failed' as const } : {}),
            })
          }
        } catch (err) {
          const retryCount = (post.retryCount || 0) + 1
          updatePost(post.id, {
            publishStatus: 'failed',
            publishError: err instanceof Error ? err.message : 'Network error',
            retryCount,
          })
        } finally {
          publishingRef.current.delete(post.id)
        }
      }
    }, CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [])
}
