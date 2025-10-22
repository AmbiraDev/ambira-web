# Design Principles

Ambira's design philosophy draws inspiration from Strava's clean, activity-focused aesthetic while establishing its own unique identity for productivity tracking. These principles guide all visual and interaction design decisions.

## Core Philosophy

### Strava-Inspired, Productivity-Focused
- **Activity-First Design**: Like Strava showcases workouts, we showcase work sessions as the primary content
- **Social Motivation**: Visual design encourages sharing achievements and celebrating progress
- **Data Visualization**: Clear, motivating presentation of metrics, streaks, and progress
- **Clean & Minimal**: White backgrounds, generous spacing, focused color palette
- **Mobile-First**: Optimized for on-the-go session tracking and feed browsing

### Our Unique Identity
- **Electric Blue Theme**: `#007AFF` as our primary brand color (vs Strava's orange)
- **Productivity Aesthetics**: Work-focused iconography and terminology
- **Inter Font Family**: Modern, readable typeface for all text
- **Lucide React Icons**: Consistent, clean icon system throughout
- **Professional Yet Social**: Balances productivity tracking with community features

## Design Pillars

### 1. Clarity & Readability

**Typography Hierarchy**
- Use Inter font family exclusively (100-900 weights available)
- Establish clear hierarchy: headings (text-xl to text-3xl), body (text-base), secondary (text-sm), metadata (text-xs)
- Maintain high contrast: black text on white backgrounds, muted grays for secondary content
- Line height: 1.6 for body, 1.3-1.5 for headings and compact content

**Visual Hierarchy**
- Most important actions use Electric Blue (`#007AFF`)
- Secondary actions use outlined or ghost button variants
- Destructive actions use red (`#EF4444`)
- Create visual breathing room with consistent spacing (16px, 24px, 32px increments)

**Content Structure**
- Cards (`rounded-lg border shadow-sm`) group related information
- Consistent padding: `p-6` for cards, `px-4 py-2` for buttons
- Clear section breaks using subtle borders or background color changes

### 2. Consistent & Predictable

**Component Reusability**
- Use shadcn/ui components from `/src/components/ui/` for all primitives
- Never create one-off styled elements; extend existing components with variants
- Maintain consistent button heights, input sizes, and interactive element dimensions

**Spacing System**
- Follow Tailwind's spacing scale: 4px base unit (0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24)
- Use `gap-*` for flex/grid layouts, `space-y-*` for vertical stacks
- Mobile padding: `px-4 py-4`, Desktop: often `px-6` or `px-8`
- Consistent card padding: `p-6` (24px)

**Color Palette Discipline**
- Stick to defined color system (Electric Blue, Success Green, grays, destructive red)
- Use CSS custom properties for colors that might theme
- Avoid arbitrary color values; always use Tailwind classes or defined hex values

**Interaction Patterns**
- All interactive elements have consistent hover, active, and focus states
- Focus ring: `focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2`
- Hover: slight color darkening or background change
- Disabled: 50% opacity with `pointer-events-none`

### 3. Responsive & Accessible

**Mobile-First Development**
- Design for mobile screens first, enhance for desktop
- Use Tailwind's responsive prefixes: `md:` (768px+), `lg:` (1024px+)
- Mobile: single column, bottom navigation
- Desktop: three-column layout (left sidebar, feed center, right sidebar)

**Touch-Friendly Targets**
- Minimum 44x44px touch targets on all interactive elements (Apple HIG standard)
- Buttons: `min-h-[44px]`, icon buttons: `min-h-[44px] min-w-[44px]`
- Adequate spacing between tap targets (at least 8px)
- Remove tap highlight: `-webkit-tap-highlight-color: transparent`

**Keyboard Navigation**
- All interactive elements must be keyboard accessible
- Visible focus indicators on all focusable elements
- Logical tab order matching visual layout
- Support Escape key to close modals/dropdowns

**Screen Reader Support**
- Semantic HTML: use `<button>`, `<nav>`, `<main>`, `<article>` appropriately
- ARIA labels for icon-only buttons
- Alt text for all images and meaningful graphics
- Announce dynamic content changes with ARIA live regions

**Color Contrast**
- Text contrast ratio minimum 4.5:1 for normal text, 3:1 for large text (WCAG AA)
- Electric Blue on white: passes AA for normal text
- Muted gray `#6b7280` on white: passes AA
- Never rely on color alone to convey information

### 4. Performance-Conscious

**Optimized Rendering**
- Minimize layout shifts: set explicit dimensions for dynamic content
- Use CSS transforms for animations (not top/left/width)
- Lazy load images and off-screen content
- Debounce search inputs and expensive operations

**Animation Guidelines**
- Use transitions for state changes: `transition-colors`, `transition-all`
- Keep animations subtle and quick (200-300ms)
- Respect `prefers-reduced-motion` media query
- Avoid animating expensive properties (box-shadow, border-radius)

**Asset Optimization**
- Use SVG icons (Lucide React) instead of icon fonts or PNGs
- Optimize images before upload (compress, resize, modern formats)
- Lazy load below-the-fold content
- Code-split routes with Next.js dynamic imports

### 5. Data-Driven & Motivating

**Progress Visualization**
- Use Strava-inspired activity cards for sessions
- Display metrics prominently: duration, project, streaks
- Show trends with icons (up/down arrows) and color coding (green for positive)
- Celebrate milestones with badges, achievements, and visual flourishes

**Stat Presentation**
- Large numbers with clear labels
- Icon + color + number pattern (e.g., blue clock + "2h 34m")
- Comparison data when relevant (vs last week, vs goal)
- Use Success Green `#34C759` for positive metrics

**Feed Design**
- Session cards are the primary content type (not separate posts)
- Show social engagement: support count, comment count, share options
- Display user avatar, project name, session details prominently
- Keep feed scannable: consistent card layout, clear visual breaks

### 6. Delightful Micro-Interactions

**Feedback on Actions**
- Button hover states: color darkening or background change
- Loading states: spinners, skeleton screens, or progress indicators
- Success feedback: green checkmarks, success messages, count updates
- Error handling: red error messages, field-level validation, helpful hints

**Interactive Elements**
- Range sliders scale on hover (1.1x) and active (1.15x)
- Support button fills with Electric Blue when clicked
- Comment count increments immediately with optimistic updates
- Streak counter pulses on new streak day

**Smooth Transitions**
- Modal overlays fade in with backdrop
- Slide-up animations for bottom sheets and toasts
- Page transitions feel instant (Next.js App Router)
- Skeleton loaders during data fetching

## Icon System

### Lucide React Icons
- **Official Library**: Use `lucide-react` package exclusively
- **Consistency**: Never mix icon libraries (no Font Awesome, Heroicons, etc.)
- **Sizing**: `w-4 h-4` (16px), `w-5 h-5` (20px), `w-6 h-6` (24px), `w-8 h-8` (32px)
- **Stroke Width**: Default 2px, can use 1.5px for lighter feel
- **Color**: Inherit from parent text color for flexibility

### Icon Usage Guidelines
- **Navigation**: Menu, X, ChevronDown, Home, Search
- **Social**: Heart, MessageCircle, Share2, Users, UserPlus
- **Time/Progress**: Clock, Timer, Calendar, TrendingUp, BarChart3
- **Actions**: Edit3, Trash2, Plus, Check, MoreVertical
- **Projects**: ListTodo, Tag, FolderOpen, Target
- **Challenges**: Trophy, Zap, Target, MapPin
- **Achievements**: Award, Star, Medal, Crown
- **Status**: Lock, Unlock, Eye, EyeOff, AlertCircle, CheckCircle

### Icon Pairing
- Always pair icons with text labels for primary actions
- Icon-only allowed for: close buttons (X), more menus (MoreVertical), common actions (Heart, Share2)
- Use ARIA labels for screen readers on icon-only buttons
- Maintain 8-12px gap between icon and text

## Layout Principles

### Desktop Layout (≥768px)
```
┌─────────────────────────────────────────────────────┐
│                    Header (h-14)                    │
├───────────┬─────────────────────────┬───────────────┤
│           │                         │               │
│   Left    │      Main Feed          │     Right     │
│  Sidebar  │    (max-w-2xl)          │   Sidebar     │
│           │                         │               │
│  (sticky) │   (scrollable)          │   (sticky)    │
│           │                         │               │
└───────────┴─────────────────────────┴───────────────┘
```

### Mobile Layout (<768px)
```
┌─────────────────────┐
│   Header (h-14)     │
├─────────────────────┤
│                     │
│                     │
│    Main Feed        │
│   (full width)      │
│  (scrollable)       │
│   pb-20 for nav     │
│                     │
├─────────────────────┤
│  Bottom Nav (h-20)  │
└─────────────────────┘
```

### Container Widths
- Main content: `max-w-2xl mx-auto` (672px)
- Wide content: `max-w-4xl mx-auto` (896px)
- Full-bleed mobile: `px-4` padding, no max-width
- Settings/forms: `max-w-xl mx-auto` (576px)

### Spacing Rules
- Outer page padding: Mobile `px-4 py-4`, Desktop `px-6 py-6` or `px-0` with centered container
- Section spacing: `space-y-4` or `space-y-6`
- Card gap in grid: `gap-4` or `gap-6`
- Paragraph spacing: `space-y-2` or `space-y-3`

## Common Patterns

### Session Card (Feed Item)
- White card with subtle shadow and border
- User avatar (top-left) with project badge
- Session title, duration, timestamp
- Social engagement row (support, comment, share)
- `border-b-[6px] border-gray-200` on mobile for visual separation

### Stats Display
- Icon in colored circle (e.g., blue-50 background, blue-600 icon)
- Large number (text-2xl or text-3xl, font-bold)
- Label below (text-sm text-muted-foreground)
- Optional trend indicator (arrow icon with green/red)

### User Profile Header
- Large circular avatar (140x140px on desktop)
- Username, bio, location
- Follow/Following counts (tappable)
- Action buttons (Follow, Message, Settings)
- Stats grid below (sessions, hours, streak)

### Form Layout
- Label above input: `<Label>` component
- Input with focus states: `<Input>` component
- Helper text below: `text-sm text-muted-foreground`
- Error text: `text-sm text-red-500`
- Button at bottom: full-width on mobile, auto-width on desktop

### Modal/Dialog
- Backdrop: semi-transparent dark overlay
- Content: white card, centered, max-width, rounded corners
- Header: title + close button (X icon)
- Body: scrollable if needed, padded
- Footer: action buttons (primary + secondary/cancel)

## Dos and Don'ts

### ✅ Do
- Use Electric Blue for primary actions and brand elements
- Use Lucide React icons consistently throughout
- Follow the 44px minimum touch target size on mobile
- Provide clear visual feedback for all interactions
- Use white cards with subtle shadows for content grouping
- Keep typography hierarchy clear with Inter font weights
- Use `clsx` and `cn()` utility to merge Tailwind classes
- Test on both mobile and desktop viewports
- Provide loading and error states for all async operations
- Use semantic HTML and ARIA labels for accessibility

### ❌ Don't
- Don't use colors outside the defined palette
- Don't mix icon libraries (no Font Awesome, Heroicons, etc.)
- Don't create custom spacing values; use Tailwind scale
- Don't use `!important` in CSS; fix specificity issues properly
- Don't leave interactive elements without hover/focus states
- Don't rely on color alone to convey status or information
- Don't use tiny text (below 14px) for important content
- Don't create one-off components; extend existing UI primitives
- Don't use animations longer than 500ms
- Don't forget to test keyboard navigation and screen readers

## Strava Inspiration Checklist

When designing new features, ask:
- [ ] Does this feel like tracking a "work activity" (like Strava tracks a run)?
- [ ] Is the data presented in a motivating, celebratory way?
- [ ] Can users easily compare their progress to others or their past performance?
- [ ] Are achievements and milestones visually prominent?
- [ ] Does the feed make users want to keep their streak going?
- [ ] Is there a clear social layer (supports, comments, followers)?
- [ ] Are metrics and stats immediately scannable?
- [ ] Does it feel clean, modern, and athletic (adapted for productivity)?

## Resources

- **shadcn/ui Documentation**: https://ui.shadcn.com/
- **Lucide Icons**: https://lucide.dev/icons/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Apple HIG (Touch Targets)**: https://developer.apple.com/design/human-interface-guidelines/inputs
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Strava Design Reference**: https://www.strava.com/ (for inspiration, not copying)

## Version

**Last Updated**: 2025-10-22
**Design System Version**: 1.0
**Maintained By**: Ambira Design Team
