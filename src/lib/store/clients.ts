import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Client } from '@/types'

interface ClientStore {
  clients: Client[]
  currentClientId: string | null
  
  // Client management
  addClient: (client: Client) => void
  updateClient: (id: string, updates: Partial<Client>) => void
  deleteClient: (id: string) => void
  getClient: (id: string) => Client | undefined
  getCurrentClient: () => Client | undefined
  
  // Current client
  setCurrentClient: (clientId: string) => void
  
  // Initialize with College Bros as default
  initialize: () => void
}

const COLLEGE_BROS_ID = 'college-bros-default'

export const useClientStore = create<ClientStore>()(
  persist(
    (set, get) => ({
      clients: [],
      currentClientId: null,
      
      addClient: (client) => set((state) => ({
        clients: [...state.clients, client],
      })),
      
      updateClient: (id, updates) => set((state) => ({
        clients: state.clients.map((client) =>
          client.id === id
            ? { ...client, ...updates, updatedAt: new Date().toISOString() }
            : client
        ),
      })),
      
      deleteClient: (id) => set((state) => {
        const newClients = state.clients.filter((client) => client.id !== id)
        const newCurrentClientId = state.currentClientId === id 
          ? (newClients[0]?.id || null)
          : state.currentClientId
        return {
          clients: newClients,
          currentClientId: newCurrentClientId,
        }
      }),
      
      getClient: (id) => get().clients.find((client) => client.id === id),
      
      getCurrentClient: () => {
        const { currentClientId, clients } = get()
        return currentClientId ? clients.find((client) => client.id === currentClientId) : undefined
      },
      
      setCurrentClient: (clientId) => set({ currentClientId: clientId }),
      
      initialize: () => {
        const state = get()
        
        // If no clients exist, create College Bros as default
        if (state.clients.length === 0) {
          const collegeBrosClient: Client = {
            id: COLLEGE_BROS_ID,
            name: 'College Bros',
            industry: 'Landscaping & Outdoor Services',
            description: 'Student-run outdoor service company serving Monroe, Louisiana',
            setupComplete: true, // Will be false if no config exists yet
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          
          set({
            clients: [collegeBrosClient],
            currentClientId: COLLEGE_BROS_ID,
          })
        }
        
        // If no current client selected, select first available
        if (!state.currentClientId && state.clients.length > 0) {
          set({ currentClientId: state.clients[0].id })
        }
      },
    }),
    { name: 'content-command-clients' }
  )
)

// Initialize on first load
if (typeof window !== 'undefined') {
  useClientStore.getState().initialize()
}