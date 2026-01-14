import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsSectionProps {
  children: React.ReactNode
  className?: string
}

interface SettingsHeaderProps {
  icon?: LucideIcon
  title: string
  description?: string
  className?: string
}

interface SettingsCardProps {
  children: React.ReactNode
  className?: string
}

interface SettingsCardHeaderProps {
  icon?: LucideIcon
  title: string
  description?: string
  className?: string
}

interface SettingsCardContentProps {
  children: React.ReactNode
  className?: string
}

interface SettingsFieldProps {
  icon?: LucideIcon
  label: string
  description?: string
  children: React.ReactNode
  className?: string
}

interface SettingsRowProps {
  label: string
  description?: string
  children: React.ReactNode
  className?: string
}

// Main container with consistent spacing
export const SettingsSection: React.FC<SettingsSectionProps> = ({ children, className }) => {
  return <div className={cn('space-y-6', className)}>{children}</div>
}

// Page header with icon and description - Duolingo style (light)
export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  icon: Icon,
  title,
  description,
  className,
}) => {
  return (
    <div className={cn('mb-8', className)}>
      <h2 className="text-2xl font-extrabold text-[#3C3C3C] flex items-center gap-3 mb-2">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#58CC02] to-[#45A000] flex items-center justify-center">
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
        {title}
      </h2>
      {description && <p className="text-[#777777] text-sm ml-13">{description}</p>}
    </div>
  )
}

// Card container for grouped settings - Duolingo style (light)
export const SettingsCard: React.FC<SettingsCardProps> = ({ children, className }) => {
  return (
    <div
      className={cn('bg-white rounded-2xl border-2 border-[#E5E5E5] overflow-hidden', className)}
    >
      {children}
    </div>
  )
}

// Card header with title and description - Duolingo style (light)
export const SettingsCardHeader: React.FC<SettingsCardHeaderProps> = ({
  icon: Icon,
  title,
  description,
  className,
}) => {
  return (
    <div className={cn('px-6 py-4 border-b-2 border-[#E5E5E5]', className)}>
      <h3 className="text-base font-bold text-[#3C3C3C] flex items-center gap-2">
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1CB0F6] to-[#0088CC] flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
        {title}
      </h3>
      {description && <p className="text-sm text-[#777777] mt-1 ml-10">{description}</p>}
    </div>
  )
}

// Card content area
export const SettingsCardContent: React.FC<SettingsCardContentProps> = ({
  children,
  className,
}) => {
  return <div className={cn('px-6 py-4', className)}>{children}</div>
}

// Individual field with label and input - Duolingo style (light)
export const SettingsField: React.FC<SettingsFieldProps> = ({
  icon: Icon,
  label,
  description,
  children,
  className,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="flex items-center gap-2 text-sm font-bold text-[#3C3C3C]">
        {Icon && <Icon className="w-4 h-4 text-[#AFAFAF]" />}
        {label}
      </label>
      {children}
      {description && <p className="text-xs text-[#AFAFAF]">{description}</p>}
    </div>
  )
}

// Row layout for settings with toggle/checkbox on right - Duolingo style (light)
export const SettingsRow: React.FC<SettingsRowProps> = ({
  label,
  description,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-start justify-between py-4 border-b-2 border-[#E5E5E5] last:border-0',
        className
      )}
    >
      <div className="flex-1 pr-4">
        <div className="text-sm font-bold text-[#3C3C3C]">{label}</div>
        {description && <p className="text-xs text-[#AFAFAF] mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

// Group of settings rows
export const SettingsRowGroup: React.FC<SettingsCardContentProps> = ({ children, className }) => {
  return <div className={cn('space-y-0', className)}>{children}</div>
}
