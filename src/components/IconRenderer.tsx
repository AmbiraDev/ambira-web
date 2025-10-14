import React from 'react';
import * as Icons from 'lucide-react';
import { Icon } from '@iconify/react';

interface IconRendererProps {
  iconName: string;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

/**
 * Dynamically renders an icon based on the icon name string
 * Supports both Iconify icons (e.g., "flat-color-icons:briefcase") and legacy Lucide icons (e.g., "Briefcase")
 * Falls back to Briefcase icon if the icon name is not found
 */
export const IconRenderer: React.FC<IconRendererProps> = ({ iconName, className = '', size = 24, style }) => {
  // Check if it's an Iconify icon (contains a colon, e.g., "flat-color-icons:briefcase")
  if (iconName && iconName.includes(':')) {
    return <Icon icon={iconName} width={size} height={size} className={className} style={style} />;
  }

  // Legacy Lucide icon support (e.g., "Briefcase")
  // If iconName is empty or invalid, fall back to Briefcase
  const IconComponent = (iconName && (Icons as any)[iconName]) || Icons.Briefcase;
  return <IconComponent className={className} size={size} style={style} />;
};

export default IconRenderer;
