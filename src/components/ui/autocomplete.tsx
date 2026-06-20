'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface AutocompleteOption {
  value: string
  label: string
  description?: string
}

interface Props {
  options: AutocompleteOption[]
  value: string
  onChange: (value: string) => void
  onSelect: (option: AutocompleteOption) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
}

export function Autocomplete({
  options, value, onChange, onSelect,
  placeholder, emptyMessage = 'לא נמצאו תוצאות', className,
}: Props) {
  const [open, setOpen] = useState(false)

  const q = value.trim().toLowerCase()
  const filtered = q
    ? options.filter(o =>
        o.label.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q)
      )
    : options

  return (
    <div className={cn('relative', className)}>
      <Input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
      />
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-44 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">{emptyMessage}</p>
          ) : (
            filtered.map(opt => (
              <button
                key={opt.value}
                type="button"
                onMouseDown={() => { onSelect(opt); setOpen(false) }}
                className="w-full text-right px-3 py-2 text-sm hover:bg-muted flex justify-between items-center gap-2"
              >
                <span>{opt.label}</span>
                {opt.description && (
                  <span className="text-xs text-muted-foreground shrink-0">{opt.description}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
