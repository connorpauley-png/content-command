'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Filter } from 'lucide-react'
import { CONTENT_TYPE_CATEGORIES, getContentTypeLabel } from '@/lib/content-types'
import type { ContentType } from '@/types'

interface ContentTypeFilterProps {
  selected: ContentType[]
  onChange: (types: ContentType[]) => void
}

export function ContentTypeFilter({ selected, onChange }: ContentTypeFilterProps) {
  const [open, setOpen] = useState(false)

  const toggle = (type: ContentType) => {
    onChange(
      selected.includes(type)
        ? selected.filter((t) => t !== type)
        : [...selected, type]
    )
  }

  const toggleCategory = (types: ContentType[]) => {
    const allSelected = types.every((t) => selected.includes(t))
    if (allSelected) {
      onChange(selected.filter((t) => !types.includes(t)))
    } else {
      onChange(Array.from(new Set([...selected, ...types])))
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Filter className="h-3.5 w-3.5" />
          Content Type
          {selected.length > 0 && (
            <span className="ml-1 rounded-full bg-primary text-primary-foreground text-[10px] px-1.5">
              {selected.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          {CONTENT_TYPE_CATEGORIES.map((cat) => (
            <div key={cat.category}>
              <button
                onClick={() => toggleCategory(cat.types)}
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 hover:text-foreground"
              >
                {cat.label}
              </button>
              <div className="space-y-1">
                {cat.types.map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer text-sm py-0.5">
                    <Checkbox
                      checked={selected.includes(type)}
                      onCheckedChange={() => toggle(type)}
                    />
                    {getContentTypeLabel(type)}
                  </label>
                ))}
              </div>
            </div>
          ))}
          {selected.length > 0 && (
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => onChange([])}>
              Clear all
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
