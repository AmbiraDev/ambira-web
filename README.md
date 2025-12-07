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

### ✅ Social Features

- **User Profiles** with Strava-inspired profile pages
  - Clean white profile header with large avatar and stats (followers, following, total hours)
  - Tabbed interface: Overview, Achievements, Following, Posts
  - Activity Analytics with modern data visualizations:
    - Daily Activity: Interactive bar chart with period selector (30d/90d/year) and summary stats
    - Weekly Trends: Bar chart with actual date ranges instead of week numbers
    - Project Breakdown: Horizontal bar charts and detailed table view
    - Clean white theme with hover tooltips and smooth transitions
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

### ✅ Challenges System (NEW!)

- **Challenge Types** with different competition formats:
  - **Most Activity**: Compete to log the most productive hours
  - **Fastest Effort**: Achieve the best tasks-per-hour ratio
  - **Longest Session**: Record the longest single work session
  - **Group Goal**: Work together to reach a collective target
- **Challenge Management** for group admins:
  - Create challenges with custom goals, date ranges, and rules
  - Select which projects count toward the challenge
  - Add rewards and achievement descriptions
  - Edit and delete challenges with proper permissions
- **Real-time Progress Tracking**:
  - Automatic progress updates when sessions are logged
  - Live leaderboards with rankings and completion status
  - Progress bars and percentage indicators
  - Time remaining countdown with daily updates
- **Challenge Discovery**:
  - Browse all challenges with filters (Active, Upcoming, Completed)
  - Search by challenge type and group
  - Active challenges displayed in right sidebar
  - Challenge cards with participation status and progress
- **Leaderboard System**:
  - Ranked participant lists with user profiles
  - Top 3 podium display with special styling
  - Full leaderboard table with completion badges
  - Filter by participation status and following
- **Group Integration**:
  - Challenges tab in group pages
  - Admin-only challenge creation for groups
  - Group challenge statistics and overview
  - Member participation tracking
- **Navigation Integration**
  - Updated header with profile dropdown menu (My Profile, Settings, Log Out)
  - Profile avatar now uses brand orange color (#FC4C02)
  - Bottom navigation with user links
  - Profile links throughout the app
  - Users discovery page with search and suggestions
  - Active session indicator shows live elapsed time in header when not on `/timer`; on `/timer` it displays "Active" to avoid duplicate timers
  - Footer restyled to match blue/gray theme; removed app store badges and placeholder social icons

### 🎨 Design System

- **Electric Blue Primary Color** (#007AFF) for logos, buttons, and accents
- **Clean White Surfaces** for posts and backgrounds
- **Success Green** (#34C759) for positive actions
- **Responsive Design** that adapts from desktop to mobile
- **Strava-inspired Layout** with three-column desktop and single-column mobile

### 🏗️ Architecture

- **Component-based** React architecture with Clean Architecture principles
- **TypeScript** for type safety
- **React Query** at feature boundaries for data caching and state management
- **ESLint + Prettier** for code consistency
- **Tailwind CSS** for styling
- **Modular file structure** with organized components

**📚 For comprehensive architecture documentation, see [docs/architecture/ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md)**

**Quick Links**:

- [System Architecture (C4 Diagrams)](./docs/architecture/ARCHITECTURE.md#architecture-diagrams)
- [Caching Strategy](./docs/architecture/CACHING_STRATEGY.md)
- [Deployment Architecture](./docs/architecture/diagrams/09-deployment-architecture.md)
- [Data Flow Diagrams](./docs/architecture/ARCHITECTURE.md#data-flow-sequence-diagrams)

## Getting Started

### Prerequisites

- Node.js 18+
- npm (this project uses npm exclusively)
- Firebase account (free tier is sufficient for development)

### Firebase Setup (Required)

**Before running the app, you must configure Firebase:**

Ambira uses Firebase for authentication and database. Our comprehensive setup guide covers everything you need:

**[Complete Firebase Setup Guide](./docs/setup/FIREBASE_SETUP.md)** - Step-by-step instructions

This guide includes:

- Firebase project creation and configuration
- Authentication setup (Email/Password + Google Sign-In)
- Firestore database and security rules deployment
- Environment variable configuration
- Connection testing and verification
- Firebase Emulators for local development (optional)
- Comprehensive troubleshooting

**Quick Setup Summary**:

1. **Create Firebase Project** at [console.firebase.google.com](https://console.firebase.google.com)
2. **Enable Authentication** (Email/Password and Google providers)
3. **Create Firestore Database** (production mode)
4. **Copy Firebase Config** from Project Settings
5. **Configure Environment Variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Firebase configuration
   ```
6. **Deploy Security Rules**:
   ```bash
   npx firebase-tools login
   npx firebase-tools init firestore
   npx firebase-tools deploy --only firestore:rules --non-interactive
   ```
7. **Test Your Setup** (see guide for detailed testing steps)

For detailed instructions, troubleshooting, and optional emulator setup, see:

- **[FIREBASE_SETUP.md](./docs/setup/FIREBASE_SETUP.md)** - Complete setup guide
- **[FIREBASE_INDEXES.md](./docs/setup/FIREBASE_INDEXES.md)** - Required Firestore indexes

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

3. Configure Firebase environment variables:

```bash
cp .env.example .env.local
# Open .env.local and paste your Firebase (and optional Sentry) credentials

# Firebase configuration template
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
NEXT_PUBLIC_SENTRY_DSN=...
SENTRY_AUTH_TOKEN=...
```

Refer back to the Firebase Setup section above if you need help finding the values.

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

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

## Development Notes

- Firestore does not allow fields with `undefined` values. Creation and update logic for projects now strips undefined keys before writes to prevent `Unsupported field value: undefined` errors.
- **Follow/Unfollow System**: Uses batched `update()` operations instead of `set()` with merge for better compatibility with Firestore security rules and increment operations. Security rules allow authenticated users to update follower/following counts without modifying other profile fields.
- **Sessions-Only Architecture (Strava-like)**:
  - **Sessions ARE the primary content type** - Following Strava's model where activities are the main content, sessions function as posts directly. There is NO separate Post type or posts collection.
  - The feed displays sessions with `visibility: 'everyone' | 'followers'`, similar to how Strava shows activities.
  - Each session includes social engagement fields: `supportCount`, `commentCount`, and `isSupported`.
  - `getFeedSessions()` fetches sessions from the `sessions` collection and populates them with user and project data to create `SessionWithDetails`.
  - Profile tabs show user sessions as their activity history.
  - Support/comments are tied directly to session IDs.
  - All components use `SessionWithDetails` instead of `PostWithDetails`.
  - Comments use `sessionId` instead of `postId`.
  - All fields include proper fallbacks for missing data to prevent rendering errors.

### Required Firestore Indexes

Composite indexes are required for complex queries in Ambira. The easiest approach is to let Firestore auto-create them when needed.

**Quick Method**: When you see index errors in the browser console, click the provided link to auto-create the index.

**Complete Index Documentation**: See [docs/setup/FIREBASE_INDEXES.md](./docs/setup/FIREBASE_INDEXES.md) for:

- Full list of required indexes
- Manual creation instructions
- Troubleshooting index issues
- Performance best practices

**Common Indexes**:

1. **Sessions - Following Feed**
   - Collection: `sessions`
   - Fields: `visibility` (Ascending), `createdAt` (Descending)
   - Used for: Recent and Following feed types

2. **Sessions - User Activity with Date Filter**
   - Collection: `sessions`
   - Fields: `userId` (Ascending), `createdAt` (Ascending)
   - Used for: Group leaderboards with time filters

3. **Challenge Participants - Leaderboard**
   - Collection: `challengeParticipants`
   - Fields: `challengeId` (Ascending), `progress` (Descending)
   - Used for: Challenge leaderboards

See the [complete index guide](./docs/setup/FIREBASE_INDEXES.md) for all required indexes.

## Documentation

### 👥 User Documentation

For end users learning how to use Ambira:

- **[User Guide](./docs/USER_GUIDE.md)** - Complete guide to using Ambira, from getting started to advanced features
- **[Features Overview](./docs/FEATURES.md)** - Comprehensive list of all available features with descriptions

### 👨‍💻 Developer Documentation

For developers working on the Ambira codebase:

#### 🚀 Getting Started (New Developers Start Here!)

**[📘 Developer Guide](./docs/DEVELOPER_GUIDE.md)** - Complete step-by-step guide for new developers (30 min setup)

This guide covers:

- Quick start with all setup steps in order
- Development workflow and daily commands
- Key concepts and architecture patterns
- Testing strategy and best practices
- Common issues and troubleshooting
- Contributing guidelines and PR checklist

**Step-by-Step Setup Guides:**

1. **[Setup Guide](./docs/setup/README.md)** - Complete development environment setup
   - Firebase configuration (required)
   - Environment variables
   - Common troubleshooting
2. **[Testing Quickstart](./docs/testing/QUICKSTART.md)** - Get started with testing in 5 minutes
3. **[Architecture Overview](./docs/architecture/README.md)** - Understand the codebase structure

#### Core Developer Resources

- **[CLAUDE.md](./CLAUDE.md)** - AI assistant guidelines and project instructions (comprehensive developer guide)
- **[Testing Documentation](./docs/testing/README.md)** - Complete testing guide and best practices
- **[Architecture Documentation](./docs/architecture/README.md)** - System architecture and design patterns
- **[Caching Strategy](./docs/architecture/CACHING_STRATEGY.md)** - React Query implementation patterns
- **[Architecture Examples](./docs/architecture/EXAMPLES.md)** - Complete feature implementations
- **[Migration Guide](./docs/architecture/MIGRATION_GUIDE.md)** - Guide for migrating to new patterns

#### Testing Resources

- **[Testing Handbook](./docs/testing/TESTING_HANDBOOK.md)** - Complete testing reference
- **[Testing Strategy](./docs/testing/TESTING_STRATEGY.md)** - High-level philosophy and quality standards
- **[Playwright CI Setup](./docs/testing/playwright-ci-setup.md)** - E2E testing in CI/CD

## Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our development process, coding standards, and how to submit pull requests.

**Quick Start for Contributors**:

1. Read the [Code of Conduct](CODE_OF_CONDUCT.md)
2. Review the [Contributing Guidelines](CONTRIBUTING.md)
3. Check out the [Architecture Documentation](./docs/architecture/README.md)
4. See [Testing Documentation](./docs/testing/README.md) for testing requirements
5. Browse [open issues](https://github.com/your-org/ambira/issues) or create a new one

This project follows a structured development approach with clear separation of concerns and TypeScript for type safety.

## License

This project is part of the Ambira productivity tracking platform.
