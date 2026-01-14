import * as React from 'react'
import { cn } from '@/lib/utils'

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-12 w-full rounded-xl border-2 border-b-4 border-[#E5E5E5] bg-[#F7F7F7] px-4 py-3 text-base text-[#3C3C3C] font-semibold transition-all focus-visible:outline-none focus-visible:border-[#1CB0F6] focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = 'Select'

const SelectTrigger = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <select
      className={cn(
        'flex h-12 w-full items-center justify-between rounded-xl border-2 border-b-4 border-[#E5E5E5] bg-[#F7F7F7] px-4 py-3 text-base text-[#3C3C3C] font-semibold transition-all focus-visible:outline-none focus-visible:border-[#1CB0F6] focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer',
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  )
})
SelectTrigger.displayName = 'SelectTrigger'

const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative z-50 min-w-[8rem] overflow-hidden rounded-xl border-2 border-[#E5E5E5] bg-white text-[#3C3C3C] shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
SelectContent.displayName = 'SelectContent'

const SelectItem = React.forwardRef<
  HTMLOptionElement,
  React.OptionHTMLAttributes<HTMLOptionElement>
>(({ className, children, ...props }, ref) => (
  <option
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-4 pr-2 text-base font-semibold outline-none hover:bg-[#F7F7F7] focus:bg-[#F7F7F7] data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    {children}
  </option>
))
SelectItem.displayName = 'SelectItem'

const SelectValue = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn('block truncate font-semibold', className)} {...props} />
  )
)
SelectValue.displayName = 'SelectValue'

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue }
