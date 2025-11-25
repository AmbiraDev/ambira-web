/**
 * Standardized typography and styling constants for legal/help/static pages
 * Ensures visual consistency across all non-app pages
 */

export const staticPageStyles = {
  // Typography
  typography: {
    // Page title (h1)
    pageTitle: 'text-3xl md:text-4xl font-bold text-gray-900',

    // Section headings (h2)
    sectionHeading: 'text-2xl font-bold text-gray-900',

    // Subsection headings (h3)
    subsectionHeading: 'text-lg font-semibold text-gray-900',

    // Body text
    bodyText: 'text-base text-gray-700 leading-relaxed',

    // Small text / captions
    smallText: 'text-sm text-gray-600',

    // Page description/subtitle
    pageDescription: 'text-base md:text-lg text-gray-600',
  },

  // Link styles
  links: {
    // Standard inline link (brand compliant with accessible contrast)
    inline: 'text-[#0066CC] hover:text-[#0051D5] underline transition-colors',

    // Link without underline (for cards/buttons)
    plain: 'text-[#0066CC] hover:text-[#0051D5] transition-colors',

    // Email link
    email: 'text-[#0066CC] hover:text-[#0051D5] underline transition-colors',
  },

  // Container styles
  containers: {
    // Main page wrapper
    page: 'min-h-screen bg-gray-50',

    // Content container
    content: 'container mx-auto px-4 py-8 max-w-4xl',

    // White card/section
    card: 'bg-white rounded-lg shadow-sm p-6 md:p-8',

    // Highlighted box (for key info)
    highlightBox: 'bg-gray-50 p-4 rounded-lg',
  },

  // Spacing
  spacing: {
    // Section bottom margin
    sectionMargin: 'mb-6 md:mb-8',

    // Space between elements in a section
    elementSpacing: 'space-y-4',

    // Space between paragraphs
    paragraphSpacing: 'mb-4',
  },

  // List styles
  lists: {
    // Unordered list container
    container: 'space-y-3',

    // List item
    item: 'flex items-start',

    // Bullet
    bullet: 'text-[#0066CC] mr-2 mt-1',
  },

  // Icon styles
  icons: {
    // Small icon (next to headings)
    small: 'w-5 h-5',

    // Medium icon (standalone)
    medium: 'w-6 h-6',

    // Large icon (hero sections)
    large: 'w-8 h-8',

    // Icon colors
    primary: 'text-[#0066CC]',
    white: 'text-white',
  },

  // Colored backgrounds (for icon boxes)
  iconBackgrounds: {
    blue: 'bg-[#0066CC]',
    green: 'bg-[#34C759]',
    orange: 'bg-[#FF9500]',
    red: 'bg-[#FF3B30]',
  },

  // Button variants (using existing Button component)
  // These are just references for consistency
  buttons: {
    primary: 'Uses Button component default',
    secondary: 'Uses Button component variant="secondary"',
    outline: 'Uses Button component variant="outline"',
    ghost: 'Uses Button component variant="ghost"',
  },

  // Back button
  backButton: 'mb-4',

  // Last updated date
  lastUpdated: 'text-sm text-gray-500',

  // Gradient CTA sections
  gradientCta: 'bg-gradient-to-r from-[#0066CC] to-[#0051D5] text-white rounded-lg p-6 md:p-8',
} as const

/**
 * Helper function to get combined classes
 */
export const getPageHeaderClasses = () => ({
  wrapper: staticPageStyles.spacing.sectionMargin,
  backButton: staticPageStyles.backButton,
  title: staticPageStyles.typography.pageTitle,
  description: staticPageStyles.typography.pageDescription,
})

export const getSectionClasses = () => ({
  card: `${staticPageStyles.containers.card} ${staticPageStyles.spacing.sectionMargin}`,
  heading: `${staticPageStyles.typography.sectionHeading} mb-4`,
  body: staticPageStyles.typography.bodyText,
})

export const getLinkClasses = () => ({
  inline: staticPageStyles.links.inline,
  email: staticPageStyles.links.email,
})
