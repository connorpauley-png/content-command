'use client'

import { useEffect, useRef } from 'react'
import { mutate } from 'swr'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Subscribe to cc_posts changes via Supabase Realtime.
 * On any INSERT/UPDATE/DELETE, revalidates all SWR keys matching /api/posts.
 */
export function useRealtimePosts() {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const channel = supabaseBrowser
      .channel('cc-posts-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cc_posts' },
        () => {
          // Revalidate any SWR key starting with /api/posts
          mutate(
            (key: string) => typeof key === 'string' && key.startsWith('/api/posts'),
            undefined,
            { revalidate: true }
          )
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabaseBrowser.removeChannel(channel)
    }
  }, [])
}

/**
 * Subscribe to cc_publish_queue changes.
 * Useful for seeing publish progress in real time.
 */
export function useRealtimeQueue() {
  useEffect(() => {
    const channel = supabaseBrowser
      .channel('cc-queue-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cc_publish_queue' },
        () => {
          mutate(
            (key: string) => typeof key === 'string' && key.startsWith('/api/posts'),
            undefined,
            { revalidate: true }
          )
        }
      )
      .subscribe()

    return () => {
      supabaseBrowser.removeChannel(channel)
    }
  }, [])
}
