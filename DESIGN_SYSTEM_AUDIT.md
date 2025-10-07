# Design System Audit & Unification Plan

## Current State Analysis

### Inconsistencies Found

#### 1. **Border Radius Variations**
- `rounded-lg` (8px) - Most common in SessionCard, RightSidebar
- `rounded-xl` (12px) - RightSidebar groups
- `rounded-2xl` (16px) - LeftSidebar profile card, modals
- `rounded-full` - Buttons in timer, avatars
- `rounded-md` (6px) - UI button component

#### 2. **Button Styles (Multiple Patterns)**
- **SessionCard**: `hover:bg-gray-100 rounded-full p-2` (icon buttons)
- **RightSidebar Follow**: `bg-[#007AFF] hover:bg-[#0051D5] text-white shadow-sm` (primary CTA)
- **RightSidebar Following**: `border border-gray-300 hover:bg-gray-100` (secondary state)
- **Timer Start Button**: `bg-[#22C55E] hover:bg-[#16A34A]` (green action)
- **Timer Pause**: `bg-red-600 hover:bg-red-700`
- **Timer Finish**: `bg-gray-900 hover:bg-gray-800`
- **UI Button Component**: Multiple variants (default, destructive, outline, secondary, ghost, link)
- **SessionTimerEnhanced**: Various rounded-full buttons with inconsistent sizes

#### 3. **Card Padding Variations**
- **SessionCard**: `px-3 md:px-4 pt-3 md:pt-4 pb-2 md:pb-3` (complex responsive)
- **LeftSidebar Profile**: `p-6` (consistent)
- **RightSidebar Cards**: `px-4 py-3` (header), `py-2` (list items)
- **DayOverview Stats**: `p-3` (small cards)

#### 4. **Vertical Spacing Variations**
- `space-y-4` - Common in sidebars
- `space-y-6` - Timer completion form
- `mb-4 md:mb-6` - Feed sections
- `gap-2`, `gap-3`, `gap-4`, `gap-6` - Various grids

#### 5. **Avatar Styles (Inconsistent)**
- **SessionCard**: `w-9 h-9 md:w-10 md:h-10 bg-[#FC4C02] rounded-full ring-2 ring-white`
- **LeftSidebar**: `w-20 h-20 bg-gradient-to-br from-[#007AFF] to-[#0051D5] rounded-full ring-2 ring-gray-200`
- **RightSidebar**: `w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full ring-2 ring-white shadow-sm`
- Colors vary: Blue gradient, Orange gradient, Brand orange solid

#### 6. **Icon Treatment**
- Lucide icons with varying sizes: `w-4 h-4`, `w-5 h-5`, `w-6 h-6`, `w-7 h-7`
- Some with background circles, some standalone
- Inconsistent colors and hover states

## Unified Design System

### Core Values
- **Minimalism**: Flat design, no gradients on buttons
- **Consistency**: One style for each component type
- **Accessibility**: Minimum 44px touch targets
- **Brand**: Primary blue (#007AFF), supporting colors

### Design Tokens

#### Border Radius
```
xs: 6px (rounded-md) - Small UI elements
sm: 8px (rounded-lg) - Buttons, inputs, small cards
md: 12px (rounded-xl) - Standard cards
lg: 16px (rounded-2xl) - Large cards, modals
full: 9999px (rounded-full) - Pills, avatars
```

**Decision**: Use `rounded-lg` (8px) for all CTAs and buttons, `rounded-xl` (12px) for cards

#### Spacing Scale
```
xs: 8px (2) - Tight spacing within components
sm: 12px (3) - Default gap between related items
md: 16px (4) - Standard card padding
lg: 24px (6) - Section spacing
xl: 32px (8) - Major section breaks
```

**Decision**:
- Card padding: `p-4` (16px) standard
- Card gaps: `gap-4` or `space-y-4`
- Section breaks: `mb-6` (24px)

#### Typography Scale
```
Button text: text-sm font-semibold (14px, 600 weight)
Card title: text-base font-semibold (16px, 600 weight)
Section heading: text-lg font-bold (18px, 700 weight)
```

#### Colors
```
Primary Action: #007AFF (blue)
Primary Hover: #0051D5 (darker blue)
Success: #22C55E (green) - Start actions only
Destructive: #EF4444 (red)
Secondary: #F3F4F6 (gray-100) background, #374151 (gray-700) text
Border: #E5E7EB (gray-200)
```

### Component Standards

#### 1. **Primary CTA Button**
```tsx
<button className="px-4 py-2 bg-[#007AFF] hover:bg-[#0051D5] text-white text-sm font-semibold rounded-lg transition-colors min-h-[44px]">
  Action
</button>
```

#### 2. **Secondary Button**
```tsx
<button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors min-h-[44px]">
  Action
</button>
```

#### 3. **Outline Button** (Following state)
```tsx
<button className="px-4 py-2 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition-colors min-h-[44px]">
  Following
</button>
```

#### 4. **Icon Button**
```tsx
<button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px]">
  <Icon className="w-5 h-5" />
</button>
```

#### 5. **Avatar Standard**
All avatars should use circular shape with consistent sizing:
- Small (feed): `w-10 h-10` (40px)
- Medium (sidebar): `w-12 h-12` (48px)
- Large (profile): `w-20 h-20` (80px)
- Color: Solid `bg-[#FC4C02]` (brand orange) for default avatars
- Ring: `ring-2 ring-white` for elevation

#### 6. **Card Standard**
```tsx
<div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
  {/* Card content with consistent p-4 padding */}
</div>
```

#### 7. **Icon Standard**
- Default size: `w-5 h-5` (20px)
- Small: `w-4 h-4` (16px) for inline text
- Large: `w-6 h-6` (24px) for emphasis
- Line icons from Lucide, consistent stroke-width

### Implementation Checklist

- [ ] Update button.tsx with unified variants
- [ ] Update all CTA buttons across components
- [ ] Standardize all avatar sizes and colors
- [ ] Unify card padding to p-4
- [ ] Standardize vertical spacing to space-y-4 / gap-4
- [ ] Apply rounded-lg to all buttons
- [ ] Apply rounded-xl to all cards
- [ ] Ensure 44px minimum touch targets
- [ ] Update icon sizes to w-5 h-5 standard
