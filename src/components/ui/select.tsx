'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    dir="rtl"
    className={cn(
      /* Icon is absolutely positioned on the RIGHT (physical right = RTL reading-start).
         pr-9 reserves space so value text does not overlap the icon.
         text-right aligns the selected value toward the right edge. */
      'relative flex h-10 w-full items-center rounded-md border pr-9 pl-3 py-2 text-sm text-right',
      'placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/40',
      'disabled:cursor-not-allowed disabled:opacity-50 field-skeu',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 shrink-0" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    {/* dir="rtl" must be explicit — the Portal renders outside the DOM tree
        so it cannot inherit dir from <html>. */}
    <SelectPrimitive.Content
      ref={ref}
      dir="rtl"
      className={cn(
        'relative z-50 min-w-[8rem] overflow-hidden rounded-xl border bg-popover text-popover-foreground card-skeu',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        position === 'popper' && 'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport className={cn(
        'p-1',
        position === 'popper' && 'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
      )}>
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('py-1.5 pr-2 pl-8 text-sm font-semibold text-muted-foreground text-right', className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      /* dir="rtl" inherited from SelectContent → flex flows right-to-left.
         Indicator span is FIRST in DOM → appears on the RIGHT (RTL reading start).
         ItemText is SECOND → appears to the left of the indicator. */
      'flex items-center gap-2 w-full cursor-default select-none rounded-lg py-1.5 px-2 text-sm outline-none',
      'focus:bg-accent/15 focus:text-accent-foreground',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      'transition-colors',
      className
    )}
    {...props}
  >
    {/* Checkmark indicator — first in DOM = rightmost in RTL flex */}
    <span className="w-4 h-4 flex items-center justify-center shrink-0 text-primary">
      <SelectPrimitive.ItemIndicator>
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-muted', className)} {...props} />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator }
