import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Controls the height of the input. Does not conflict with the native HTML `size` attribute. */
  inputSize?: 'sm' | 'default'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputSize, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex w-full rounded-md border text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 field-skeu',
        inputSize === 'sm' ? 'h-7 px-2 py-1 text-xs' : 'h-10 px-3 py-2',
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export { Input }
