# Accessibility Implementation Guide

## Overview

This document outlines the comprehensive accessibility features implemented in the Ambira application and provides guidelines for maintaining and extending accessibility support.

## WCAG 2.1 Level AA Compliance

Ambira targets WCAG 2.1 Level AA compliance with the following key accessibility features:

### 1. Semantic HTML and Landmark Regions

**Implemented Components:**

- `Header.tsx`: Uses `role="banner"` and `aria-label="Site header"`
- `BottomNavigation.tsx`: Uses `role="navigation"` and `aria-label="Main navigation"`
- `Feed.tsx`: Uses `role="main"` and `aria-label="Activity feed"`
- All navigation elements use semantic `<nav>` elements with proper ARIA labels

**Guidelines:**

```tsx
// ✅ Good - Semantic landmark with ARIA label
<header role="banner" aria-label="Site header">
  <nav role="navigation" aria-label="Main navigation">
    {/* Navigation items */}
  </nav>
</header>

// ❌ Bad - Generic div without semantic meaning
<div className="header">
  <div className="nav">
    {/* Navigation items */}
  </div>
</div>
```

### 2. ARIA Labels and Descriptions

**Interactive Elements:**

All interactive elements (buttons, links, form inputs) have proper ARIA labels:

```tsx
// Navigation links with aria-current for active states
<Link
  href="/"
  aria-label="View feed"
  aria-current={isActive('/') ? 'page' : undefined}
>
  <Home aria-hidden="true" />
  <span>Home</span>
</Link>

// Icon-only buttons with descriptive labels
<button
  onClick={handleSupport}
  aria-label={isSupported ? 'Unlike session' : 'Like session'}
  aria-pressed={isSupported}
>
  <ThumbsUp aria-hidden="true" />
</button>
```

**Icons:**

All decorative icons use `aria-hidden="true"` to hide them from screen readers:

```tsx
<ChevronLeft className="w-6 h-6" aria-hidden="true" />
```

### 3. Form Accessibility

**Implemented in `SaveSession.tsx`:**

- All form inputs have associated `<label>` elements using `htmlFor`
- Required fields marked with `aria-required="true"`
- Error states use `aria-invalid` and `aria-describedby`
- Helper text linked with `aria-describedby`
- Error messages use `role="alert"`

**Best Practices:**

```tsx
// Complete form field example
<div>
  <label htmlFor="session-title">Session Title *</label>
  <input
    id="session-title"
    type="text"
    aria-required="true"
    aria-invalid={!!errors.title}
    aria-describedby={errors.title ? 'title-error' : undefined}
  />
  {errors.title && (
    <p id="title-error" role="alert">
      {errors.title}
    </p>
  )}
</div>

// Toggle buttons with aria-pressed
<button
  type="button"
  onClick={() => handleTagToggle(tag)}
  aria-pressed={(formData.tags || []).includes(tag)}
  aria-label={`${tag} tag`}
>
  {tag}
</button>
```

### 4. Modal Dialogs

**All modals implement:**

- `role="dialog"` and `aria-modal="true"`
- `aria-labelledby` pointing to modal title
- `aria-describedby` for modal content (when applicable)
- ESC key handling for dismissal
- Focus trap (recommended for future enhancement)

**Implemented Modals:**

- `CommentsModal.tsx`
- `LikesModal.tsx`
- `ConfirmDialog.tsx`

**Pattern:**

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
  className="fixed inset-0 z-50"
>
  <div>
    <h1 id="modal-title">Modal Title</h1>
    <p id="modal-description">Modal description</p>
    {/* Modal content */}
    <button onClick={onClose} aria-label="Close modal">
      <X aria-hidden="true" />
    </button>
  </div>
</div>
```

### 5. Live Regions

**Dynamic content uses ARIA live regions:**

- Loading states: `role="status"` with `aria-live="polite"`
- Error messages: `role="alert"` (implicit `aria-live="assertive"`)
- Status updates: `role="status"` with `aria-live="polite"`

**Examples:**

```tsx
// Loading indicator
<div role="status" aria-live="polite">
  <div className="spinner" aria-hidden="true" />
  <span className="sr-only">Loading comments...</span>
</div>

// Error message
<div role="alert">
  Failed to load sessions
</div>

// Status update
<div role="status" aria-live="polite">
  {newSessionsCount} new sessions available
</div>
```

### 6. Lists and Feed Items

**Feed component uses semantic list structure:**

```tsx
<ul aria-label="Activity sessions" role="feed">
  {sessions.map((session, index) => (
    <li key={session.id} role="article" aria-posinset={index + 1} aria-setsize={sessions.length}>
      <SessionCard session={session} />
    </li>
  ))}
</ul>
```

### 7. Interactive State Communication

**All interactive elements communicate their state:**

- Toggle buttons use `aria-pressed`
- Expandable content uses `aria-expanded`
- Current navigation items use `aria-current="page"`
- Menus use `aria-haspopup` and `aria-expanded`

**Example:**

```tsx
;<button
  onClick={() => setShowMenu(!showMenu)}
  aria-label="Session options"
  aria-expanded={showMenu}
  aria-haspopup="menu"
>
  <MoreVertical aria-hidden="true" />
</button>

{
  showMenu && (
    <div role="menu" aria-label="Session options">
      <button role="menuitem">Edit</button>
      <button role="menuitem">Delete</button>
    </div>
  )
}
```

## Screen Reader Support

### Visually Hidden Text

Use the `sr-only` utility class for screen reader-only content:

```tsx
<button>
  <ThumbsUp aria-hidden="true" />
  <span className="sr-only">Like this session</span>
</button>
```

### Skip Links (Recommended Enhancement)

Consider adding skip links for keyboard navigation:

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

## Keyboard Navigation

### Current Implementation

- All interactive elements are keyboard accessible
- Tab order follows logical flow
- ESC key closes modals
- Enter/Space activate buttons

### Recommended Enhancements

1. **Focus Management in Modals:**
   - Trap focus within modal when open
   - Return focus to trigger element on close
   - Focus first interactive element on open

2. **Keyboard Shortcuts:**
   - Consider implementing keyboard shortcuts for common actions
   - Document shortcuts in help section

3. **Focus Indicators:**
   - Ensure visible focus indicators on all interactive elements
   - Use `focus-visible` for mouse vs keyboard distinction

## Testing Guidelines

### Manual Testing Checklist

- [ ] Navigate entire app using keyboard only (Tab, Shift+Tab, Enter, Space, ESC)
- [ ] Test with screen reader (VoiceOver on Mac, NVDA on Windows)
- [ ] Verify all interactive elements have descriptive labels
- [ ] Check color contrast ratios (4.5:1 for normal text, 3:1 for large text)
- [ ] Test with browser zoom at 200%
- [ ] Verify form validation messages are announced
- [ ] Test modal dialogs with keyboard and screen reader

### Automated Testing

Use tools like:

- **axe DevTools**: Browser extension for accessibility scanning
- **Lighthouse**: Chrome DevTools accessibility audit
- **Pa11y**: Command-line accessibility testing
- **WAVE**: Web accessibility evaluation tool

### Screen Reader Testing Commands

**VoiceOver (Mac):**

- `Cmd + F5`: Toggle VoiceOver
- `Ctrl + Option + Right/Left Arrow`: Navigate elements
- `Ctrl + Option + Space`: Activate element

**NVDA (Windows):**

- `Ctrl + Alt + N`: Start NVDA
- `Tab`: Navigate interactive elements
- `Enter/Space`: Activate element
- `H`: Navigate headings
- `L`: Navigate lists

## Component-Specific Guidelines

### Creating New Components

When creating new components, follow this checklist:

1. **Structure:**
   - Use semantic HTML elements
   - Add appropriate ARIA roles only when semantic HTML isn't sufficient
   - Include landmark regions for major sections

2. **Interactive Elements:**
   - All buttons/links need descriptive `aria-label` or visible text
   - Toggle states need `aria-pressed` or `aria-expanded`
   - Current states need `aria-current`

3. **Forms:**
   - Associate labels with inputs using `htmlFor` and `id`
   - Add `aria-required` for required fields
   - Use `aria-invalid` and `aria-describedby` for errors
   - Error messages should have `role="alert"`

4. **Dynamic Content:**
   - Loading states need `role="status"` with hidden text for screen readers
   - Errors need `role="alert"`
   - Use `aria-live="polite"` for non-critical updates

5. **Modals:**
   - Use `role="dialog"` and `aria-modal="true"`
   - Add `aria-labelledby` and `aria-describedby`
   - Handle ESC key and click outside to close
   - Consider focus trapping

## Color and Contrast

### Current Brand Colors

- Primary Blue: `#0066CC` (contrast ratio: 4.58:1 on white)
- Brand Orange: `#FC4C02` (contrast ratio: 3.48:1 on white)
- Success Green: `#34C759` (contrast ratio: 3.04:1 on white)

### Recommendations

- Use darker shades for text on white backgrounds
- Ensure interactive elements meet 3:1 contrast minimum
- Don't rely solely on color to convey information

## Resources

### Documentation

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Tools

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

## Future Enhancements

### Priority 1 (High Impact)

1. **Focus Management:**
   - Implement focus trap in modals
   - Restore focus after modal close
   - Focus first error on form submission

2. **Keyboard Shortcuts:**
   - `N`: New session
   - `H`: Go home
   - `?`: Show keyboard shortcuts help

3. **Preferences:**
   - Reduced motion support
   - High contrast mode
   - Font size adjustments

### Priority 2 (Medium Impact)

1. **Skip Navigation:**
   - Skip to main content
   - Skip to navigation
   - Skip to search

2. **Alternative Text:**
   - User-generated images need alt text input
   - Session images should have descriptive alt text

3. **Headings Hierarchy:**
   - Audit heading levels across app
   - Ensure logical heading structure (h1 → h2 → h3)

### Priority 3 (Enhancement)

1. **Announcements:**
   - ARIA live regions for real-time updates
   - Session upload progress announcements
   - Comment/like notifications

2. **Advanced Navigation:**
   - Landmark navigation shortcuts
   - Rotor support (headings, links, forms)

## Compliance Status

### ✅ Implemented

- Semantic HTML structure
- ARIA labels on all interactive elements
- Form accessibility (labels, errors, validation)
- Modal dialog accessibility
- Live regions for dynamic content
- Keyboard navigation support
- Screen reader support
- List and feed semantics

### 🔄 In Progress

- Focus management in modals
- Comprehensive keyboard shortcuts
- Skip navigation links

### 📋 Planned

- Reduced motion support
- High contrast mode
- User preference controls
- Advanced announcements

## Contact

For accessibility questions or to report issues:

- Create an issue in the repository with the `accessibility` label
- Contact the development team

---

**Last Updated:** 2025-11-25
**WCAG Version:** 2.1 Level AA
**Maintained By:** Development Team
