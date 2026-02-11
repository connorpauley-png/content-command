'use client'

import { Sparkles } from 'lucide-react'
import { PLATFORM_PILL, ALL_PLATFORM_IDS } from './types'

interface PlatformFilterProps {
  filters: string[]
  onChange: (filters: string[]) => void
}

export function PlatformFilter({ filters, onChange }: PlatformFilterProps) {
  const toggle = (pid: string) => {
    onChange(filters.includes(pid) ? filters.filter(f => f !== pid) : [...filters, pid])
  }

  return (
    <div className="sticky top-0 z-30 bg-gray-50 -mx-4 md:-mx-6 px-4 md:px-6 py-3 border-b border-gray-200">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mr-1">Filter:</span>
        <button
          onClick={() => onChange([])}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all min-h-[36px] ${
            filters.length === 0
              ? 'bg-[#254421] text-white border-[#254421]'
              : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
          }`}
        >
          All
        </button>
        {ALL_PLATFORM_IDS.map(pid => {
          const pill = PLATFORM_PILL[pid]
          const active = filters.includes(pid)
          return (
            <button
              key={pid}
              onClick={() => toggle(pid)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all min-h-[36px] ${
                active
                  ? `${pill.activeClass} border-transparent shadow-sm`
                  : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
              }`}
            >
              {pill.label}
              {pill.useAI && <Sparkles className="w-3 h-3 inline ml-1" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
