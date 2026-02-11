'use client'

import useSWR from 'swr'
import type { CalendarEvent } from '@/lib/supabase'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useEvents(from?: string, to?: string) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString()

  const { data, error, isLoading, mutate } = useSWR<CalendarEvent[]>(
    `/api/events${qs ? `?${qs}` : ''}`,
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 5000 }
  )

  return {
    events: Array.isArray(data) ? data : [],
    isLoading,
    error,
    mutate,
  }
}
