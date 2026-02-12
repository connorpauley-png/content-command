'use client'

import useSWR, { mutate as globalMutate } from 'swr'
import type { Post } from '@/lib/supabase'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export interface PostFilters {
  status?: string
  platform?: string
  limit?: number
  offset?: number
}

function buildQuery(filters?: PostFilters): string {
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.platform) params.set('platform', filters.platform)
  params.set('limit', String(filters?.limit ?? 200))
  if (filters?.offset) params.set('offset', String(filters.offset))
  return params.toString()
}

export function postsKey(filters?: PostFilters) {
  return `/api/posts?${buildQuery(filters)}`
}

export function usePosts(filters?: PostFilters) {
  const key = postsKey(filters)
  const { data, error, isLoading, mutate } = useSWR<Post[]>(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
    refreshInterval: 0,
  })

  return {
    posts: Array.isArray(data) ? data : [],
    isLoading,
    error,
    mutate,
  }
}

export function usePost(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Post>(
    id ? `/api/posts/${id}` : null,
    fetcher,
    { revalidateOnFocus: true }
  )

  return { post: data ?? null, isLoading, error, mutate }
}

// Revalidate all post lists (call after mutations)
export function revalidatePosts() {
  globalMutate((key: string) => typeof key === 'string' && key.startsWith('/api/posts'), undefined, { revalidate: true })
}
