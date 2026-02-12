'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useClientStore } from '@/lib/store/clients'
import { useConfigStore } from '@/lib/store/config'
import { usePostsStore } from '@/lib/store/config'
import { 
  Building2, 
  Plus, 
  Settings, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react'
import type { Client } from '@/types'

export default function ClientsPage() {
  const router = useRouter()
  const { clients, addClient, updateClient, deleteClient, setCurrentClient } = useClientStore()
  const { configs, deleteConfig } = useConfigStore()
  const { getClientPosts, deleteClientPosts } = usePostsStore()
  const [mounted, setMounted] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [newClient, setNewClient] = useState({
    name: '',
    industry: '',
    description: '',
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCreateClient = () => {
    if (!newClient.name.trim()) return

    const client: Client = {
      id: `client-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: newClient.name.trim(),
      industry: newClient.industry.trim() || 'General',
      description: newClient.description.trim(),
      setupComplete: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addClient(client)
    setNewClient({ name: '', industry: '', description: '' })
    setIsCreating(false)

    // Set as current client and redirect to setup
    setCurrentClient(client.id)
    router.push('/setup')
  }

  const handleEditClient = (client: Client) => {
    if (!editingClient) return

    updateClient(client.id, {
      name: editingClient.name.trim(),
      industry: editingClient.industry.trim(),
      description: editingClient.description?.trim(),
    })
    setEditingClient(null)
  }

  const handleDeleteClient = (clientId: string) => {
    deleteConfig(clientId)
    deleteClientPosts(clientId)
    deleteClient(clientId)
  }

  const getClientStats = (clientId: string) => {
    const config = configs[clientId]
    const posts = getClientPosts(clientId)
    
    return {
      accounts: config?.accounts?.filter(a => a.enabled).length || 0,
      posts: posts.length,
      setupComplete: config?.setupComplete || false,
    }
  }

  if (!mounted) return null

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Client Management</h1>
          <p className="text-muted-foreground">
            Manage your content clients and switch between them
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Create a new client to manage their social media content.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="client-name">Business Name</Label>
                <Input
                  id="client-name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="e.g. Joe's Plumbing, ABC Marketing"
                />
              </div>
              <div>
                <Label htmlFor="client-industry">Industry</Label>
                <Input
                  id="client-industry"
                  value={newClient.industry}
                  onChange={(e) => setNewClient({ ...newClient, industry: e.target.value })}
                  placeholder="e.g. Plumbing, Marketing, Landscaping"
                />
              </div>
              <div>
                <Label htmlFor="client-description">Description (Optional)</Label>
                <Textarea
                  id="client-description"
                  value={newClient.description}
                  onChange={(e) => setNewClient({ ...newClient, description: e.target.value })}
                  placeholder="Brief description of the business"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateClient}
                disabled={!newClient.name.trim()}
              >
                Create & Setup
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => {
          const stats = getClientStats(client.id)
          return (
            <Card key={client.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                  </div>
                  <Badge
                    variant={stats.setupComplete ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {stats.setupComplete ? (
                      <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                    ) : (
                      <><AlertCircle className="h-3 w-3 mr-1" /> Setup Required</>
                    )}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{client.industry}</p>
                {client.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {client.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-sm font-medium">
                      <Users className="h-4 w-4" />
                      {stats.accounts}
                    </div>
                    <p className="text-xs text-muted-foreground">Accounts</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-sm font-medium">
                      <Calendar className="h-4 w-4" />
                      {stats.posts}
                    </div>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-sm font-medium">
                      <BarChart3 className="h-4 w-4" />
                      {stats.setupComplete ? 'Ready' : 'Setup'}
                    </div>
                    <p className="text-xs text-muted-foreground">Status</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setCurrentClient(client.id)
                      router.push('/')
                    }}
                  >
                    Switch To
                  </Button>
                  <Dialog 
                    open={editingClient?.id === client.id} 
                    onOpenChange={(open) => !open && setEditingClient(null)}
                  >
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingClient(client)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Client</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Business Name</Label>
                          <Input
                            value={editingClient?.name || ''}
                            onChange={(e) =>
                              setEditingClient(
                                editingClient
                                  ? { ...editingClient, name: e.target.value }
                                  : null
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>Industry</Label>
                          <Input
                            value={editingClient?.industry || ''}
                            onChange={(e) =>
                              setEditingClient(
                                editingClient
                                  ? { ...editingClient, industry: e.target.value }
                                  : null
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={editingClient?.description || ''}
                            onChange={(e) =>
                              setEditingClient(
                                editingClient
                                  ? { ...editingClient, description: e.target.value }
                                  : null
                              )
                            }
                            rows={3}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setEditingClient(null)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={() => handleEditClient(client)}>
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Client</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete &quot;{client.name}&quot;? This will 
                          permanently delete all their posts, accounts, and configuration.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteClient(client.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Client
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {clients.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No clients yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first client to start managing their social media content.
          </p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Client
          </Button>
        </div>
      )}
    </div>
  )
}