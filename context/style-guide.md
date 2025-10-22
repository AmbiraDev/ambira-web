# Style Guide

This document provides specific implementation guidelines for Ambira's visual design system. Reference this guide when building components, pages, and features.

## Color System

### Brand Colors

#### Electric Blue (Primary)
```css
/* Main brand color - use for primary actions, links, brand elements */
--electric-blue: #007AFF;
--electric-blue-dark: #0051D5;  /* Hover state */
--electric-blue-light: #66B3FF; /* Light accents */
```

**Usage:**
- Primary buttons: `bg-[#007AFF] hover:bg-[#0051D5]`
- Links: `text-[#007AFF] hover:underline`
- Focus rings: `ring-[#007AFF]`
- Active states, selected items, progress indicators

**Tailwind Classes:**
```jsx
className="text-[#007AFF]"
className="bg-[#007AFF]"
className="border-[#007AFF]"
className="ring-[#007AFF]"
```

#### Success Green
```css
--success-green: #34C759;
```

**Usage:**
- Positive metrics and trends
- Success messages and confirmations
- Streak indicators
- Growth statistics

**Tailwind:** `text-[#34C759]`, `bg-[#34C759]`

#### Destructive Red
```css
--destructive-red: #EF4444;
--destructive-red-dark: #DC2626; /* Hover state */
```

**Usage:**
- Delete buttons
- Error messages
- Warning states
- Negative trends

**Tailwind:** `bg-[#EF4444] hover:bg-[#DC2626]`

### Neutral Colors

#### Grays Scale
```css
/* Use for text, borders, backgrounds */
--gray-50:  #f9fafb;  /* Light backgrounds */
--gray-100: #f3f4f6;  /* Subtle backgrounds */
--gray-200: #e5e7eb;  /* Borders, dividers */
--gray-300: #d1d5db;  /* Disabled states */
--gray-400: #9ca3af;  /* Placeholder text */
--gray-500: #6b7280;  /* Secondary text */
--gray-600: #4b5563;  /* Tertiary text */
--gray-700: #374151;  /* Body text alternative */
--gray-900: #1f2937;  /* Headings */
--black:    #000000;  /* Primary text */
```

**Usage Guidelines:**
- Primary text: `text-black` or `text-gray-900`
- Secondary text: `text-gray-500` or `text-muted-foreground`
- Borders: `border-gray-200` or `border-gray-300`
- Disabled: `text-gray-400`, `opacity-50`
- Backgrounds: `bg-gray-50`, `bg-gray-100`

### Semantic Colors (CSS Variables)

```css
/* Defined in globals.css, accessible via Tailwind */
--background: #ffffff;
--foreground: #000000;
--card: #ffffff;
--card-foreground: #000000;
--muted: #6b7280;
--muted-foreground: #9ca3af;
--border: #e5e7eb;
```

**Tailwind Usage:**
```jsx
className="bg-background text-foreground"
className="bg-card border-border"
className="text-muted-foreground"
```

### Avatar Gradient Colors

For user avatars without profile pictures:
- `from-orange-400 to-orange-600`
- `from-blue-400 to-blue-600`
- `from-green-400 to-green-600`
- `from-purple-400 to-purple-600`
- `from-pink-400 to-pink-600`
- `from-indigo-400 to-indigo-600`
- `from-teal-400 to-teal-600`
- `from-cyan-400 to-cyan-600`

**Implementation:**
```jsx
<div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-full" />
```

### Color Usage Examples

```jsx
// Primary Button
<button className="bg-[#007AFF] hover:bg-[#0051D5] text-white">
  Start Session
</button>

// Success Metric
<div className="flex items-center gap-2">
  <TrendingUp className="w-4 h-4 text-[#34C759]" />
  <span className="text-[#34C759]">+12%</span>
</div>

// Muted Secondary Text
<p className="text-sm text-muted-foreground">Last active 2 hours ago</p>

// Card with Border
<div className="bg-card border border-border rounded-lg shadow-sm p-6">
  Content
</div>
```

## Typography

### Font Family

**Inter** - Single font family for entire application

```tsx
// Configured in layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-inter',
  display: 'swap',
});
```

**CSS Variable:**
```css
font-family: var(--font-inter), sans-serif;
```

### Font Sizes

| Tailwind Class | Size | Usage |
|----------------|------|-------|
| `text-xs` | 12px | Metadata, timestamps, tiny labels |
| `text-sm` | 14px | Secondary text, descriptions, helper text |
| `text-base` | 16px | Body text, form inputs, default |
| `text-lg` | 18px | Emphasized body, card titles |
| `text-xl` | 20px | Section headings, prominent titles |
| `text-2xl` | 24px | Page headings, card headers |
| `text-3xl` | 30px | Large numbers, hero text |

### Font Weights

| Tailwind Class | Weight | Usage |
|----------------|--------|-------|
| `font-normal` | 400 | Body text, paragraphs |
| `font-medium` | 500 | Labels, navigation items, subtle emphasis |
| `font-semibold` | 600 | Buttons, subheadings, card titles |
| `font-bold` | 700 | Major headings, numbers in stats, strong emphasis |

### Line Heights

```css
/* Body text */
line-height: 1.6;

/* Mobile body */
line-height: 1.5;

/* Headings (mobile) */
line-height: 1.3;

/* Tailwind classes */
leading-tight   /* 1.25 */
leading-snug    /* 1.375 */
leading-normal  /* 1.5 */
leading-relaxed /* 1.625 */
```

### Typography Examples

```jsx
// Page Heading
<h1 className="text-3xl font-bold text-foreground">
  Your Dashboard
</h1>

// Section Heading
<h2 className="text-2xl font-semibold">
  Recent Activity
</h2>

// Card Title
<h3 className="text-lg font-semibold">
  Deep Work Session
</h3>

// Body Text
<p className="text-base text-foreground leading-normal">
  Track your productivity like an athlete tracks workouts.
</p>

// Secondary Text
<p className="text-sm text-muted-foreground">
  Started 2 hours ago
</p>

// Metadata
<span className="text-xs text-gray-500">
  Oct 22, 2025
</span>

// Emphasized Stat
<div className="text-3xl font-bold text-foreground">
  127
</div>
```

## Spacing System

### Base Unit: 4px

All spacing uses multiples of 4px (Tailwind's default scale).

### Common Spacing Values

| Tailwind | Pixels | Usage |
|----------|--------|-------|
| `0.5` | 2px | Tight inline spacing |
| `1` | 4px | Very tight |
| `1.5` | 6px | Small gaps, tight lists |
| `2` | 8px | Default small spacing |
| `3` | 12px | Medium spacing, input padding |
| `4` | 16px | Standard spacing, button padding |
| `6` | 24px | Card padding, section spacing |
| `8` | 32px | Large gaps, page padding |
| `12` | 48px | XL spacing between major sections |
| `16` | 64px | XXL spacing, hero sections |
| `20` | 80px | Bottom nav height |

### Padding Patterns

```jsx
// Card Padding
className="p-6"  // 24px all sides

// Button Padding
className="px-4 py-2"  // 16px horizontal, 8px vertical

// Large Button
className="px-8 py-2"  // 32px horizontal, 8px vertical

// Mobile Page Padding
className="px-4 py-4"  // 16px all sides

// Desktop Page Padding
className="px-6 py-6 md:px-8"  // 24px mobile, 32px desktop

// Input Padding
className="px-3 py-2"  // 12px horizontal, 8px vertical
```

### Gap & Space

```jsx
// Flex/Grid Gap
className="gap-2"     // 8px
className="gap-4"     // 16px
className="gap-6"     // 24px
className="gap-8"     // 32px

// Vertical Stack (Space Between)
className="space-y-1.5"  // 6px between items
className="space-y-2"    // 8px between items
className="space-y-4"    // 16px between items
className="space-y-6"    // 24px between items

// Horizontal Stack
className="space-x-2"    // 8px between items
className="space-x-4"    // 16px between items
```

### Margin Examples

```jsx
// Top margin for sections
className="mt-6"  // 24px
className="mt-8"  // 32px

// Bottom margin for content
className="mb-4"  // 16px
className="mb-6"  // 24px

// Auto-centering
className="mx-auto"  // Center horizontally
```

## Component Styling

### Buttons

#### Default (Primary)
```jsx
<button className="bg-[#007AFF] text-white hover:bg-[#0051D5] px-4 py-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none min-h-[44px]">
  Primary Action
</button>
```

#### Destructive
```jsx
<button className="bg-[#EF4444] text-white hover:bg-[#DC2626] px-4 py-2 rounded-lg text-sm font-semibold min-h-[44px]">
  Delete
</button>
```

#### Outline
```jsx
<button className="border border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold min-h-[44px]">
  Secondary Action
</button>
```

#### Ghost
```jsx
<button className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-semibold min-h-[44px]">
  Ghost Action
</button>
```

#### Icon Button
```jsx
<button className="w-10 h-10 min-w-[44px] min-h-[44px] p-2 rounded-lg hover:bg-gray-100 flex items-center justify-center">
  <MoreVertical className="w-5 h-5" />
</button>
```

#### Large Button
```jsx
<button className="bg-[#007AFF] text-white hover:bg-[#0051D5] px-8 py-2 rounded-lg text-sm font-semibold min-h-[44px] h-11">
  Large Action
</button>
```

### Cards

#### Basic Card
```jsx
<div className="rounded-lg border bg-card text-card-foreground shadow-sm">
  <div className="p-6">
    <h3 className="text-2xl font-semibold">Card Title</h3>
    <p className="text-sm text-muted-foreground">Card description</p>
  </div>
  <div className="p-6 pt-0">
    {/* Card content */}
  </div>
</div>
```

#### Session Card (Feed Item)
```jsx
<div className="bg-white rounded-lg border border-gray-200 shadow-sm md:border-b-0 border-b-[6px]">
  <div className="px-4 pt-4 pb-3">
    {/* User info, avatar */}
  </div>
  <div className="px-4 pb-4">
    {/* Session details */}
  </div>
  <div className="border-t border-gray-200 px-4 py-3 flex items-center gap-6">
    {/* Social actions: support, comment, share */}
  </div>
</div>
```

### Form Elements

#### Input
```jsx
<input
  type="text"
  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
  placeholder="Enter text..."
/>
```

#### Label
```jsx
<label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
  Label Text
</label>
```

#### Textarea
```jsx
<textarea
  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
/>
```

#### Form Group
```jsx
<div className="space-y-2">
  <label htmlFor="email" className="text-sm font-medium">
    Email
  </label>
  <input
    id="email"
    type="email"
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] min-h-[44px]"
  />
  <p className="text-sm text-muted-foreground">
    We'll never share your email.
  </p>
</div>
```

### Badges

```jsx
// Default
<span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
  Badge
</span>

// Primary
<span className="inline-flex items-center rounded-full border border-transparent bg-[#007AFF] text-white px-2.5 py-0.5 text-xs font-semibold">
  Active
</span>

// Success
<span className="inline-flex items-center rounded-full border border-transparent bg-[#34C759] text-white px-2.5 py-0.5 text-xs font-semibold">
  Completed
</span>

// Outline
<span className="inline-flex items-center rounded-full border border-gray-300 text-gray-700 px-2.5 py-0.5 text-xs font-semibold">
  Outline
</span>
```

### Avatars

```jsx
// User Avatar (with image)
<div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-white">
  <Image src={avatarUrl} alt="User" fill className="object-cover" />
</div>

// User Avatar (initials with gradient)
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
  JD
</div>

// Large Avatar (Profile)
<div className="w-[140px] h-[140px] rounded-full overflow-hidden border-4 border-gray-100">
  <Image src={avatarUrl} alt="User" fill className="object-cover" />
</div>
```

## Icons (Lucide React)

### Import Pattern
```tsx
import { Heart, MessageCircle, Share2, Clock, TrendingUp } from 'lucide-react';
```

### Size Guidelines

```jsx
// Extra Small (12px) - rare, very compact UI
<Clock className="w-3 h-3" />

// Small (16px) - inline with text, compact buttons
<Heart className="w-4 h-4" />

// Medium (20px) - standard size, most common
<MessageCircle className="w-5 h-5" />

// Large (24px) - prominent actions, headers
<Share2 className="w-6 h-6" />

// Extra Large (32px) - feature icons, empty states
<Trophy className="w-8 h-8" />
```

### Icon with Text

```jsx
// Horizontal (inline)
<button className="flex items-center gap-2">
  <Heart className="w-5 h-5" />
  <span>Support</span>
</button>

// Vertical (stacked)
<div className="flex flex-col items-center gap-1">
  <Clock className="w-6 h-6 text-muted-foreground" />
  <span className="text-sm">2h 30m</span>
</div>
```

### Icon in Colored Container

```jsx
// Stat card icon
<div className="p-3 rounded-lg bg-blue-50 text-blue-600">
  <TrendingUp className="w-6 h-6" />
</div>

// Success icon
<div className="p-3 rounded-lg bg-green-50 text-green-600">
  <CheckCircle className="w-6 h-6" />
</div>
```

### Common Icon Mappings

| Purpose | Icon |
|---------|------|
| Support/Like | `Heart` |
| Comment | `MessageCircle` |
| Share | `Share2` |
| Time/Duration | `Clock` |
| Timer | `Timer` |
| Trending Up | `TrendingUp` |
| Trending Down | `TrendingDown` |
| Users | `Users` |
| Add User | `UserPlus` |
| Settings | `Settings` |
| Edit | `Edit3` or `Pencil` |
| Delete | `Trash2` |
| More Options | `MoreVertical` |
| Close | `X` |
| Search | `Search` |
| Menu | `Menu` |
| Check/Complete | `Check` or `CheckCircle` |
| Trophy/Achievement | `Trophy` |
| Target/Goal | `Target` |
| Lightning/Streak | `Zap` |
| Calendar | `Calendar` |
| Project | `FolderOpen` or `ListTodo` |
| Tag | `Tag` |
| Lock | `Lock` |
| Unlock | `Unlock` |

## Layout Patterns

### Page Container

```jsx
// Mobile-first page
<div className="min-h-screen bg-background">
  <Header />
  <main className="pb-20 md:pb-0">
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Content */}
    </div>
  </main>
  <MobileNav />
</div>
```

### Three-Column Desktop Layout

```jsx
<div className="hidden md:flex md:gap-8 max-w-7xl mx-auto px-6">
  {/* Left Sidebar */}
  <aside className="w-64 sticky top-20 h-fit">
    {/* Navigation, filters */}
  </aside>

  {/* Main Feed */}
  <main className="flex-1 max-w-2xl">
    {/* Primary content */}
  </main>

  {/* Right Sidebar */}
  <aside className="w-80 sticky top-20 h-fit">
    {/* Stats, suggestions */}
  </aside>
</div>
```

### Grid Layouts

```jsx
// Two-column stats grid
<div className="grid grid-cols-2 gap-4">
  <StatCard />
  <StatCard />
</div>

// Three-column desktop, single mobile
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <Card />
  <Card />
  <Card />
</div>

// Responsive challenge grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  <ChallengeCard />
  <ChallengeCard />
  <ChallengeCard />
</div>
```

## Responsive Breakpoints

### Tailwind Breakpoints

| Prefix | Min Width | Usage |
|--------|-----------|-------|
| (none) | 0px | Mobile-first default |
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets, desktop transition |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Large desktop |

### Common Responsive Patterns

```jsx
// Hide on mobile, show on desktop
className="hidden md:block"

// Show on mobile, hide on desktop
className="block md:hidden"

// Responsive flex direction
className="flex flex-col md:flex-row"

// Responsive grid columns
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Responsive text size
className="text-lg md:text-xl lg:text-2xl"

// Responsive padding
className="px-4 md:px-6 lg:px-8"

// Responsive gap
className="gap-4 md:gap-6 lg:gap-8"
```

## States & Interactions

### Hover States

```jsx
// Color change
className="hover:text-[#007AFF]"
className="hover:bg-gray-100"

// Transform
className="hover:scale-105 transition-transform"

// Shadow
className="hover:shadow-lg transition-shadow"

// Border
className="hover:border-[#007AFF] transition-colors"
```

### Focus States

```jsx
// Standard focus ring (all interactive elements)
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2"

// Focus without offset (tight spaces)
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]"
```

### Active States

```jsx
// Button press
className="active:scale-95 transition-transform"

// Background change
className="active:bg-[#0051D5]"
```

### Disabled States

```jsx
// Buttons and inputs
className="disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
```

### Loading States

```jsx
// Spinner
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]" />

// Skeleton
<div className="animate-pulse bg-gray-200 rounded-lg h-24 w-full" />

// Button loading
<button disabled className="opacity-50 cursor-not-allowed">
  <Loader2 className="w-4 h-4 animate-spin mr-2" />
  Loading...
</button>
```

## Shadows & Elevation

```css
/* Tailwind shadow utilities */
shadow-sm   /* Subtle card shadow */
shadow      /* Default shadow */
shadow-md   /* Medium elevation */
shadow-lg   /* Dropdown, modal shadow */
shadow-xl   /* High elevation */

/* Custom shadows */
0 2px 8px rgba(0, 122, 255, 0.3)  /* Electric Blue glow */
```

**Usage:**
- Cards: `shadow-sm`
- Dropdowns: `shadow-lg`
- Modals: `shadow-xl`
- Focus glow on range sliders: custom blue shadow

## Border Radius

```css
/* Tailwind radius utilities */
rounded-sm   /* 2px */
rounded      /* 4px */
rounded-md   /* 6px */
rounded-lg   /* 8px - primary for cards */
rounded-xl   /* 12px */
rounded-full /* 50% - for avatars, badges, pills */
```

**Usage:**
- Cards: `rounded-lg`
- Buttons: `rounded-lg`
- Inputs: `rounded-md`
- Badges: `rounded-full`
- Avatars: `rounded-full`

## Animation & Transitions

### Transition Classes

```jsx
// Color transitions (buttons, links)
className="transition-colors duration-200"

// All properties (use sparingly)
className="transition-all duration-300"

// Transform (hover scale, etc.)
className="transition-transform duration-200"

// Shadow transitions
className="transition-shadow duration-300"
```

### Common Animations

```jsx
// Fade in
className="animate-in fade-in duration-200"

// Slide up (modals, toasts)
className="animate-in slide-in-from-bottom duration-300"

// Spin (loading)
className="animate-spin"

// Pulse (loading skeleton)
className="animate-pulse"
```

### Custom Keyframe (from globals.css)

```css
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Usage */
.slide-up {
  animation: slide-up 0.3s ease-out;
}
```

## Accessibility

### Focus Indicators

```jsx
// Always include on interactive elements
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2"
```

### ARIA Labels

```jsx
// Icon-only buttons
<button aria-label="Close dialog">
  <X className="w-5 h-5" />
</button>

// Links with icons
<a href="/profile" aria-label="View profile">
  <User className="w-5 h-5" />
</a>
```

### Semantic HTML

```jsx
// Navigation
<nav aria-label="Main navigation">
  {/* Nav items */}
</nav>

// Main content
<main>
  {/* Page content */}
</main>

// Buttons (not divs with onClick)
<button type="button" onClick={handleClick}>
  Click me
</button>

// Article/section
<article>
  <h2>Session Title</h2>
  {/* Session content */}
</article>
```

### Touch Targets (Mobile)

```jsx
// Minimum 44x44px for all tappable elements
className="min-h-[44px] min-w-[44px]"

// Button
className="h-10 min-h-[44px] px-4"

// Icon button
className="w-10 h-10 min-w-[44px] min-h-[44px]"
```

## Utility Functions

### Class Name Merging

```tsx
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage
<div className={cn(
  "base classes",
  isActive && "active classes",
  "override classes"
)} />
```

## Quick Reference

### Component Checklist
- [ ] Uses shadcn/ui primitives from `/src/components/ui/`
- [ ] Colors from defined palette (Electric Blue, grays, success green)
- [ ] Lucide React icons (consistent sizing)
- [ ] Inter font family
- [ ] Proper spacing (4px multiples)
- [ ] `rounded-lg` for cards, buttons
- [ ] `shadow-sm` for cards
- [ ] 44px minimum touch targets on mobile
- [ ] Focus visible ring with Electric Blue
- [ ] Hover states on interactive elements
- [ ] Disabled states with opacity-50
- [ ] Semantic HTML elements
- [ ] ARIA labels on icon-only buttons

### Mobile-First Checklist
- [ ] Design for mobile viewport first
- [ ] Use `md:` prefix for desktop styles
- [ ] Single column mobile → three column desktop
- [ ] Bottom nav on mobile (pb-20 on main content)
- [ ] Touch-friendly targets (44px minimum)
- [ ] Text size ≥ 16px (prevents zoom on iOS)
- [ ] Test on actual mobile device

### Strava-Inspired Checklist
- [ ] Session cards look like activity cards
- [ ] Social engagement visible (supports, comments)
- [ ] Metrics and stats prominently displayed
- [ ] Clean white backgrounds
- [ ] Motivating, celebratory tone
- [ ] Clear progress visualization

## Resources

- **Component Library**: `/src/components/ui/` (shadcn/ui)
- **Utility Function**: `/src/lib/utils.ts` (`cn()` helper)
- **Global Styles**: `/src/app/globals.css`
- **Lucide Icons**: https://lucide.dev/icons/
- **Tailwind Docs**: https://tailwindcss.com/docs

---

**Version**: 1.0
**Last Updated**: 2025-10-22
