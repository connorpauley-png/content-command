'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useCompanyCamPhotos(projectId?: string, limit = 30) {
  const params = new URLSearchParams()
  if (projectId) params.set('project_id', projectId)
  params.set('limit', String(limit))

  const { data, error, isLoading } = useSWR(
    `/api/companycam?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  return {
    photos: data?.photos ?? [],
    isLoading,
    error,
  }
}

export function useCompanyCamProjects() {
  const { data, error, isLoading } = useSWR(
    '/api/companycam/projects',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 } // 5 min cache
  )

  return {
    projects: data?.projects ?? (Array.isArray(data) ? data : []),
    isLoading,
    error,
  }
}
