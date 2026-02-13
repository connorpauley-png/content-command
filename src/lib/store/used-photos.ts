import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UsedPhotoEntry {
  usedAt: string
  postId: string
}

interface UsedPhotosStore {
  usedPhotos: Record<string, UsedPhotoEntry>
  addUsedPhoto: (photoId: string, postId: string) => void
  isRecentlyUsed: (photoId: string) => boolean
  getUsedPhotos: () => string[]
  cleanupOldPhotos: () => void
}

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

export const useUsedPhotosStore = create<UsedPhotosStore>()(
  persist(
    (set, get) => ({
      usedPhotos: {},
      addUsedPhoto: (photoId, postId) =>
        set((state) => ({
          usedPhotos: {
            ...state.usedPhotos,
            [photoId]: { usedAt: new Date().toISOString(), postId },
          },
        })),
      isRecentlyUsed: (photoId) => {
        const entry = get().usedPhotos[photoId]
        if (!entry) return false
        return Date.now() - new Date(entry.usedAt).getTime() < NINETY_DAYS_MS
      },
      getUsedPhotos: () => {
        const { usedPhotos } = get()
        const now = Date.now()
        return Object.entries(usedPhotos)
          .filter(([, e]) => now - new Date(e.usedAt).getTime() < NINETY_DAYS_MS)
          .map(([id]) => id)
      },
      cleanupOldPhotos: () =>
        set((state) => {
          const now = Date.now()
          const cleaned: Record<string, UsedPhotoEntry> = {}
          for (const [id, entry] of Object.entries(state.usedPhotos)) {
            if (now - new Date(entry.usedAt).getTime() < NINETY_DAYS_MS) {
              cleaned[id] = entry
            }
          }
          return { usedPhotos: cleaned }
        }),
    }),
    { name: 'content-command-used-photos' }
  )
)
