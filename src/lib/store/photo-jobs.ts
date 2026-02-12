import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PhotoJobStatus = 'generating' | 'selecting' | 'ready' | 'failed'
export type PhotoJobSource = 'ai' | 'companycam' | 'upload' | 'url'

export interface PhotoJob {
  postId: string
  source: PhotoJobSource
  status: PhotoJobStatus
  promptId?: string       // Astria prompt ID for polling
  progress: number        // 0-100
  startedAt: string
  imagePrompt?: string
}

interface PhotoJobStore {
  jobs: Record<string, PhotoJob>  // keyed by postId
  startJob: (postId: string, source: PhotoJobSource, promptId?: string, imagePrompt?: string) => void
  updateProgress: (postId: string, progress: number) => void
  completeJob: (postId: string) => void
  failJob: (postId: string) => void
  removeJob: (postId: string) => void
  getJob: (postId: string) => PhotoJob | undefined
}

export const usePhotoJobStore = create<PhotoJobStore>()(
  persist(
    (set, get) => ({
      jobs: {},
      startJob: (postId, source, promptId, imagePrompt) =>
        set((state) => ({
          jobs: {
            ...state.jobs,
            [postId]: {
              postId,
              source,
              status: source === 'ai' ? 'generating' : 'selecting',
              promptId,
              progress: 0,
              startedAt: new Date().toISOString(),
              imagePrompt,
            },
          },
        })),
      updateProgress: (postId, progress) =>
        set((state) => ({
          jobs: {
            ...state.jobs,
            [postId]: state.jobs[postId] ? { ...state.jobs[postId], progress } : state.jobs[postId],
          },
        })),
      completeJob: (postId) =>
        set((state) => {
          const rest = { ...state.jobs }
          delete rest[postId]
          return { jobs: rest }
        }),
      failJob: (postId) =>
        set((state) => ({
          jobs: {
            ...state.jobs,
            [postId]: state.jobs[postId] ? { ...state.jobs[postId], status: 'failed', progress: 0 } : state.jobs[postId],
          },
        })),
      removeJob: (postId) =>
        set((state) => {
          const rest = { ...state.jobs }
          delete rest[postId]
          return { jobs: rest }
        }),
      getJob: (postId) => get().jobs[postId],
    }),
    { name: 'content-command-photo-jobs' }
  )
)
