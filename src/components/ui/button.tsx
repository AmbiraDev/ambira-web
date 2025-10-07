import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation',
  {
    variants: {
      variant: {
        default: 'bg-[#007AFF] text-white hover:bg-[#0051D5]',
        destructive: 'bg-[#EF4444] text-white hover:bg-[#DC2626]',
        outline: 'border border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50 text-gray-700',
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        ghost: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
        link: 'text-[#007AFF] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 min-h-[44px] px-4 py-2',
        sm: 'h-9 min-h-[36px] px-3',
        lg: 'h-11 min-h-[44px] px-8',
        icon: 'h-10 w-10 min-h-[44px] min-w-[44px] p-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'span' : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
