import React from 'react'

interface IconRendererProps {
  iconName: string
  className?: string
  size?: number
  style?: React.CSSProperties
}

/**
 * Simple check for emojis.
 * - Returns true for most single-emoji strings.
 * - Rejects iconify/lucide strings like "mdi:home"
 */
function isEmoji(str: string): boolean {
  if (!str) return false

  // Reject iconify/lucide patterns
  if (str.includes(':')) return false

  // Reject multi-character text
  if (str.length > 3) return false

  // Basic unicode emoji range match
  return /\p{Emoji}/u.test(str)
}

/**
 * Emoji-only icon renderer.
 * - If iconName is an emoji → render it
 * - Otherwise → render nothing
 */
export const IconRenderer: React.FC<IconRendererProps> = ({
  iconName,
  className = '',
  size = 20,
  style,
}) => {
  if (!iconName || !isEmoji(iconName)) return null

  return (
    <span
      className={className}
      style={{
        fontSize: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
        ...style,
      }}
    >
      {iconName}
    </span>
  )
}

export default IconRenderer
