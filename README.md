# Ambira - Social Productivity Tracker

A social productivity tracking application built with Next.js, TypeScript, and Tailwind CSS. Ambira gamifies productivity by allowing users to track their work sessions, build streaks, join groups, and compete with friends.

## Features

### ✅ Implemented Foundation
- **Next.js 15** with App Router and TypeScript
- **Electric-blue + White Theme** with Tailwind CSS
- **Responsive Layout** with fixed header and optional sidebars
- **Mobile Navigation** with bottom navigation bar and FAB
- **Routing Structure** for all major pages:
  - `/` - Home/Feed
  - `/login` and `/signup` - Authentication
  - `/projects` and `/projects/[id]` - Project management
  - `/profile/[username]` - User profiles
  - `/users` - User discovery and search
  - `/groups` and `/groups/[id]` - Groups
  - `/settings` and `/settings/privacy` - User settings

### ✅ Social Features (NEW!)
- **User Profiles** with Strava-inspired profile pages
  - Clean white profile header with large avatar and stats (followers, following, total hours)
  - Tabbed interface: Overview, Achievements, Following, Posts
  - Activity statistics with calendar heatmap and charts
  - Always visible header/navigation bar for consistent UX
- **Settings System** with Strava-style sidebar navigation
  - Dedicated settings page with left sidebar tabs
  - My Profile: Edit name, bio, location, profile picture
  - My Account: View email, username, membership status
  - Privacy Controls: Profile visibility settings
  - Email Notifications and Display Preferences sections
  - Accessible via profile dropdown menu in header
- **Following System** with real-time follow/unfollow functionality
  - Follow/unfollow buttons with optimistic updates
  - Followers and following lists
  - Privacy-aware profile visibility
- **User Discovery** 
  - Search users by name or username with real-time results
  - Suggested users with algorithm-based recommendations
  - User cards with follow buttons and profile previews
- **Privacy Settings**
  - Profile visibility controls (Everyone/Followers/Private)
  - Activity and project visibility settings
  - Blocked users management
- **Navigation Integration**
  - Updated header with profile dropdown menu (My Profile, Settings, Log Out)
  - Profile avatar now uses brand orange color (#FC4C02)
  - Bottom navigation with user links
  - Profile links throughout the app
  - Users discovery page with search and suggestions

### 🎨 Design System
- **Electric Blue Primary Color** (#007AFF) for logos, buttons, and accents
- **Clean White Surfaces** for posts and backgrounds
- **Success Green** (#34C759) for positive actions
- **Responsive Design** that adapts from desktop to mobile
- **Strava-inspired Layout** with three-column desktop and single-column mobile

### 🏗️ Architecture
- **Component-based** React architecture
- **TypeScript** for type safety
- **ESLint + Prettier** for code consistency
- **Tailwind CSS** for styling
- **Modular file structure** with organized components

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ambira-web
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── login/
│   ├── signup/
│   ├── projects/
│   │   └── [id]/
│   ├── profile/
│   │   └── [username]/
│   ├── groups/
│   │   └── [id]/
│   ├── settings/
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/            # Reusable components
│   ├── Header.tsx        # Top navigation
│   ├── Layout.tsx        # Main layout wrapper
│   ├── Sidebar.tsx       # Left/Right sidebars
│   └── BottomNavigation.tsx # Mobile navigation
├── lib/                  # Utility functions
└── types/                # TypeScript type definitions
    └── index.ts          # Core data types
```

## Design Philosophy

Ambira is inspired by Strava's social fitness tracking model but applied to productivity. The design emphasizes:

- **Social Accountability** - Connect with friends and see their progress
- **Gamification** - Streaks, achievements, and challenges
- **Clean Interface** - Focus on content with minimal distractions
- **Mobile-First** - Responsive design that works on all devices
- **Electric Blue Theme** - Energetic and modern color palette

## Next Steps

The social foundation is now complete! Key areas for further development include:

1. **Backend API Integration** - Connect to real backend services
2. **Real-time Features** - Live updates for following and activity
3. **Groups & Challenges** - Community features and competitions
4. **Analytics & Insights** - Advanced progress tracking and recommendations
5. **Mobile App** - Native iOS/Android applications
6. **Achievement System** - Badges and milestones for user engagement

## Contributing

This project follows a structured development approach with clear separation of concerns and TypeScript for type safety. When adding new features:

1. Define types in `src/types/`
2. Create components in `src/components/`
3. Add pages in `src/app/`
4. Follow the established design system
5. Write tests for new functionality

## License

This project is part of the Ambira productivity tracking platform.
