import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-xl border-2 border-b-4 border-[#E5E5E5] bg-[#F7F7F7] px-4 py-3 text-base text-[#3C3C3C] font-semibold transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#AFAFAF] focus-visible:outline-none focus-visible:border-[#1CB0F6] focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
