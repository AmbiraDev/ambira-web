import React from 'react'

interface IconRendererProps {
  iconName: string
  className?: string
  size?: number
  style?: React.CSSProperties
}

/**
 * Emoji-first IconRenderer
 *
 * - If iconName looks like an old Iconify string (contains ':'), render nothing.
 * - Otherwise, just render the raw string in a <span>.
 *
 * This assumes:
 * - New activities store plain emojis (e.g., "📚", "🎧").
 * - Old iconify-based activities should be visually hidden instead of showing raw text.
 */
export const IconRenderer: React.FC<IconRendererProps> = ({
  iconName,
  className = '',
  size = 24,
  style,
}) => {
  if (!iconName) return null

  // Hide any legacy iconify identifiers like "flat-color-icons:briefcase"
  if (iconName.includes(':')) {
    return null
  }

  // Just render whatever string we have (emoji, short text, etc.)
  const mergedStyle: React.CSSProperties = {
    fontSize: size,
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  }

  return (
    <span className={className} style={mergedStyle} aria-hidden="true">
      {iconName}
    </span>
  )
}

export default IconRenderer
