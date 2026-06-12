import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground border border-primary/80 [background-image:linear-gradient(to_bottom,rgba(255,255,255,0.13)_0%,rgba(0,0,0,0.09)_100%)] btn-skeu',
        destructive:
          'bg-destructive text-destructive-foreground border border-destructive/80 [background-image:linear-gradient(to_bottom,rgba(255,255,255,0.12)_0%,rgba(0,0,0,0.1)_100%)] btn-skeu',
        outline:
          'bg-card text-foreground border border-border [background-image:linear-gradient(to_bottom,rgba(255,255,255,0.7)_0%,rgba(0,0,0,0.03)_100%)] hover:border-border/80 btn-skeu',
        secondary:
          'bg-secondary text-secondary-foreground border border-border/60 [background-image:linear-gradient(to_bottom,rgba(255,255,255,0.45)_0%,rgba(0,0,0,0.03)_100%)] btn-skeu',
        ghost:
          'hover:bg-accent/20 hover:text-accent-foreground transition-colors',
        link:
          'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
