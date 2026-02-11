'use client'

import { useState } from 'react'
import { Sparkles, Loader2, X as XIcon } from 'lucide-react'
import type { Post } from '@/lib/supabase'

function generatePromptOptions(content: string): { label: string; prompt: string }[] {
  const lc = content.toLowerCase()
  const options: { label: string; prompt: string }[] = []

  const universal = [
    { label: 'Coffee Shop Work', prompt: 'casual iphone photo, man from behind looking at laptop in coffee shop, curly hair visible, slightly blurry background, natural indoor lighting, candid snapshot aesthetic, not professional' },
    { label: 'Dock Sunset', prompt: 'iphone photo, man sitting on dock at sunset, back to camera, casual phone photo, taking photo of sunset with phone, authentic social media post' },
    { label: 'Urban Walk', prompt: 'casual phone photo, man walking on sidewalk from behind, urban downtown setting, natural daylight, instagram story quality, authentic not staged, backpack' },
  ]

  if (lc.includes('waterski') || lc.includes('lake') || lc.includes('water')) {
    options.push(
      { label: 'Lake Dock', prompt: 'iphone photo, man sitting on wooden dock looking at lake, back to camera, sunset, casual snapshot, summer vibes, not professional' },
      { label: 'Boat Vibes', prompt: 'casual phone photo, man on boat from behind, looking out at water, curly hair wind blown, golden hour, authentic' },
    )
  }
  if (lc.includes('landscap') || lc.includes('lawn') || lc.includes('my business') || lc.includes('crew') || lc.includes('work')) {
    options.push(
      { label: 'Work Mode', prompt: 'iphone photo, man from behind walking toward work truck, job site, casual work clothes, authentic snapshot, morning light' },
      { label: 'On Site', prompt: 'casual phone photo, over shoulder shot of man looking at landscaping project, outdoor work setting, natural daylight, candid' },
    )
  }
  if (lc.includes('entrepreneur') || lc.includes('business') || lc.includes('company') || lc.includes('ceo')) {
    options.push(
      { label: 'Office Window', prompt: 'iphone photo, man from behind looking out office window at city, arms crossed, silhouette, contemplative, not professional photography' },
      { label: 'Desk Grind', prompt: 'casual phone photo, over shoulder shot of man at desk with monitor showing code, messy authentic home office, natural window light' },
    )
  }
  if (lc.includes('learn') || lc.includes('school') || lc.includes('student') || lc.includes('college')) {
    options.push(
      { label: 'Campus Walk', prompt: 'iphone photo, man walking on college campus from behind, backpack, casual student style, autumn day, authentic snapshot' },
      { label: 'Study Session', prompt: 'casual phone photo, over shoulder of man studying at library, laptop and books, natural lighting, candid student life' },
    )
  }
  if (lc.includes('journey') || lc.includes('grind') || lc.includes('hustle') || lc.includes('early')) {
    options.push(
      { label: 'Sunrise Path', prompt: 'iphone photo, man from behind walking on path toward sunrise, silhouette, inspiring journey shot, casual phone quality' },
      { label: 'Morning Grind', prompt: 'casual phone photo, man from behind at coffee shop window, laptop open, morning light, authentic work moment' },
    )
  }

  return [...options, ...universal].slice(0, 6)
}

interface AIPhotoModalProps {
  post: Post
  onClose: () => void
  onGenerate: (prompt: string) => void
  generating: boolean
}

export function AIPhotoModal({ post, onClose, onGenerate, generating }: AIPhotoModalProps) {
  const options = generatePromptOptions(post.content || '')
  const [prompt, setPrompt] = useState(options[0]?.prompt || '')
  const [selectedOption, setSelectedOption] = useState<number | null>(0)

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50">
      <div className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#e2b93b]/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#e2b93b]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Generate AI Photo</h3>
                <p className="text-sm text-gray-500">Pick a vibe or customize your own</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center">
              <XIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-xs text-gray-400 mb-1">Post content:</p>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mb-4 line-clamp-2">{post.content}</p>

          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Choose a vibe:</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => { setSelectedOption(i); setPrompt(opt.prompt) }}
                className={`text-left p-3 rounded-lg border-2 transition-all min-h-[60px] ${
                  selectedOption === i ? 'border-[#254421] bg-[#254421]/5' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="font-medium text-sm">{opt.label}</span>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{opt.prompt.slice(0, 60)}...</p>
              </button>
            ))}
          </div>

          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Or customize:</p>
          <textarea
            value={prompt}
            onChange={e => { setPrompt(e.target.value); setSelectedOption(null) }}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#254421] focus:border-transparent"
            placeholder="Describe the photo..."
          />
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
          <button onClick={onClose} disabled={generating} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 min-h-[44px]">
            Cancel
          </button>
          <button
            onClick={() => onGenerate(prompt)}
            disabled={generating || !prompt.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#254421] rounded-lg hover:bg-[#1a3318] disabled:opacity-50 min-h-[44px]"
          >
            {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4" />Generate</>}
          </button>
        </div>
        <div className="h-6 md:hidden" />
      </div>
    </div>
  )
}
