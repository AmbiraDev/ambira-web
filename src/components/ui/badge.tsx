import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border-2 px-3 py-1 text-xs font-bold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-[#1CB0F6] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-[#45A000] bg-[#58CC02] text-white',
        secondary: 'border-[#0088CC] bg-[#1CB0F6] text-white',
        destructive: 'border-[#EA2B2B] bg-[#FF4B4B] text-white',
        outline: 'border-[#E5E5E5] bg-white text-[#3C3C3C]',
        gold: 'border-[#E5B400] bg-[#FFC800] text-[#3C3C3C]',
        purple: 'border-[#A855F7] bg-[#CE82FF] text-white',
        orange: 'border-[#FF7700] bg-[#FF9600] text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
