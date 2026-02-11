'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { PostEditor } from '@/components/post-editor'

function NewPostInner() {
  const searchParams = useSearchParams()
  const prefillContent = searchParams.get('content') || ''
  const prefillSchedule = searchParams.get('scheduled_at') || ''

  return (
    <PostEditor
      initialContent={prefillContent}
      initialSchedule={prefillSchedule}
    />
  )
}

export default function NewPostPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 py-8 text-center">Loading...</div>}>
      <NewPostInner />
    </Suspense>
  )
}
