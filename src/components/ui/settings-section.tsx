import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsSectionProps {
  children: React.ReactNode;
  className?: string;
}

interface SettingsHeaderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

interface SettingsCardProps {
  children: React.ReactNode;
  className?: string;
}

interface SettingsCardHeaderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

interface SettingsCardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SettingsFieldProps {
  icon?: LucideIcon;
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

interface SettingsRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

// Main container with consistent spacing
export const SettingsSection: React.FC<SettingsSectionProps> = ({
  children,
  className,
}) => {
  return <div className={cn('space-y-6', className)}>{children}</div>;
};

// Page header with icon and description
export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  icon: Icon,
  title,
  description,
  className,
}) => {
  return (
    <div className={cn('mb-8', className)}>
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
        {Icon && <Icon className="w-6 h-6 text-[#0066CC]" />}
        {title}
      </h2>
      {description && <p className="text-gray-600 text-sm">{description}</p>}
    </div>
  );
};

// Card container for grouped settings
export const SettingsCard: React.FC<SettingsCardProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 overflow-hidden',
        className
      )}
    >
      {children}
    </div>
  );
};

// Card header with title and description
export const SettingsCardHeader: React.FC<SettingsCardHeaderProps> = ({
  icon: Icon,
  title,
  description,
  className,
}) => {
  return (
    <div className={cn('px-6 py-4 border-b border-gray-200', className)}>
      <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-[#0066CC]" />}
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      )}
    </div>
  );
};

// Card content area
export const SettingsCardContent: React.FC<SettingsCardContentProps> = ({
  children,
  className,
}) => {
  return <div className={cn('px-6 py-4', className)}>{children}</div>;
};

// Individual field with label and input
export const SettingsField: React.FC<SettingsFieldProps> = ({
  icon: Icon,
  label,
  description,
  children,
  className,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        {Icon && <Icon className="w-4 h-4 text-gray-500" />}
        {label}
      </label>
      {children}
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
  );
};

// Row layout for settings with toggle/checkbox on right
export const SettingsRow: React.FC<SettingsRowProps> = ({
  label,
  description,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-start justify-between py-3 border-b border-gray-200 last:border-0',
        className
      )}
    >
      <div className="flex-1 pr-4">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
};

// Group of settings rows
export const SettingsRowGroup: React.FC<SettingsCardContentProps> = ({
  children,
  className,
}) => {
  return <div className={cn('space-y-0', className)}>{children}</div>;
};
