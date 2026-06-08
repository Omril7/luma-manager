'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import type { ComponentPropsWithoutRef } from 'react'

type Props = Omit<ComponentPropsWithoutRef<typeof Input>, 'type'>

export function PasswordInput({ className, ...props }: Props) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <Input type={show ? 'text' : 'password'} className={`pl-10 ${className ?? ''}`} {...props} />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute left-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
        onClick={() => setShow(v => !v)}
        tabIndex={-1}
        aria-label={show ? 'הסתר סיסמה' : 'הצג סיסמה'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  )
}
