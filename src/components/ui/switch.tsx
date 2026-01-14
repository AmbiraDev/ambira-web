import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, checked, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked)
    }

    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          {...props}
        />
        <div
          className={cn(
            'w-14 h-8 bg-[#E5E5E5] rounded-full peer border-2 border-[#DADADA] peer-focus:ring-4 peer-focus:ring-[#58CC02]/20 peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[""] after:absolute after:top-1 after:left-1 after:bg-white after:border-[#DADADA] after:border-2 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#58CC02] peer-checked:border-[#45A000] peer-checked:after:bg-white peer-checked:after:border-white',
            className
          )}
        />
      </label>
    )
  }
)
Switch.displayName = 'Switch'

export { Switch }
