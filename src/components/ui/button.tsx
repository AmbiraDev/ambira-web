import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1CB0F6] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation border-2 border-b-4 active:border-b-2 active:translate-y-[2px]',
  {
    variants: {
      variant: {
        default: 'bg-[#58CC02] border-[#45A000] text-white hover:brightness-105',
        destructive: 'bg-[#FF4B4B] border-[#EA2B2B] text-white hover:brightness-105',
        outline: 'border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] text-[#3C3C3C]',
        secondary: 'bg-[#1CB0F6] border-[#0088CC] text-white hover:brightness-105',
        ghost: 'text-[#AFAFAF] hover:text-[#3C3C3C] hover:bg-[#F7F7F7] border-transparent',
        link: 'text-[#1CB0F6] underline-offset-4 hover:underline border-transparent',
        gold: 'bg-[#FFC800] border-[#E5B400] text-[#3C3C3C] hover:brightness-105',
        purple: 'bg-[#CE82FF] border-[#A855F7] text-white hover:brightness-105',
        orange: 'bg-[#FF9600] border-[#FF7700] text-white hover:brightness-105',
      },
      size: {
        default: 'h-12 min-h-[48px] px-6 py-3',
        sm: 'h-10 min-h-[40px] px-4 py-2 text-xs',
        lg: 'h-14 min-h-[56px] px-10 py-4 text-base',
        icon: 'h-12 w-12 min-h-[48px] min-w-[48px] p-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'span' : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
