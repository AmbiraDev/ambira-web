import * as React from 'react'
import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[120px] w-full rounded-xl border-2 border-b-4 border-[#E5E5E5] bg-[#F7F7F7] px-4 py-3 text-base text-[#3C3C3C] font-semibold transition-all placeholder:text-[#AFAFAF] focus-visible:outline-none focus-visible:border-[#1CB0F6] focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-50 resize-none',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export { Textarea }
