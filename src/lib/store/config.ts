import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppConfig, Post, PostStatus } from '@/types'
import { useClientStore } from './clients'

interface ConfigStore {
  configs: Record<string, AppConfig>
  getConfig: (clientId?: string) => AppConfig | null
  setConfig: (config: AppConfig) => void
  updateConfig: (partial: Partial<AppConfig>, clientId?: string) => void
  deleteConfig: (clientId: string) => void
  migrateExistingConfig: () => void
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set, get) => ({
      configs: {},
      
      getConfig: (clientId) => {
        const targetClientId = clientId || useClientStore.getState().currentClientId
        if (!targetClientId) return null
        return get().configs[targetClientId] || null
      },
      
      setConfig: (config) => 
        set((state) => ({
          configs: { ...state.configs, [config.clientId]: config },
        })),
      
      updateConfig: (partial, clientId) => {
        const targetClientId = clientId || useClientStore.getState().currentClientId
        if (!targetClientId) return
        
        set((state) => {
          const existingConfig = state.configs[targetClientId]
          if (!existingConfig) return state
          
          return {
            configs: {
              ...state.configs,
              [targetClientId]: {
                ...existingConfig,
                ...partial,
                updatedAt: new Date().toISOString(),
              },
            },
          }
        })
      },
      
      deleteConfig: (clientId) =>
        set((state) => {
          const newConfigs = { ...state.configs }
          delete newConfigs[clientId]
          return { configs: newConfigs }
        }),
      
      migrateExistingConfig: () => {
        // This will be called once to migrate any existing single-tenant config
        // to the College Bros client
      },
    }),
    { 
      name: 'content-command-configs',
      partialize: (state) => ({ configs: state.configs }),
    }
  )
)

interface PostsStore {
  posts: Post[]
  getClientPosts: (clientId?: string) => Post[]
  setPosts: (posts: Post[]) => void
  addPost: (post: Post) => void
  updatePost: (id: string, updates: Partial<Post>) => void
  deletePost: (id: string) => void
  movePost: (id: string, status: PostStatus) => void
  getPostsByStatus: (status: PostStatus, clientId?: string) => Post[]
  getPostsByAccount: (accountId: string, clientId?: string) => Post[]
  getPostsByDate: (date: string, clientId?: string) => Post[]
  deleteClientPosts: (clientId: string) => void
}

export const usePostsStore = create<PostsStore>()(
  persist(
    (set, get) => ({
      posts: [],
      
      getClientPosts: (clientId) => {
        const targetClientId = clientId || useClientStore.getState().currentClientId
        if (!targetClientId) return []
        return get().posts.filter((p) => p.clientId === targetClientId)
      },
      
      setPosts: (posts) => set({ posts }),
      addPost: (post) => set((state) => ({ posts: [...state.posts, post] })),
      updatePost: (id, updates) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        })),
      deletePost: (id) => set((state) => ({ posts: state.posts.filter((p) => p.id !== id) })),
      movePost: (id, status) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
          ),
        })),
      getPostsByStatus: (status, clientId) => {
        const targetClientId = clientId || useClientStore.getState().currentClientId
        if (!targetClientId) return []
        return get().posts.filter((p) => p.status === status && p.clientId === targetClientId)
      },
      getPostsByAccount: (accountId, clientId) => {
        const targetClientId = clientId || useClientStore.getState().currentClientId
        if (!targetClientId) return []
        return get().posts.filter((p) => p.accountId === accountId && p.clientId === targetClientId)
      },
      getPostsByDate: (date, clientId) => {
        const targetClientId = clientId || useClientStore.getState().currentClientId
        if (!targetClientId) return []
        return get().posts.filter((p) => p.scheduledAt?.startsWith(date) && p.clientId === targetClientId)
      },
      deleteClientPosts: (clientId) =>
        set((state) => ({ posts: state.posts.filter((p) => p.clientId !== clientId) })),
    }),
    { 
      name: 'content-command-posts',
      partialize: (state) => ({ posts: state.posts }),
    }
  )
)
