# Focumo Style Guide

This document provides specific implementation guidelines for Focumo's visual design system. Reference this guide when building components, pages, and features.

## Design Philosophy

Focumo uses a **Duolingo-inspired design system** - bright, gamified, and motivating. The design emphasizes:

- **Vibrant gradient colors** for icons and accents
- **Bold typography** with font-extrabold for emphasis
- **Rounded corners** (2xl for cards, xl for buttons)
- **Thick bottom borders** on buttons for a tactile, pushable feel
- **Light mode primary** with dark mode support for cards/previews

## Color System

### Primary Colors

```css
/* Duolingo Green - Primary actions, success states */
--duo-green: #58cc02;
--duo-green-dark: #45a000;
--duo-green-light: #7ed321;

/* Duolingo Blue - Secondary actions, links */
--duo-blue: #1cb0f6;
--duo-blue-dark: #0088cc;

/* Purple - XP, power-ups, energy */
--duo-purple: #ce82ff;
--duo-purple-dark: #a855f7;

/* Gold - Achievements, rewards */
--duo-gold: #ffd900;
--duo-gold-dark: #ffaa00;

/* Orange - Streaks, fire */
--duo-orange: #ff9600;
--duo-orange-dark: #ff6b00;

/* Red - Intensity, challenges */
--duo-red: #ff4444;
--duo-red-dark: #cc0000;
```

### Light Mode (Primary)

```css
/* Backgrounds */
--background: #ffffff;
--background-secondary: #f7f7f7;
--card-background: #ffffff;

/* Text */
--foreground: #3c3c3c;
--text-secondary: #777777;
--text-muted: #afafaf;

/* Borders */
--border: #e5e5e5;
--border-dark: #dadada;
```

### Dark Mode (For Cards/Previews)

```css
/* Backgrounds */
--dark-background: #131f24;
--dark-card: #1f2b31;

/* Text */
--dark-text-primary: #efefef;
--dark-text-secondary: #dbdee1;
--dark-text-muted: #afafaf;

/* Borders */
--dark-border: #2e3d44;
```

### Gradient Icon Boxes

Use these gradient combinations for stat/icon boxes:

| Purpose       | From      | To        | Usage                     |
| ------------- | --------- | --------- | ------------------------- |
| Time/Duration | `#1CB0F6` | `#0088CC` | Clock icons, time metrics |
| Activity/Goal | `#58CC02` | `#45A000` | Target icons, sessions    |
| XP/Energy     | `#CE82FF` | `#A855F7` | Zap icons, XP gained      |
| Streak/Fire   | `#FF9600` | `#FF6B00` | Flame icons, streaks      |
| Challenge     | `#FF4444` | `#CC0000` | Trophy icons, intensity   |
| Rewards       | `#FFD900` | `#FFAA00` | Award icons, achievements |

**Implementation:**

```jsx
<div className="w-12 h-12 bg-gradient-to-br from-[#1CB0F6] to-[#0088CC] rounded-xl flex items-center justify-center">
  <Clock className="w-7 h-7 text-white" strokeWidth={2.5} />
</div>
```

### Avatar Gradients

Default avatar ring gradient:

```jsx
<div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#58CC02] to-[#45A000] p-0.5">
  <div className="w-full h-full bg-white rounded-full flex items-center justify-center border-2 border-white">
    <span className="text-[#3C3C3C] font-bold text-sm">JD</span>
  </div>
</div>
```

## Typography

### Font Family

**Nunito** - Primary font for all text

```css
font-family: 'Nunito', system-ui, sans-serif;
```

### Font Weights

| Tailwind         | Weight | Usage                            |
| ---------------- | ------ | -------------------------------- |
| `font-normal`    | 400    | Body text                        |
| `font-semibold`  | 600    | Labels, descriptions             |
| `font-bold`      | 700    | Headings, emphasis               |
| `font-extrabold` | 800    | Stats, primary headings, buttons |

### Font Sizes

| Class       | Size | Usage                                        |
| ----------- | ---- | -------------------------------------------- |
| `text-xs`   | 12px | Labels, timestamps (uppercase tracking-wide) |
| `text-sm`   | 14px | Secondary text, descriptions                 |
| `text-base` | 16px | Body text                                    |
| `text-lg`   | 18px | Card titles, stats                           |
| `text-xl`   | 20px | Section headings                             |
| `text-2xl`  | 24px | Large stats, card headers                    |
| `text-3xl`  | 30px | Page headings                                |
| `text-5xl`  | 48px | Hero stats                                   |

### Typography Examples

```jsx
// Hero Heading
<h1 className="text-5xl md:text-6xl font-extrabold text-[#3C3C3C]">
  Make productivity <span className="text-[#58CC02]">social.</span>
</h1>

// Card Title
<h3 className="text-xl font-extrabold text-[#4B4B4B]">
  Focus Session
</h3>

// Stat Label (uppercase)
<div className="text-xs text-[#AFAFAF] font-extrabold uppercase tracking-widest">
  Time
</div>

// Stat Value
<div className="text-lg font-extrabold text-[#4B4B4B]">
  2h 30m
</div>
```

## Component Styling

### Buttons - Duolingo Style

All buttons have thick bottom borders that compress on click:

```jsx
// Primary Button (Green)
<button className="px-5 py-3 bg-[#58CC02] text-white font-bold rounded-2xl
  hover:brightness-105 transition-all
  border-2 border-b-4 border-[#45A000]
  active:border-b-2 active:translate-y-[2px]
  uppercase tracking-wide text-sm">
  Start Session
</button>

// Secondary Button (Blue)
<button className="px-5 py-3 bg-[#1CB0F6] text-white font-bold rounded-2xl
  border-2 border-b-4 border-[#0088CC]
  active:border-b-2 active:translate-y-[2px]
  uppercase tracking-wide">
  Follow
</button>

// Outline Button
<button className="px-5 py-3 bg-white text-[#3C3C3C] font-bold rounded-2xl
  border-2 border-b-4 border-[#DADADA]
  hover:bg-[#F7F7F7]
  active:border-b-2 active:translate-y-[2px]">
  Cancel
</button>

// Destructive Button (Red)
<button className="px-5 py-3 bg-[#FF4B4B] text-white font-bold rounded-2xl
  border-2 border-b-4 border-[#EA2B2B]
  active:border-b-2 active:translate-y-[2px]">
  Delete
</button>
```

### Cards - Light Mode

```jsx
// Standard Card
<div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-6">
  {/* Content */}
</div>

// Session Card
<article className="bg-white rounded-3xl border-2 border-[#E5E5E5] overflow-hidden hover:border-[#DDF4FF] transition-all">
  {/* Header, Content, Interactions */}
</article>
```

### Cards - Dark Mode (for previews)

```jsx
// Dark Card
<div className="bg-[#1F2B31] rounded-2xl border-2 border-[#2E3D44] p-6">
  {/* Content */}
</div>

// Stat Card inside Dark Card
<div className="bg-[#131F24] rounded-xl p-4 border border-[#2E3D44]">
  <div className="flex items-center gap-3">
    <div className="w-12 h-12 bg-gradient-to-br from-[#1CB0F6] to-[#0088CC] rounded-xl flex items-center justify-center">
      <Clock className="w-7 h-7 text-white" strokeWidth={2.5} />
    </div>
    <div className="text-2xl font-extrabold text-[#EFEFEF]">2h 30m</div>
  </div>
</div>
```

### Form Elements

```jsx
// Input - Duolingo Style
<input className="w-full px-4 py-3
  bg-[#F7F7F7] border-2 border-b-4 border-[#E5E5E5] rounded-xl
  text-[#3C3C3C] font-semibold
  focus:border-[#1CB0F6] focus:bg-white focus:outline-none
  placeholder:text-[#AFAFAF]" />

// Textarea
<textarea className="w-full px-4 py-3
  bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-xl
  text-[#3C3C3C] font-semibold
  focus:border-[#1CB0F6] focus:bg-white focus:outline-none
  resize-none" />
```

### Badges

```jsx
// Status Badge
<span className="px-3 py-1 bg-white border-2 border-[#E5E5E5] rounded-full
  text-xs font-bold text-[#3C3C3C] uppercase tracking-wide">
  Active
</span>

// Achievement Badge
<span className="px-3 py-1 bg-[#FFD900] border-2 border-[#E5B400] rounded-full
  text-xs font-bold text-[#3C3C3C] uppercase tracking-wide">
  Gold
</span>
```

## Icons (Lucide React)

### Standard Icons

Always use Lucide React icons with consistent sizing:

```jsx
import { Clock, Target, Zap, Trophy, Users, TrendingUp } from 'lucide-react'

// In gradient boxes (large)
<Clock className="w-7 h-7 text-white" strokeWidth={2.5} />

// Inline with text
<Clock className="w-5 h-5 text-[#AFAFAF]" />

// Filled icons (for Zap, Trophy)
<Zap className="w-7 h-7 text-white" fill="white" strokeWidth={2.5} />
```

### Icon Mapping

| Purpose             | Icon              | Gradient |
| ------------------- | ----------------- | -------- |
| Time/Duration       | `Clock`           | Blue     |
| Activity/Goal       | `Target`          | Green    |
| XP/Energy           | `Zap` (filled)    | Purple   |
| Streak              | `Flame`           | Orange   |
| Challenge/Intensity | `Trophy` (filled) | Red      |
| Achievements        | `Award`           | Gold     |
| Groups              | `Users`           | Purple   |
| Progress            | `TrendingUp`      | Purple   |
| Sessions            | `BookOpen`        | Green    |

## Layout Patterns

### Page Container

```jsx
<div className="min-h-screen bg-white">
  <Header />
  <main className="max-w-6xl mx-auto px-4 py-6">{/* Content */}</main>
  <Footer />
</div>
```

### Three-Column Desktop

```jsx
<div className="hidden md:flex md:gap-8 max-w-7xl mx-auto px-6">
  <aside className="w-80 sticky top-16 h-fit">{/* Left Sidebar */}</aside>
  <main className="flex-1 max-w-2xl">{/* Feed */}</main>
  <aside className="w-72 sticky top-16 h-fit">{/* Right Sidebar */}</aside>
</div>
```

### Grid Layouts

```jsx
// 2x2 Stats Grid
<div className="grid grid-cols-2 gap-4">
  <StatCard />
  <StatCard />
  <StatCard />
  <StatCard />
</div>

// Leaderboard
<div className="space-y-3">
  <LeaderboardRow />
  <LeaderboardRow />
  <LeaderboardRow />
</div>
```

## Spacing System

Use consistent spacing values:

| Tailwind | Pixels | Usage                 |
| -------- | ------ | --------------------- |
| `gap-2`  | 8px    | Tight inline spacing  |
| `gap-3`  | 12px   | Icon + text spacing   |
| `gap-4`  | 16px   | Card grid gaps        |
| `gap-6`  | 24px   | Section spacing       |
| `p-3`    | 12px   | Compact card padding  |
| `p-4`    | 16px   | Standard card padding |
| `p-6`    | 24px   | Large card padding    |
| `mb-3`   | 12px   | Element margins       |
| `mb-4`   | 16px   | Section margins       |
| `mb-6`   | 24px   | Large section margins |

## Border Radius

| Class          | Pixels | Usage                       |
| -------------- | ------ | --------------------------- |
| `rounded-lg`   | 8px    | Icon boxes                  |
| `rounded-xl`   | 12px   | Stat cards, inputs          |
| `rounded-2xl`  | 16px   | Cards, buttons              |
| `rounded-3xl`  | 24px   | Large cards (session cards) |
| `rounded-full` | 50%    | Avatars, badges             |

## Accessibility

### Touch Targets

Minimum 44x44px for all interactive elements:

```jsx
className = 'min-h-[44px] min-w-[44px]'
```

### Focus States

```jsx
className =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] focus-visible:ring-offset-2'
```

### Color Contrast

- Light mode text: `#3C3C3C` on white background (passes WCAG AA)
- Dark mode text: `#EFEFEF` on `#1F2B31` background (passes WCAG AA)

## Quick Reference

### Component Checklist

- [ ] Uses Nunito font with appropriate weight
- [ ] Colors from Duolingo-inspired palette
- [ ] Lucide React icons with consistent sizing
- [ ] `rounded-2xl` for cards, buttons
- [ ] Thick bottom border on buttons (`border-b-4`)
- [ ] `font-extrabold` for stats and headings
- [ ] Uppercase tracking-wide for labels
- [ ] 44px minimum touch targets
- [ ] Focus visible ring with green accent
- [ ] Gradient icon boxes for stats

### Color Reference

```
Green:  #58CC02 → #45A000 (Primary)
Blue:   #1CB0F6 → #0088CC (Secondary)
Purple: #CE82FF → #A855F7 (XP)
Gold:   #FFD900 → #FFAA00 (Rewards)
Orange: #FF9600 → #FF6B00 (Streak)
Red:    #FF4444 → #CC0000 (Intensity)

Light BG: #FFFFFF / #F7F7F7
Dark BG:  #131F24 / #1F2B31
Border:   #E5E5E5 (light) / #2E3D44 (dark)
```

---

**Version**: 2.0 (Focumo Rebrand)
**Last Updated**: 2026-01-14
