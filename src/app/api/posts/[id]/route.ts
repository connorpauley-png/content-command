import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import type { Post } from '@/types'

const DATA_PATH = path.join(process.cwd(), 'data', 'posts.json')

async function readPosts(): Promise<Post[]> {
  const data = await fs.readFile(DATA_PATH, 'utf-8')
  return JSON.parse(data)
}

async function writePosts(posts: Post[]): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(posts, null, 2))
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const posts = await readPosts()
  const post = posts.find(p => p.id === id)
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(post)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const posts = await readPosts()
  const idx = posts.findIndex(p => p.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  posts[idx] = { ...posts[idx], ...body, id, updatedAt: new Date().toISOString() }
  await writePosts(posts)
  return NextResponse.json(posts[idx])
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const posts = await readPosts()
  const idx = posts.findIndex(p => p.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  posts.splice(idx, 1)
  await writePosts(posts)
  return NextResponse.json({ success: true })
}
