import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import type { Post, PostStatus } from '@/types'

const DATA_PATH = path.join(process.cwd(), 'data', 'posts.json')

const VALID_STATUSES: PostStatus[] = ['idea', 'writing', 'needs_photos', 'approve_photos', 'review', 'scheduled', 'posted', 'failed']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { status } = await req.json()
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  const posts: Post[] = JSON.parse(await fs.readFile(DATA_PATH, 'utf-8'))
  const idx = posts.findIndex(p => p.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  posts[idx].status = status
  posts[idx].updatedAt = new Date().toISOString()
  await fs.writeFile(DATA_PATH, JSON.stringify(posts, null, 2))
  return NextResponse.json(posts[idx])
}
