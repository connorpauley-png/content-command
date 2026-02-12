import { useConfigStore } from './store/config'
import { usePostsStore } from './store/config'
import { useClientStore } from './store/clients'
import type { AppConfig, Post } from '@/types'

const COLLEGE_BROS_CLIENT_ID = 'college-bros-default'

export function migrateToMultiTenant() {
  // Check if migration has already run
  const migrationKey = 'content-command-migration-v1'
  if (typeof window !== 'undefined' && localStorage.getItem(migrationKey)) {
    return
  }

  try {
    // Check for old single-tenant config
    const oldConfigStore = localStorage.getItem('content-command-config')
    const oldPostsStore = localStorage.getItem('content-command-posts')

    if (oldConfigStore) {
      const oldData = JSON.parse(oldConfigStore)
      const oldConfig = oldData.state?.config

      if (oldConfig && !oldConfig.clientId) {
        // This is old single-tenant config, migrate it
        console.log('🔄 Migrating existing config to multi-tenant structure...')

        // Update config with clientId
        const migratedConfig: AppConfig = {
          ...oldConfig,
          clientId: COLLEGE_BROS_CLIENT_ID,
        }

        // Store in new client-scoped config store
        useConfigStore.getState().setConfig(migratedConfig)

        // Ensure College Bros client exists
        const clientStore = useClientStore.getState()
        if (!clientStore.clients.find(c => c.id === COLLEGE_BROS_CLIENT_ID)) {
          clientStore.addClient({
            id: COLLEGE_BROS_CLIENT_ID,
            name: 'College Bros',
            industry: 'Landscaping & Outdoor Services',
            description: 'Student-run outdoor service company serving Monroe, Louisiana',
            setupComplete: oldConfig.setupComplete || true,
            createdAt: oldConfig.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        }

        // Set as current client
        clientStore.setCurrentClient(COLLEGE_BROS_CLIENT_ID)
      }
    }

    if (oldPostsStore) {
      const oldPostsData = JSON.parse(oldPostsStore)
      const oldPosts: Post[] = oldPostsData.state?.posts || []

      if (oldPosts.length > 0) {
        console.log(`🔄 Migrating ${oldPosts.length} posts to multi-tenant structure...`)

        // Add clientId to all existing posts
        const migratedPosts = oldPosts.map((post): Post => ({
          ...post,
          clientId: COLLEGE_BROS_CLIENT_ID,
        }))

        // Replace posts in store
        usePostsStore.getState().setPosts(migratedPosts)
      }
    }

    // Mark migration as complete
    if (typeof window !== 'undefined') {
      localStorage.setItem(migrationKey, 'completed')
      console.log('✅ Migration to multi-tenant structure completed')
    }
  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}