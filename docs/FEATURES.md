# Ambira Features Overview

A comprehensive guide to all features available in Ambira - your social productivity tracker.

## Table of Contents

- [Authentication & Onboarding](#authentication--onboarding)
- [Session Tracking](#session-tracking)
- [Activity System](#activity-system)
- [Social Features](#social-features)
- [Groups](#groups)
- [Challenges](#challenges)
- [Profile & Analytics](#profile--analytics)
- [Streaks & Achievements](#streaks--achievements)
- [Settings & Privacy](#settings--privacy)
- [Mobile Experience](#mobile-experience)
- [Coming Soon](#coming-soon)

---

## Authentication & Onboarding

### Sign Up / Sign In

**Multiple Authentication Methods:**

- **Email & Password**: Traditional account creation with email verification
- **Google Sign-In**: One-click authentication with Google account
- **Session Persistence**: Stay logged in across browser sessions
- **Secure Authentication**: Firebase Authentication with industry-standard security

**Onboarding Flow:**

1. Welcome screen introducing Ambira
2. Account creation with email or Google
3. Profile setup (name, username, bio)
4. Profile picture upload (optional)
5. Introduction to core features
6. Activity selection tutorial

**Status**: ✅ Fully Implemented

---

## Session Tracking

### Timer-Based Tracking

**Features:**

- **Real-time Timer**: Live countdown with millisecond precision
- **Pause/Resume**: Flexible control during active sessions
- **Background Persistence**: Timer continues if you close browser or navigate away
- **Active Session Indicator**: Header shows elapsed time or "Active" status
- **Auto-save**: Active session data saved locally and synced to Firebase

**How It Works:**

1. Select activity from picker
2. Click "Start" to begin tracking
3. Work on your task
4. Optional: Pause/resume as needed
5. Click "Finish" when done
6. Add details (title, notes, visibility)
7. Save session to profile and feed

**Status**: ✅ Fully Implemented

### Manual Session Entry

**Features:**

- **Retroactive Logging**: Record past sessions you forgot to track
- **Flexible Input**: Custom date, time, and duration
- **Same Session Details**: Title, notes, activity, visibility
- **Identical Appearance**: Manual sessions look the same as timed sessions in feed

**Use Cases:**

- Forgot to start timer
- Offline work sessions
- Bulk entry of past work
- Importing data from other tools

**Status**: ✅ Fully Implemented

### Session Details

**Every session includes:**

- **Duration**: Time spent in hours and minutes
- **Activity**: What type of work (from activity system)
- **Title**: Session name or summary
- **Notes**: Detailed description of accomplishments
- **Visibility**: Who can see this session (everyone, followers, private)
- **Timestamp**: When the session occurred
- **Social Metrics**: Support count, comment count
- **User Attribution**: Session creator with profile link

**Status**: ✅ Fully Implemented

---

## Activity System

### Default Activities

**10 System-Wide Activities:**

1. **Work** - General work sessions
   - Icon: Briefcase
   - Color: Blue
   - Use: Office work, meetings, general tasks

2. **Coding** - Software development
   - Icon: Code brackets
   - Color: Green
   - Use: Programming, debugging, code review

3. **Side Project** - Personal projects
   - Icon: Rocket
   - Color: Purple
   - Use: Side hustles, personal initiatives

4. **Planning** - Strategic planning
   - Icon: Calendar
   - Color: Orange
   - Use: Roadmapping, organizing, scheduling

5. **Study** - Formal education
   - Icon: Book open
   - Color: Red
   - Use: Coursework, exam prep, homework

6. **Learning** - Skill development
   - Icon: Graduation cap
   - Color: Blue
   - Use: Online courses, tutorials, skill practice

7. **Reading** - Reading sessions
   - Icon: Book
   - Color: Brown
   - Use: Books, articles, documentation

8. **Research** - Investigation
   - Icon: Search
   - Color: Teal
   - Use: Market research, data analysis

9. **Creative** - Creative work
   - Icon: Palette
   - Color: Pink
   - Use: Design, art, creative projects

10. **Writing** - Content creation
    - Icon: Pen
    - Color: Indigo
    - Use: Writing, blogging, documentation

**Status**: ✅ Fully Implemented

### Custom Activities

**Create Your Own Activities:**

- **Customization**: Name, category, icon, color, description
- **Limit**: Up to 10 custom activities per user
- **Management**: Edit or delete custom activities anytime
- **Usage Tracking**: Same analytics as default activities
- **Feed Integration**: Custom activities appear in feed and analytics

**Example Use Cases:**

- Specific work types (Client Work, Admin Tasks)
- Hobbies (Music Practice, Language Learning)
- Health activities (Meditation, Exercise)
- Business operations (Sales Calls, Email Management)

**Status**: ✅ Fully Implemented

### Recent Activities

**Smart Activity Picker:**

- **Horizontal Bar**: Shows 5 most recently used activities
- **Quick Access**: One-click selection of frequent activities
- **Auto-sorting**: Activities reorder based on usage
- **Usage Tracking**: LastUsed timestamp and useCount
- **Fallback**: New users see popular default activities first

**Status**: ✅ Fully Implemented

### Activity Analytics

**Per-Activity Insights:**

- Total sessions logged
- Total hours tracked
- Average session duration
- Sessions over time (charts)
- Weekly and monthly trends
- Activity breakdown (percentage of total time)

**Visualizations:**

- Bar charts for sessions over time
- Pie chart for activity distribution
- Line graph for trends
- Detailed data tables

**Status**: ✅ Fully Implemented

---

## Social Features

### Following System

**Follow Users:**

- **Discover**: Search by name/username or browse suggested users
- **Follow**: One-click to follow, instant UI update
- **Unfollow**: One-click to unfollow
- **Following Feed**: See sessions from people you follow
- **Follower Count**: Track followers and following on profiles

**Features:**

- Optimistic updates (instant UI feedback)
- Bidirectional relationships (mutual following)
- Follow/unfollow from profile or user cards
- Following tab on profile to see who you follow

**Status**: ✅ Fully Implemented

### Feed

**Multiple Feed Types:**

1. **Recent**: Latest public sessions from all users
   - Shows everyone's public sessions
   - Sorted by most recent
   - Discover new users

2. **Following**: Sessions from people you follow
   - Only shows followed users
   - Personalized feed
   - Stay updated with your network

3. **Trending**: Popular sessions (coming soon)
   - High engagement sessions
   - Viral productivity moments
   - Community highlights

**Feed Interactions:**

- **Support (Like)**: Click heart icon to support sessions
- **Comment**: Add encouraging comments or ask questions
- **View Profile**: Click username/avatar to visit profile
- **View Activity**: Click activity name for activity details
- **Share**: Share sessions (coming soon)

**Feed Features:**

- Infinite scroll for continuous browsing
- Real-time updates when new sessions post
- Activity icons and colors
- Visibility indicators
- Support and comment counts

**Status**: ✅ Fully Implemented (Recent & Following feeds)

### Comments

**Session Commenting:**

- **Add Comments**: Write comments on any visible session
- **View Comments**: See all comments on a session
- **Comment Modal**: Dedicated interface for reading/writing comments
- **User Attribution**: Each comment shows username and timestamp
- **Comment Count**: Displayed on session cards

**Features:**

- Real-time comment posting
- Comment notifications (coming soon)
- Edit/delete your comments (coming soon)
- Comment privacy (follows session visibility)

**Status**: ✅ Fully Implemented

### Supports (Likes)

**Support Sessions:**

- **One-click Support**: Heart icon to like sessions
- **Support Count**: Number displayed on session cards
- **Supporters List**: Modal showing who supported a session
- **Unsupport**: Click again to remove support
- **Optimistic Updates**: Instant UI feedback

**Status**: ✅ Fully Implemented

### User Discovery

**Find Users:**

- **Search**: Real-time search by name or username
- **Suggested Users**: Algorithm-based recommendations
  - Similar activities
  - Mutual connections
  - Popular users
  - New users
- **User Cards**: Profile preview with follow button
- **Browse Profiles**: Click to view full profile

**Status**: ✅ Fully Implemented

### User Profiles

**Profile Components:**

1. **Header**:
   - Avatar (brand orange color)
   - Name and username
   - Bio and location
   - Join date
   - Stats (total hours, followers, following)
   - Follow/Unfollow button (on other profiles)

2. **Tabs**:
   - **Overview**: Recent sessions and activity summary
   - **Sessions**: Complete session history
   - **Analytics**: Charts and detailed stats
   - **Achievements**: Badges and milestones (coming soon)
   - **Following**: List of followed users

3. **Settings Dropdown** (own profile):
   - My Profile
   - Settings
   - Log Out

**Status**: ✅ Fully Implemented

---

## Groups

### Group Discovery

**Find Groups:**

- Browse all public groups
- Search groups by name or topic
- View group cards with member count
- Filter by privacy type (public vs approval-required)

**Status**: ✅ Fully Implemented

### Join Groups

**Membership:**

- **Public Groups**: Instant join with one click
- **Approval-Required Groups**: Request to join, wait for admin approval
- **Leave Groups**: One-click to leave anytime
- **Member Count**: See how many members in each group

**Status**: ✅ Fully Implemented

### Group Pages

**Group Interface:**

1. **Group Header**:
   - Group image
   - Name and description
   - Member count
   - Join/Leave button
   - Privacy indicator

2. **Tabs**:
   - **Feed**: Sessions from group members
   - **Members**: All group members with profiles
   - **Challenges**: Group-specific challenges
   - **About**: Group rules and information

**Status**: ✅ Fully Implemented

### Group Administration

**Admin Features:**

- Create group
- Edit group details
- Approve/reject join requests
- Remove members
- Create group challenges
- Delete group

**Status**: ✅ Fully Implemented

---

## Challenges

### Challenge Types

**1. Most Activity Challenge:**

- **Goal**: Log the most total hours
- **Scoring**: Cumulative time across all eligible sessions
- **Leaderboard**: Ranked by total hours
- **Example**: "100 Hours in November"

**2. Fastest Effort Challenge:**

- **Goal**: Best tasks-per-hour ratio
- **Scoring**: Efficiency metric (tasks completed / hours)
- **Leaderboard**: Ranked by highest ratio
- **Example**: "Sprint Week - Maximum Velocity"

**3. Longest Session Challenge:**

- **Goal**: Single longest continuous session
- **Scoring**: Duration of longest individual session
- **Leaderboard**: Ranked by longest session
- **Example**: "Deep Work Saturday - 4+ Hour Sessions"

**4. Group Goal Challenge:**

- **Goal**: Collective team target
- **Scoring**: Combined hours from all participants
- **Leaderboard**: Shows individual contributions
- **Example**: "Team 500 - Log 500 hours together"

**Status**: ✅ Fully Implemented

### Challenge Features

**Browse Challenges:**

- Filter by status (Active, Upcoming, Completed)
- Search by name or type
- View challenge cards with details
- See participation status
- Active challenges in sidebar

**Join Challenges:**

- One-click to join
- Automatic progress tracking
- Real-time leaderboard updates
- Can join after start (progress counts from join time)

**Challenge Details:**

- Challenge type and goal
- Start and end dates
- Eligible activities (what counts)
- Participant count
- Reward description
- Rules and requirements
- Time remaining (live countdown)

**Leaderboards:**

- Real-time rankings
- Top 3 podium display
- Full participant table
- Progress bars
- Completion badges
- Filter by following
- View participant profiles

**Status**: ✅ Fully Implemented

### Create Challenges (Admin)

**Challenge Creation:**

1. Select challenge type
2. Set goal (hours, ratio, or target)
3. Choose date range
4. Select eligible activities
5. Add reward description
6. Write challenge rules
7. Launch or schedule

**Admin Management:**

- Edit challenges before start
- Delete challenges before start
- View participant list
- Monitor progress
- Award completion badges

**Status**: ✅ Fully Implemented

---

## Profile & Analytics

### Profile Stats

**Key Metrics:**

- **Total Hours**: Lifetime productive time tracked
- **Followers**: Number of followers
- **Following**: Number of users you follow
- **Current Streak**: Consecutive days with sessions
- **Longest Streak**: Best streak ever

**Status**: ✅ Fully Implemented

### Activity Analytics

**Visualization Types:**

1. **Daily Activity Chart**:
   - Interactive bar chart
   - Period selector (30d, 90d, year, all-time)
   - Summary stats (total hours, avg per day)
   - Hover tooltips with details

2. **Weekly Trends**:
   - Bar chart with actual date ranges
   - Week-over-week comparison
   - Trend indicators

3. **Activity Breakdown**:
   - Horizontal bar charts by activity
   - Percentage of total time
   - Detailed table view
   - Sort by time, sessions, or average

4. **Project Breakdown** (Legacy):
   - Historical project data
   - Maintained for backward compatibility

**Status**: ✅ Fully Implemented

### Session History

**Session List:**

- Complete chronological history
- Filter by date range
- Filter by activity
- Search by title/notes
- Edit or delete sessions
- Export data (coming soon)

**Status**: ✅ Fully Implemented

---

## Streaks & Achievements

### Daily Streaks

**Streak Tracking:**

- **Current Streak**: Days in a row with sessions
- **Longest Streak**: Personal best
- **Streak Display**: Fire emoji (🔥) on profile
- **Visibility**: Choose public or private

**How Streaks Work:**

- Log at least 1 session per day
- Streak increments daily
- Miss a day = streak resets to 0
- Longest streak preserved as record

**Status**: ✅ Fully Implemented

### Achievements (Coming Soon)

**Planned Achievements:**

1. **Milestone Achievements**:
   - First session
   - 10 hours total
   - 100 hours total
   - 1000 hours total

2. **Streak Achievements**:
   - 7-day streak
   - 30-day streak
   - 100-day streak
   - 365-day streak

3. **Social Achievements**:
   - First follower
   - 10 followers
   - 100 followers
   - Top supporter (most supports given)

4. **Challenge Achievements**:
   - First challenge joined
   - First challenge completed
   - Podium finish (top 3)
   - Challenge champion (first place)

5. **Activity Achievements**:
   - Master specific activities
   - Diversity bonus (use all activities)
   - Specialist (100 hours in one activity)

**Status**: ⏳ In Progress

---

## Settings & Privacy

### My Profile Settings

**Editable Fields:**

- Name (display name)
- Bio (about you)
- Location (city, country)
- Profile picture (upload or change)
- Avatar customization

**Status**: ✅ Fully Implemented

### My Account Settings

**Account Info:**

- Email address (view only)
- Username (view, contact support to change)
- Account creation date
- Membership status
- Delete account option

**Status**: ✅ Fully Implemented

### Privacy Controls

**Visibility Settings:**

1. **Profile Visibility**:
   - Everyone: Anyone can view
   - Followers: Only followers can view
   - Private: Only you can view

2. **Activity Visibility**:
   - Default for new sessions
   - Can override per session

3. **Project Visibility** (Legacy):
   - Maintained for backward compatibility

**Status**: ✅ Fully Implemented

### Notification Settings

**Email Notifications:**

- New follower
- Session comments
- Session supports
- Challenge updates
- Group invitations
- Achievement unlocks

**In-App Notifications:**

- Real-time notification bell
- Notification list
- Mark as read
- Notification settings

**Status**: ⏳ In Progress

### Display Preferences

**Customization:**

- Theme (light/dark - coming soon)
- Time format (12h/24h)
- Date format
- Language preferences (coming soon)

**Status**: ⏳ In Progress

---

## Mobile Experience

### Responsive Design

**Mobile-Optimized:**

- Single-column layout
- Touch-friendly controls
- Optimized font sizes
- Mobile-first navigation

**Status**: ✅ Fully Implemented

### Bottom Navigation

**Mobile Nav Bar:**

- Home (feed)
- Timer
- Users (discovery)
- Groups
- Profile

**Features:**

- Fixed bottom position
- Active state indicators
- Icon-based navigation
- Quick access to key features

**Status**: ✅ Fully Implemented

### Floating Action Button (FAB)

**Quick Actions:**

- Start timer
- Log manual session
- Always accessible
- Positioned for thumb reach

**Status**: ✅ Fully Implemented

### Progressive Web App (PWA)

**PWA Features:**

- Install to home screen
- Offline session persistence
- App-like experience
- Push notifications (coming soon)

**Status**: ⏳ In Progress

---

## Coming Soon

### Notifications

- Real-time in-app notifications
- Push notifications (PWA)
- Email digest options
- Notification preferences

**Status**: ⏳ Planned

### Advanced Analytics

- Productivity insights
- AI-powered recommendations
- Goal tracking
- Habit analysis
- Comparative analytics

**Status**: ⏳ Planned

### Achievements System

- Badge collection
- Milestone tracking
- Rarity tiers
- Achievement sharing

**Status**: ⏳ In Progress

### Team Features

- Team workspaces
- Shared goals
- Team analytics
- Admin dashboards

**Status**: ⏳ Planned

### Integrations

- Calendar integration (Google, Outlook)
- Project management tools (Jira, Trello)
- Time tracking export
- API access

**Status**: ⏳ Planned

### Mobile Apps

- Native iOS app
- Native Android app
- Wear OS / Apple Watch support
- Mobile-specific features

**Status**: ⏳ Planned

### Social Enhancements

- Direct messaging
- Session sharing to social media
- Collaborative sessions
- Team challenges
- Mentorship features

**Status**: ⏳ Planned

### Gamification

- Level system
- Experience points
- Leaderboards (global)
- Seasonal challenges
- Rewards marketplace

**Status**: ⏳ Planned

---

## Feature Status Legend

- ✅ **Fully Implemented**: Feature is complete and available
- ⏳ **In Progress**: Feature is actively being developed
- 📋 **Planned**: Feature is scheduled for future development
- 💡 **Proposed**: Feature is under consideration

---

## Feature Requests

Have an idea for a new feature? We'd love to hear from you!

**Submit Feature Requests:**

- Email: feedback@ambira.app
- Use "Contact Us" in app footer
- Include: Feature description, use case, expected benefit

**Community Voting:**

- Upcoming: Feature request board
- Vote on features you want
- Track development progress
- Get updates on your requests

---

## Need Help?

- **User Guide**: [USER_GUIDE.md](/docs/USER_GUIDE.md)
- **Documentation Hub**: [docs/index.md](/docs/index.md)
- **Setup Guides**: [docs/setup/](/docs/setup/)
- **Contact Support**: support@ambira.app
