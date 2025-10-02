# Strava for Productivity - Web App Specification

## 1. Overview

### 1.1 Product Vision
A social productivity tracking app that gamifies focused work through streaks, challenges, groups, and leaderboards. Users log study sessions, side projects, and work - turning productivity into a shareable, competitive sport like Strava does for fitness.

### 1.2 Target Users
- Students tracking study hours
- Professionals managing side projects
- Entrepreneurs building businesses
- Anyone seeking accountability through social productivity tracking

### 1.3 Core Value Proposition
Transform productivity into a social experience with:
- Visual progress tracking and analytics
- Social accountability through friends and groups
- Gamification via streaks, challenges, and achievements
- Community support and competition

---

## 2. Technical Foundation

### 2.1 Platform
- **Primary Platform**: Web application (desktop-first)
- **Mobile**: Responsive web design for mobile browsers
- **Framework Recommendation**: React with modern build tools (Vite recommended)
- **Deployment**: Lovable or similar rapid prototyping platform for MVP

### 2.2 Authentication
- Google OAuth
- Apple Sign-In
- Email/password authentication
- No email verification required for MVP

### 2.3 Key Technical Constraints
- **NO localStorage/sessionStorage** - Use React state only for web artifacts
- **Active timers**: Stored in database with start timestamp for persistence across sessions
- **Email notifications only** (no push notifications in MVP since web-only)

---

## 3. User Onboarding

### 3.1 Account Creation Flow
1. **Authentication Selection**
   - Google / Apple / Email+Password options
   
2. **Profile Creation Screen**
   - First Name (required)
   - Last Name (required)
   - Birthday (required, date picker: mm/dd/yyyy)
   - Gender (dropdown: Man / Woman / Prefer not to say / Non-binary)
   
3. **Role Selection (Optional)**
   - Student / Professional / Entrepreneur / Other
   
4. **Suggested Friends Screen**
   - Shows 5 suggested users with Follow buttons
   - Reasoning displayed (e.g., "Fan favorite", "Local legend near you")
   - "Skip for Now" button at bottom
   
5. **Welcome Screen**
   - "Welcome, [Name]!" with hero image
   - Brief value proposition text
   - "Get Started" button → takes to Home feed

---

## 4. Core Features

## 4.1 Session Logging

### 4.1.1 Live Timer Mode

**Starting a Session:**
- Access via "+" button in top header OR "Start Now" button on Home dashboard
- If timer already running: clicking these buttons navigates to active session view (cannot start multiple timers)

**Timer Session Screen:**
- Selected project/activity displayed at top
- Timer display showing elapsed time (HH:MM:SS)
- Task checklist for the selected project
- Start button (begins timer)

**During Active Timer:**
- Running timer display
- Tasks can be checked off in real-time
- Pause button available
- When paused: Resume or Finish buttons appear

**Active Session Persistence:**
- Active sessions stored in database with start timestamp
- Network interruptions: session continues server-side
- Reconnecting automatically resumes timer at correct elapsed time (calculated from start timestamp)

### 4.1.2 Save Session Screen

Appears when user presses "Finish" button:

**Session Details (Required/Auto-filled):**
- Session name (auto-filled with grey placeholder based on time of day and tag: "Afternoon Study Session", "Morning Work Session", etc.)
- Project/subject dropdown (pre-selected from timer start, can be changed)
- Duration (auto-filled from timer)
- Start time (auto-filled, not editable in timer mode)

**Social Sharing:**
- Description field: "Talk about how it went, share your progress"
- Tag people functionality (@username)

**Categorization:**
- Tag dropdown: Study / Work / Side Project / Reading / Learning (multiple tags allowed, can add custom tags)
- "How did it feel" rating: 1-5 stars (PRIVATE, not shown in feed)

**Privacy Controls:**
- "Who can view" dropdown: Everyone / Followers / Only You (default: Everyone)
- "Show start time" toggle (default: OFF)
- "Don't show task names" toggle (default: OFF - tasks are visible)
- "Don't publish to home or group feeds" toggle (default: OFF - publishes to feeds)

**Tasks Completed:**
- Automatically populated from checked tasks during session
- Displayed in feed unless "don't show task names" is toggled on

**Private Notes:**
- Text field for personal reflection (never shown publicly)

**Actions:**
- Save button (primary action)
- Discard Session (very bottom, destructive action)

### 4.1.3 Manual Entry Mode

**Access:**
- Via "+" button dropdown → "Add manual entry"

**Manual Entry Form:**
Same fields as Save Session Screen, plus:
- Date & Time picker (defaults to current date/time)
  - Separate date field (calendar picker)
  - Separate time field (dropdown with 30-min intervals, can type directly)
- Duration input: Three separate boxes for Hours / Minutes / Seconds (type in values)
- Starting time (when session began)
- Task list field (can manually type tasks completed, separated by newlines or commas)

All other fields identical to Save Session Screen.

---

## 4.2 Projects

### 4.2.1 Project Structure

Projects organize work into categories (analogous to Strava's "Maps").

**Project Attributes:**
- Project name (required)
- Description: "What you'll be working on" (required)
- Icon (select from 10-20 preset icons covering: academic subjects, work types, creative activities, general symbols)
- Color (select from limited brand color palette)
- Weekly target hours (optional)
- Total cumulative target hours (optional)

### 4.2.2 Project Management

**Creating Projects:**
- Access: Via Home dropdown → Projects → "Create Project" button
- No default projects on signup
- Projects created on-demand when needed

**Project Status:**
- Active (default)
- Completed
- Archived

Three tabs in Projects view: Active / Completed / Archived

**Viewing Projects:**
- List view with project cards showing:
  - Project name with icon and color
  - Hours this week / weekly target (e.g., "8h / 10h")
  - Total hours / total target (if set)
  - Progress bars for both targets
  - Current streak indicator (days/weeks active)
  - Last activity date NOT shown

**Sorting:**
- Most recent activity (default)
- Can be changed to alphabetical or custom order

### 4.2.3 Project Detail Page

**Header Section:**
- Project name, icon, color
- Project description
- Goals display:
  - Weekly target: X hours/week
  - Total target: Y hours total

**Data Visualization:**
- Time period filters: 7D / 1M / 3M / 6M / 1Y (tabs)
- Line chart: Cumulative hours over time
  - Includes projection line (dotted/lighter) showing estimated completion date for total target based on current weekly average
  - Display estimated completion date: "At this pace, you'll reach [total target]h by [date]"
- Current period stats displayed above chart:
  - This week: X hours, Y tasks
  
**Activity Feed:**
- List of all sessions logged to this project (chronological, most recent first)
- Each item shows: session title, date, duration, tasks completed

**Tabs:**
- Overview (charts and stats)
- Tasks (task management view)
- Sessions (detailed session history)

---

## 4.3 Task Management

### 4.3.1 Task Structure

**Task Attributes:**
- Task name (simple text, required)
- Status: Active / Completed / Archived
- Associated project (required)

**Task Characteristics:**
- No metadata (no due dates, priority, descriptions in MVP)
- Duplicate names allowed within same project
- Tasks persist across sessions
- Completed tasks remain in the list (marked done but kept)

### 4.3.2 Task Management Interface

**Accessing Tasks:**
- Project detail page → Tasks tab
- Three sub-tabs: Active / Completed / Archived

**During Timer Sessions:**
- All Active tasks from the selected project load automatically
- Check off tasks as completed during session
- Add new tasks on-the-fly during session
- New tasks added during session are immediately saved to project's master task list

**Task List Management:**
- Add task: Simple text input + Add button
- Check off task: Moves to Completed tab
- Archive task: Moves to Archived tab
- Delete task: Permanent removal
- Edit task name: Click to edit inline

---

## 4.4 Social Feed (Home)

### 4.4.1 Layout

**Three-Column Desktop Layout:**

**Left Sidebar - Personal Stats:**
- Current week hours and tasks (with small graph visualization)
- Active streak display: Weeks counter + 7-day calendar showing daily activity
- Quick project tabs (icon-based navigation to switch between project views)

**Center Column - Activity Feed:**
- Algorithmic feed of posts from people you follow
- Algorithm prioritizes:
  - Recent posts (time decay)
  - Users you interact with most (comments, support given)
  - Users with high follower counts
  - Mutual connections
- No filter options in MVP
- Infinite scroll

**Right Sidebar - Discovery:**
1. Active Challenges (your current challenges with progress)
2. Your Groups (with recent activity indicators)
3. Suggested Friends to Follow (with reasoning: "In your area", "Friend of [name]", "In [group name]")

### 4.4.2 Post Display

**Post Structure:**
- Profile picture, name, timestamp, location (if start time shown)
- Session title (user-created or auto-generated)
- Description (optional, user-written)
- Session stats card:
  - Time spent (e.g., "3h 6m")
  - Tasks completed count (e.g., "7 tasks completed")
  - Expandable dropdown showing all completed task names with checkmarks (unless "don't show task names" toggled)
  - Achievements earned during this session (trophy icons with count)

**Post Interactions:**
- Give Support button (heart/thumbs icon) - single tap, one per post
- Comment button (with comment count)
- Share button (bottom right)
- Three-dot menu (top right) for: Edit post, Delete post, Report post (if not your post)

**Support Counter:**
- Shows "X people gave support" with small avatar row of first few supporters
- Click to see full list of supporters

**Comments:**
- Nested threading (replies to comments)
- Can tag users with @username
- Like individual comments
- Edit/delete own comments
- Only post author receives comment notifications (not all thread participants)

### 4.4.3 Post Editing

**Editable Fields (any time, no restrictions):**
- Session title
- Description
- Tags
- Privacy settings
- Task visibility toggle
- Duration and start time (retroactive changes allowed)

**No Edit Indicators:**
- No "edited" label shown
- No edit history tracked

### 4.4.4 Post Management

**Archiving:**
- Hides post from feeds
- Keeps all stats intact (counts toward hours, streaks, project totals)
- Accessible from Profile → Posts tab

**Deleting:**
- Permanently removes post
- Removes from all stats calculations (hours, streaks, project totals, challenge progress)
- Cannot be recovered

**No Bulk Operations:**
- Must delete/archive posts one at a time

---

## 4.5 Social Features

### 4.5.1 Following System

**Model:**
- One-way following (like Instagram/Twitter)
- No mutual acceptance required
- Follow button on profiles and search results

**Discovery Methods:**
1. **Search:**
   - Global search bar with dropdown: People / Groups
   - People search: No filters, simple name search
   - Search results show: Profile pic, name, location, follower/following counts, bio snippet
   
2. **Suggested Friends:**
   - Home page right sidebar
   - Profile page → Following tab → "Who to Follow" dropdown:
     - I'm Following
     - Following Me
     - Who to Follow (recommendations with reasoning shown)
   
3. **Recommendations Based On:**
   - People nearby (location-based)
   - Members of your groups
   - Friends of friends
   - Similar project interests

### 4.5.2 User Profiles

**Public Profile Elements:**
- Profile picture (or initial circle if no photo)
- Full name
- Location (city, state/country)
- Bio (optional)
- Profile stats: Following count, Followers count, Total activities

**Profile Tabs:**
1. **Overview:**
   - Last 4 weeks activity summary
   - Calendar heatmap (current month only):
     - Color intensity based on hours that day
     - Integer hour count displayed on each day
     - Darker = more hours
   - Recent activity graph/charts
   
2. **Achievements:**
   - Trophy case displaying all earned achievements
   - Achievement types:
     - Streak milestones (7, 14, 30, 100+ days)
     - Hour milestones per project (10h, 50h, 100h, 500h+)
     - Task completion milestones (10, 50, 100+ tasks)
     - Challenge completions
     - Personal records (longest session, most tasks in a day, most hours in a week)
     - Consistency badges (X sessions per week, daily study weeks)
     - Project milestones (first session, 10 sessions in project)
   
3. **Following:**
   - List of people you follow
   
4. **Posts:**
   - All your published posts displayed as they appear in feed
   - Scrollable list

### 4.5.3 Privacy Controls

**Profile Settings → Privacy Controls:**

**Post Visibility Defaults:**
- Set default for new posts: Everyone / Followers / Only You

**Profile Visibility:**
- Who can find you in search: Everyone / Only people I follow / No one
- Profile viewable by: Everyone / Followers only

**Interaction Controls:**
- Who can comment on posts: Everyone / Followers only / No one
- Who can tag you: Everyone / Followers only / No one

**Content Hiding:**
- Hide specific projects from profile (checkbox per project)
- Hidden projects: Stats still count, just not visible to others

**Blocking:**
- Block user functionality
- Blocked users cannot: See your posts, comment, follow you, find you in search
- Manage blocked users list

---

## 4.6 Groups (Clubs)

### 4.6.1 Group Discovery

**Access:**
- Bottom nav: Groups tab
- Search bar dropdown: Groups option

**Browse Groups Page:**
- Search bar with filters:
  - Location (city/region search)
  - Category dropdown: Work / Study / Side Project / Learning / Other
  - Type dropdown: Just for Fun / Professional / Competitive / Other

**Group Card Display:**
- Group image/logo
- Group name
- Location
- Member count
- Category badge
- Type badge
- Join button

### 4.6.2 Creating a Group

**Access:**
- Groups page → "Create a Group" button

**Required Fields:**
- Group name
- Group image/logo (upload)
- Location (city/region)
- Category: Work / Study / Side Project / Learning / Other
- Type: Just for Fun / Professional / Competitive / Other
- Description (can include rules/requirements in text for MVP)

**Privacy Settings:**
- Public (anyone can join immediately)
- Requires Approval (admin must accept join requests)

**Group Roles:**
- Creator becomes admin automatically
- Admins can: Create group challenges, remove members, edit group details, delete group

### 4.6.3 Group Detail Page

**Header Section:**
- Cover image banner
- Group icon
- Group name
- Location
- Description

**Right Sidebar:**
- Join Group button (or "Joined" if already member)
- Upcoming Events section (if any)
- Invite Members button
- Member count with avatar previews ("2,089 members and 2,085 others")
- Share Group button
- Report Group button (if not admin)

**Main Content Tabs:**

1. **Posts:**
   - Group-specific feed showing only posts from members
   - Posts show same format as Home feed
   - Group posts are also published to members' main feeds (unless user toggles off during post creation)

2. **Members:**
   - Searchable list of all group members
   - Display: Profile pic, name, location
   - Click to view member profile

3. **Challenges:**
   - List of active group challenges
   - Challenge cards show: Name, goal, time remaining, participant count
   - "Create Challenge" button (admins only)

4. **Leaderboard:**
   - Time period tabs: This Week / This Month / This Year
   - Leaderboard columns:
     - Rank
     - Member (profile pic + name)
     - Hours logged (for selected time period)
     - Tasks completed (for selected time period)
   - Refreshed periodically (not real-time)

---

## 4.7 Challenges

### 4.7.1 Challenge Types

**Group Challenges** (created by group admins only):

1. **Most Activity:**
   - Goal: Who can log the most time or tasks
   - Optional group milestone (e.g., "Group target: 1000 hours combined")
   - Leaderboard ranks by overall hours or tasks

2. **Fastest Effort:**
   - Goal: Best productivity rate (e.g., most tasks per hour)
   - Leaderboard ranks by efficiency metric

3. **Longest Single Session:**
   - Goal: Single longest continuous work session
   - Leaderboard ranks by duration of longest individual session

4. **Group Goal:**
   - Collective target (e.g., "Group completes 500 hours together")
   - No individual leaderboard - shows collective progress bar
   - Everyone contributes to single shared goal

### 4.7.2 Creating a Challenge (Group Admins)

**Access:**
- Group detail page → Challenges tab → "Create Challenge" button

**Challenge Setup:**
- Challenge name
- Challenge description
- Challenge type (select from 4 types above)
- Duration: Start date → End date (date range picker)
- Goal/Target (depends on type):
  - Most Activity: Optional milestone number
  - Fastest Effort: Reference metrics
  - Longest Single: No target needed
  - Group Goal: Required total target
- Which projects count: All projects / Specific projects only
- Participant visibility: Members of this group only

### 4.7.3 Challenge Detail Page

**Hero Section:**
- Challenge badge/logo image
- Challenge name
- Subtitle/tagline
- Date range with countdown: "Oct 1, 2025 to Oct 31, 2025 — 30 days left"

**Challenge Goal Display:**
- Icon representing challenge type
- Goal description (e.g., "Complete 120 minutes of activity")
- Rewards/achievements listed (what you earn for completing)

**Right Sidebar:**
- "Join Challenge" button (primary CTA)
- "Invite Friends" button
- Participant count
- Organizing Group info (logo, name, member count, Join Club button)

**Collapsible Sections:**

1. **Overview:**
   - Full challenge description
   - Rules and requirements
   - Organizing group info
   - Related links

2. **Leaderboard:**
   - Filter tabs: Overall / I'm Following / My Clubs
   - Table columns:
     - Rank number
     - Profile pic + Name + Location
     - Time/Progress for challenge period
     - Progress bar showing percentage toward goal
   - Refreshed periodically
   - Shows all participants (not limited to top 10/100)
   - Note: "Any activity counts toward your progress. Only activities marked visible to Everyone appear on leaderboard rankings."

### 4.7.4 Challenge Participation

**Joining:**
- Click "Join Challenge" button
- Immediately added to participant list
- Challenge appears in Home sidebar "Active Challenges"

**Leaving:**
- Click "Leave Challenge" button on challenge page
- Removed from leaderboard
- No stats changes (completed work still counts in projects)

**Progress Tracking:**
- Only sessions logged after joining count toward challenge
- Sessions must be marked "Everyone" visibility to appear on public leaderboard
- Private sessions count toward personal progress and badges, but not public rankings

---

## 4.8 Streaks

### 4.8.1 Streak Rules

**Definition:**
- A streak is maintained by logging at least one session per calendar day
- Calendar day based on user's timezone

**Maintenance:**
- Any session duration counts (even 1 minute)
- Manual entries count
- Both public and private sessions count

**Streak Breaking:**
- Missing an entire calendar day resets streak to 0
- No grace period or "streak freeze" in MVP

**Streak Display:**
- Shown in weeks on profile
- Daily breakdown visible in calendar view
- Appears in Home sidebar left panel

### 4.8.2 Streak Notifications

**Email Reminder:**
- Sent if no activity logged by 8:00 PM user's local time
- Subject: "Don't break your [X] day streak!"
- Can be disabled in notification settings

---

## 4.9 Achievements

### 4.9.1 Achievement System

**Achievement Categories:**

1. **Streak Achievements:**
   - 7-day streak
   - 14-day streak
   - 30-day streak
   - 100-day streak
   - 365-day streak

2. **Hour Milestones (per project):**
   - 10 hours
   - 50 hours
   - 100 hours
   - 500 hours
   - 1,000 hours

3. **Task Milestones (cumulative):**
   - 10 tasks completed
   - 50 tasks
   - 100 tasks
   - 500 tasks
   - 1,000 tasks

4. **Personal Records:**
   - Longest single session
   - Most tasks in one day
   - Most hours in one week
   - Most productive month

5. **Consistency Badges:**
   - 5 sessions in one week
   - Logged every weekday for a month
   - Studied every day for a week

6. **Project Milestones:**
   - First session in a new project
   - 10 sessions in one project
   - 50 sessions in one project

7. **Challenge Completions:**
   - Completed 1 challenge
   - Completed 5 challenges
   - Top 3 finish in challenge

### 4.9.2 Achievement Display

**On Posts:**
- Achievements earned during that specific session show on the post
- Displayed as trophy/badge icons with count
- Clicking shows achievement details

**On Profile:**
- Achievements tab shows trophy case
- All earned achievements displayed chronologically
- Shows: Achievement icon, name, description, date earned

**Notifications:**
- Achievement unlock triggers notification
- Shows on Home feed if worthy of announcement

---

## 5. Navigation Structure

### 5.1 Desktop Navigation

**Top Navigation Bar:**
- Logo (left)
- Search bar (people/groups toggle)
- Main nav items: Home (with Projects dropdown) / Groups / Challenges
- Right side: Notifications bell, Profile picture (dropdown for settings/logout), "+" button (for logging)

**"+" Button Dropdown:**
- Start Timer
- Add Manual Entry
- Create Group
- Create Post (text post to feed, not session-related)

**Home Dropdown:**
- View Feed (default)
- Projects (navigates to projects list)

### 5.2 Mobile Navigation

**Top Bar (Minimal):**
- Logo (left)
- Search icon
- Notifications icon
- Profile icon

**Bottom Navigation Bar:**
- Home (house icon)
- Groups (people icon)
- Start (center, large "+" button)
- Challenges (trophy icon)
- Profile (user icon)

**Responsive Behavior:**
- Three-column desktop layout → single-column on mobile
- Left sidebar stats → collapsible section at top
- Right sidebar discovery → separate "Discover" view accessible from menu
- Feed becomes primary full-width content

---

## 6. Settings & Preferences

### 6.1 Settings Navigation

**Access:**
- Click profile picture → dropdown → Settings
- Left sidebar navigation with sections

### 6.2 Settings Sections

**My Profile:**
- Profile photo upload/change
- Name (first, last)
- Birthday (with edit on hover)
- Gender
- Location (city, state/country)
- Bio (text area)
- Vanity URL (e.g., app.com/yourname)

**My Account:**
- Email address (display + change)
- Password (change password button)
- Connected accounts (Google, Apple)
- Delete account (warning + confirmation required)

**Privacy Controls:**
- Default post visibility: Everyone / Followers / Only You
- Who can find me in search: Everyone / Followers only / No one
- Who can comment on my posts: Everyone / Followers only / No one
- Who can tag me: Everyone / Followers only / No one
- Hide specific projects (checkbox list of projects)
- Blocked users list (manage blocks)

**Email Notifications:**
- Granular toggles for each notification type:
  - Someone gives support to my post
  - Someone comments on my post
  - Someone replies to my comment
  - New follower
  - Streak reminder (8 PM if no activity)
  - Challenge updates (moved up in leaderboard, challenge ending soon)
  - Group activity (new post in my groups, new challenge created)
  - Achievement unlocked
  - Friend tagged me
  - Weekly summary
- Global toggle: Email notifications on/off

**Display Preferences:**
- Theme: Light / Dark / System default
- Language: English (more languages post-MVP)

---

## 7. Data & Analytics

### 7.1 Personal Analytics

**Home Dashboard (Left Sidebar):**
- Current week totals: Hours + Tasks
- Small graph showing daily breakdown
- Streak counter with weekly view

**Profile Overview Tab:**
- Last 4 weeks: Total activities count
- Calendar heatmap (current month)
- Activity trend graph

**Project Detail Page:**
- Time period filters: 7D / 1M / 3M / 6M / 1Y
- Cumulative hours line chart
- Projection line to goal completion
- This week stats: Hours, tasks, average session length
- Session history list

### 7.2 Social Analytics

**Post Metrics (visible to post author):**
- Support count
- Comment count
- View count (post-MVP)

**Group Metrics (visible to admins):**
- Member count
- Active members (logged session this week)
- Total hours logged by group
- Total tasks completed by group

**Challenge Metrics:**
- Your rank
- Your progress vs goal
- Time remaining
- Participants count

---

## 8. Edge Cases & Error Handling

### 8.1 Session Management

**Active Timer Conflicts:**
- Only one timer can run at a time
- Clicking "Start Now" when timer active → navigates to active session view
- Active timer indicator shown in nav bar

**Network Issues During Timer:**
- Active session stored in database with start timestamp
- On reconnect: calculates elapsed time from start timestamp
- Timer resumes at correct time automatically
- No local storage fallback needed

### 8.2 Data Integrity

**Deleting Projects:**
- If project has sessions: Remove project tag from all sessions, convert to "None"
- If project is archived: Prevent deletion (must unarchive first)

**Deleting Posts:**
- Permanent removal
- Stats recalculated: hours, streaks, project totals all decrease
- Challenge progress decreases if applicable

**Archiving Posts:**
- Hidden from feeds
- All stats preserved
- Still counts toward everything

**Leaving Groups/Challenges:**
- Simply removes user from participant list
- No stat changes
- Past contributions remain

### 8.3 Validation & Constraints

**Task Names:**
- Duplicates allowed within same project
- Required: Non-empty text

**Session Duration:**
- Maximum: 24 hours (sanity check)
- Minimum: 1 minute

**Project Targets:**
- Both weekly and total targets optional
- Must be positive numbers if set

**Post Visibility:**
- Cannot change visibility after 100+ comments/support (prevents abuse)

---

## 9. Content Moderation

### 9.1 User-Level Moderation

**Blocking:**
- Block user from profile or post menu
- Blocked user cannot: see your posts, comment, follow, find you in search
- Manage blocks in Privacy Settings

**Reporting:**
- Report button on posts/comments/groups
- Report reasons: Spam, Harassment, Inappropriate content, Other
- Submitted to platform review (admin dashboard post-MVP)

### 9.2 Group-Level Moderation

**Group Admin Powers:**
- Remove members from group
- Delete posts in group feed
- Create/edit/delete group challenges
- Edit group details
- Delete group

**Member Actions:**
- Leave group (any time)
- Report group (if not member)

---

## 10. Notifications

### 10.1 Notification Types

**Social Notifications:**
- New follower
- Support on your post
- Comment on your post (not replies to thread, only top-level)
- Tagged in post or comment
- Reply to your comment

**Activity Notifications:**
- Streak reminder (8 PM if no activity today)
- Achievement unlocked
- Weekly summary (every Monday)

**Group Notifications:**
- New post in your group
- New challenge created in group
- Group challenge ending soon (2 days before)

**Challenge Notifications:**
- Moved up in leaderboard (daily digest)
- Challenge ending soon (2 days, 1 day reminders)
- Challenge completed (when you hit goal)

### 10.2 Notification Delivery

**Email Only (MVP):**
- All notifications via email
- Configurable per notification type in settings
- Immediate delivery for most types
- Digests for: leaderboard updates (daily), group posts (daily)

**Future: In-App Notifications:**
- Bell icon in nav bar (post-MVP)
- Unread count badge
- Notification center dropdown

---

## 11. Search & Discovery

### 11.1 Search Functionality

**Global Search Bar:**
- Dropdown toggle: People / Groups
- Search operates on selected type only

**People Search:**
- Search by name (first, last, or both)
- Results show: Profile pic, full name, location, bio snippet, follower counts
- Follow button on each result
- No filters in MVP

**Groups Search:**
- Search by group name or description keywords
- Filters available:
  - Location (text input, matches city/region)
  - Category: Work / Study / Side Project / Learning / Other
  - Type: Just for Fun / Professional / Competitive / Other
- Results show: Group image, name, location, member count, category badge, type badge, Join button

### 11.2 Discovery Features

**Suggested Friends (Home sidebar):**
- Algorithm considers:
  - Location proximity
  - Mutual groups
  - Friends of friends
  - Similar project tags
- Shows: Profile pic, name, location, reasoning ("In Seattle area", "Member of [group]")
- Follow button on each suggestion

**Suggested Groups (Groups page):**
- Based on: Your location, your tags, your friends' groups
- Curated list on main Groups browse page

**Trending Content (Future):**
- Trending posts (most support/comments in last 24h)
- Trending groups (most new members this week)
- Not in MVP

---

## 12. Performance & Optimization

### 12.1 Loading Strategy

**Initial Page Load:**
- Above-the-fold content prioritized
- Lazy load images in feed
- Infinite scroll with pagination (load 20 posts at a time)

**Feed Updates:**
- Algorithmic feed refreshes on pull-down
- New post indicator at top ("X new posts" - click to load)
- Not real-time/live updates

**Leaderboards:**
- Cached and refreshed every 15 minutes
- "Last updated: X minutes ago" timestamp shown

### 12.2 Data Caching

**Static Content:**
- Profile pictures cached aggressively
- Group images cached
- Icons and colors stored efficiently

**Dynamic Content:**
- Feed posts cached per user
- Invalidated on new post creation
- Profile stats cached for 5 minutes

---

## 13. Accessibility

### 13.1 Core Requirements

**Keyboard Navigation:**
- All interactive elements keyboard-accessible
- Logical tab order throughout app
- Escape key closes modals/dropdowns

**Screen Reader Support:**
- Semantic HTML throughout
- ARIA labels on interactive elements
- Alt text on all images

**Visual Accessibility:**
- Minimum 4.5:1 contrast ratio for text
- Focus indicators on all interactive elements
- No information conveyed by color alone

**Responsive Text:**
- Respects browser font size settings
- Scales appropriately with zoom

---

## 14. Security & Privacy

### 14.1 Authentication Security

**Password Requirements:**
- Minimum 8 characters
- Must include: letter and number
- Password hashing (bcrypt recommended)

**Session Management:**
- JWT tokens for session auth
- Secure, httpOnly cookies
- 30-day expiration with refresh
- Logout invalidates token

# Strava for Productivity - Web App Specification (Continued)

## 14.2 Data Privacy (Continued)

**Third-Party:**
- No data sold to third parties
- OAuth limited to profile information only (name, email, profile picture)
- Analytics anonymized (post-MVP)

**Data Retention:**
- Deleted posts: Permanently removed within 30 days
- Deleted accounts: All user data removed within 90 days
- Archived content: Retained indefinitely unless deleted

---

## 15. API & Integrations (Future)

### 15.1 Export Functionality (Post-MVP)

**Data Export:**
- Users can export all their data as JSON/CSV
- Includes: sessions, projects, tasks, posts, comments
- Requested via settings, delivered via email link

### 15.2 Potential Integrations (Post-MVP)

**Calendar Integration:**
- Google Calendar sync for scheduled study sessions
- iCal export for sessions

**Productivity Tools:**
- Notion integration for task sync
- Todoist integration
- Google Tasks

**Social Platforms:**
- Share achievements to Instagram/Twitter
- Import contacts for friend suggestions

---

## 16. Content Guidelines

### 16.1 Community Standards

**Allowed Content:**
- Productivity updates and reflections
- Goal setting and progress sharing
- Encouraging comments and support
- Study/work tips and resources
- Group coordination and planning

**Prohibited Content:**
- Harassment or bullying
- Spam or promotional content
- Inappropriate images or language
- Misinformation about health/academics
- Content encouraging unhealthy work habits (e.g., extreme sleep deprivation, dangerous productivity hacks)

### 16.2 Healthy Productivity Guidelines

**Platform Messaging:**
- Emphasize sustainable productivity over burnout
- Celebrate rest days and balanced approaches
- Discourage comparison-driven anxiety
- Promote mental health awareness

**UI Considerations:**
- No pressure to maintain perfect streaks
- Achievements celebrate progress, not perfection
- Positive, encouraging notification copy
- Option to hide competitive elements (future feature)

---

## 17. Monetization Strategy (Future)

### 17.1 Free Tier (MVP)

**Included Features:**
- Unlimited session logging
- Unlimited projects
- Join unlimited groups
- Participate in challenges
- Full social features
- Basic analytics

### 17.2 Premium Tier (Post-MVP)

**Potential Premium Features:**
- Advanced analytics and insights
- Custom achievement creation
- Priority in leaderboards/discovery
- Custom themes
- Bulk data export
- Integration with third-party tools
- Remove ads (if ads added to free tier)

---

## 18. Technical Architecture

### 18.1 Database Schema Overview

**Users Table:**
- id, email, password_hash, name, birthday, gender, location, bio, profile_picture_url, vanity_url
- created_at, updated_at
- default_post_visibility, streak_count, last_activity_date

**Projects Table:**
- id, user_id, name, description, icon, color, weekly_target, total_target, status
- created_at, updated_at, archived_at

**Tasks Table:**
- id, project_id, name, status (active/completed/archived), completed_at
- created_at, updated_at

**Sessions Table:**
- id, user_id, project_id, title, description, duration_seconds, start_time
- tags (JSON array), how_felt_rating, private_notes
- visibility, show_start_time, show_task_names, publish_to_feeds
- is_archived, created_at, updated_at

**Session_Tasks Table:**
- id, session_id, task_id, completed_during_session (boolean)

**Active_Timers Table:**
- id, user_id, project_id, start_time, current_tasks (JSON array)
- created_at

**Posts Table:**
- id, session_id, user_id, content (description), support_count, comment_count
- created_at, updated_at

**Follows Table:**
- id, follower_id, following_id, created_at

**Groups Table:**
- id, name, description, image_url, location, category, type, privacy_setting
- created_at, admin_user_ids (JSON array)

**Group_Members Table:**
- id, group_id, user_id, joined_at

**Challenges Table:**
- id, group_id (nullable for global), name, description, type, goal_value
- start_date, end_date, created_by_user_id

**Challenge_Participants Table:**
- id, challenge_id, user_id, current_progress, joined_at

**Achievements Table:**
- id, user_id, achievement_type, achievement_name, earned_at, session_id (nullable)

**Comments Table:**
- id, post_id, user_id, parent_comment_id (nullable for threading), content, like_count
- created_at, updated_at

**Support Table:**
- id, post_id, user_id, created_at

**Notifications Table:**
- id, user_id, type, content (JSON), read, created_at

### 18.2 Key API Endpoints

**Authentication:**
- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/oauth/google
- POST /api/auth/oauth/apple

**Sessions:**
- POST /api/sessions/start (start timer)
- PUT /api/sessions/active/:id (update active timer)
- POST /api/sessions/active/:id/finish (finish timer)
- POST /api/sessions/manual (create manual entry)
- PUT /api/sessions/:id (edit session)
- DELETE /api/sessions/:id (delete session)
- PUT /api/sessions/:id/archive (archive session)

**Projects:**
- GET /api/projects (list user's projects)
- POST /api/projects (create project)
- GET /api/projects/:id (project details)
- PUT /api/projects/:id (update project)
- DELETE /api/projects/:id (delete project)
- GET /api/projects/:id/stats (project analytics)

**Tasks:**
- GET /api/projects/:id/tasks (list project tasks)
- POST /api/projects/:id/tasks (create task)
- PUT /api/tasks/:id (update task)
- DELETE /api/tasks/:id (delete task)

**Social:**
- GET /api/feed (get home feed)
- POST /api/posts/:id/support (give support)
- DELETE /api/posts/:id/support (remove support)
- POST /api/posts/:id/comments (add comment)
- GET /api/users/:id (get user profile)
- POST /api/users/:id/follow (follow user)
- DELETE /api/users/:id/follow (unfollow user)

**Groups:**
- GET /api/groups (search/browse groups)
- POST /api/groups (create group)
- GET /api/groups/:id (group details)
- POST /api/groups/:id/join (join group)
- DELETE /api/groups/:id/leave (leave group)
- GET /api/groups/:id/members (list members)
- GET /api/groups/:id/feed (group posts)
- GET /api/groups/:id/leaderboard (group leaderboard)

**Challenges:**
- GET /api/challenges (list challenges)
- POST /api/challenges (create challenge - group admins only)
- GET /api/challenges/:id (challenge details)
- POST /api/challenges/:id/join (join challenge)
- DELETE /api/challenges/:id/leave (leave challenge)
- GET /api/challenges/:id/leaderboard (challenge leaderboard)

**Search:**
- GET /api/search/users?q=query
- GET /api/search/groups?q=query&location=&category=&type=

**Notifications:**
- GET /api/notifications (list notifications)
- PUT /api/notifications/:id/read (mark as read)

---

## 19. Testing Strategy

### 19.1 Unit Testing

**Critical Paths to Test:**
- Session duration calculation
- Streak calculation logic
- Achievement trigger conditions
- Privacy settings enforcement
- Project deletion cascading

### 19.2 Integration Testing

**Key Flows:**
- Complete onboarding flow
- Start timer → complete session → post to feed
- Create manual entry → edit → delete
- Join group → create challenge → participate
- Follow user → see posts in feed → interact

### 19.3 User Acceptance Testing

**Beta Testing Goals:**
- 20-50 early adopters
- Test core features for 2 weeks
- Collect feedback on: ease of use, feature gaps, bugs
- Iterate based on feedback before public launch

---

## 20. Launch Plan

### 20.1 MVP Feature Checklist

**Must-Have (Block Launch):**
- ✅ Authentication (Google, Apple, Email)
- ✅ Timer-based session logging
- ✅ Manual session entry
- ✅ Projects with basic stats
- ✅ Task management
- ✅ Social feed with posts
- ✅ Follow/unfollow users
- ✅ Comments and support
- ✅ Streaks
- ✅ Basic achievements
- ✅ Groups (create, join, browse)
- ✅ Group challenges
- ✅ Search (people and groups)
- ✅ Settings and privacy controls
- ✅ Email notifications
- ✅ Mobile responsive design

**Nice-to-Have (Can Launch Without):**
- Advanced analytics/projections
- Additional achievement types
- Global challenges (admin-created)
- Data export
- Enhanced discovery algorithms
- In-app notifications

### 20.2 Launch Phases

**Phase 1: Private Beta (2-4 weeks)**
- Invite-only access
- 20-50 users
- Focus: Core functionality testing, bug fixes
- Collect qualitative feedback

**Phase 2: Public Beta (4-8 weeks)**
- Open registration
- Marketing to student communities, productivity enthusiasts
- Focus: Scale testing, community building
- Iterate on features based on usage patterns

**Phase 3: Full Launch**
- Public announcement
- Press outreach
- Influencer partnerships
- App Store/social media promotion

---

## 21. Success Metrics

### 21.1 Key Performance Indicators

**Engagement Metrics:**
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Average sessions logged per user per week
- Average session duration
- Comments and support interactions per post
- Return rate (users who come back after Day 1, Week 1, Month 1)

**Growth Metrics:**
- New user signups per week
- Viral coefficient (invites sent per user)
- Group creation rate
- Challenge participation rate

**Retention Metrics:**
- Day 7 retention
- Day 30 retention
- 7-day streak completion rate
- 30-day streak completion rate

**Quality Metrics:**
- Average rating of "how it felt" (indicates user satisfaction with sessions)
- Support-to-post ratio (community engagement health)
- Comments-to-post ratio

### 21.2 Success Targets (3 months post-launch)

**Ambitious Goals:**
- 5,000+ registered users
- 40% Day 30 retention
- 50+ active groups
- 1,000+ sessions logged daily
- 30% of users complete 7-day streak
- 2.0+ support per post average

---

## 22. Post-MVP Roadmap

### 22.1 Short-Term Enhancements (3-6 months)

**Features:**
- Enhanced project analytics with forecasting
- Pomodoro timer integration
- Calendar view of all sessions
- Weekly/monthly email summaries
- Achievement badges visual redesign
- Custom tags beyond preset categories
- Group events scheduling

**Technical:**
- Performance optimization
- Database indexing improvements
- CDN for images
- Progressive Web App (PWA) support

### 22.2 Medium-Term Features (6-12 months)

**Major Features:**
- Native mobile apps (iOS, Android)
- Push notifications
- Study groups with live co-working sessions
- Advanced leaderboards with filters
- Personal goal setting with reminders
- Integration with calendar apps
- Third-party app integrations (Notion, Todoist)
- Premium subscription tier
- Data export functionality

**Community Features:**
- Direct messaging
- Post reactions beyond support (different emoji reactions)
- Saved posts/bookmarks
- User mentions in posts (not just comments)

### 22.3 Long-Term Vision (12+ months)

**Platform Expansion:**
- AI-powered insights ("You're most productive on Tuesdays at 10 AM")
- Study buddy matching algorithm
- Virtual study rooms with video
- Marketplace for productivity courses/resources
- Company/university team accounts
- API for third-party developers
- Browser extension for automatic time tracking

**Monetization:**
- Premium features
- Group sponsorships
- Challenge sponsorships
- Productivity coach marketplace

---

## 23. Brand & Design Guidelines

### 23.1 Visual Identity

**Color Palette:**
- Primary: Energetic orange (similar to Strava's brand)
- Secondary: Deep blue for trust/professionalism
- Accent: Green for achievements/success
- Neutral: Grays for text and backgrounds
- Alerts: Red for warnings, yellow for cautions

**Typography:**
- Headings: Bold, modern sans-serif (e.g., Inter, SF Pro)
- Body: Readable sans-serif with good legibility
- Monospace: For time/duration displays

**Imagery:**
- Focus on people working, studying, collaborating
- Diverse representation
- Bright, optimistic photography
- Avoid stock photo clichés

### 23.2 Tone of Voice

**Brand Personality:**
- Encouraging, not pushy
- Celebratory of progress, not perfection
- Community-focused
- Playful but professional
- Supportive, not competitive in a toxic way

**Messaging Examples:**
- "Great session!" not "Why didn't you study longer?"
- "Your 7-day streak is inspiring!" not "Don't break your streak!"
- "You've logged 20 hours this month" not "You're behind your goal"

**Copy Guidelines:**
- Use second person ("your progress") for personal stats
- Use first person plural ("our community") for group features
- Active voice preferred
- Short, scannable sentences
- Avoid jargon or academic language

---

## 24. Legal & Compliance

### 24.1 Required Policies

**Terms of Service:**
- User responsibilities
- Content ownership
- Account termination conditions
- Dispute resolution

**Privacy Policy:**
- Data collection practices
- How data is used
- Third-party sharing (or lack thereof)
- User rights (access, deletion, export)
- Cookie policy

**Community Guidelines:**
- Acceptable use
- Content moderation policies
- Consequences for violations

### 24.2 Compliance Requirements

**GDPR (EU users):**
- Right to access data
- Right to be forgotten
- Data portability
- Consent for data processing

**COPPA (US - users under 13):**
- Age verification
- Parental consent required
- Limited data collection for minors

**CCPA (California):**
- Privacy policy disclosure
- Opt-out of data sale (though we don't sell data)

---

## 25. Support & Documentation

### 25.1 Help Resources

**Help Center:**
- Getting started guide
- Feature tutorials with screenshots
- FAQ section
- Troubleshooting common issues
- Privacy and security guides

**In-App Help:**
- Tooltips on first use of features
- Contextual help links
- Onboarding tutorial (skippable)

### 25.2 Support Channels

**MVP Support:**
- Email support: support@[domain].com
- Response time: 24-48 hours
- Help center with searchable articles

**Future Support:**
- Live chat (premium users)
- Community forum
- Video tutorials
- Webinars for group admins

---

## 26. Risk Assessment

### 26.1 Technical Risks

**Database Scaling:**
- Risk: Activity feed queries become slow with many users
- Mitigation: Index optimization, caching layer, pagination

**Timer Persistence:**
- Risk: Users lose active timer data during server issues
- Mitigation: Regular auto-save to database, clear error messaging

**Image Hosting:**
- Risk: Profile/group images consume bandwidth
- Mitigation: CDN, image optimization, size limits

### 26.2 Product Risks

**Low Engagement:**
- Risk: Users sign up but don't log sessions regularly
- Mitigation: Onboarding that encourages first session, streak notifications, friend invites

**Toxic Competition:**
- Risk: Leaderboards create unhealthy comparison/anxiety
- Mitigation: Positive messaging, option to hide competitive features (future), community guidelines enforcement

**Privacy Concerns:**
- Risk: Users uncomfortable with public activity tracking
- Mitigation: Clear privacy controls, default to Everyone but easy to change, education about privacy settings

### 26.3 Business Risks

**Market Fit:**
- Risk: Target users don't want social productivity tracking
- Mitigation: Beta testing with target demographic, pivot based on feedback

**Differentiation:**
- Risk: Competing apps offer similar features
- Mitigation: Focus on social/community aspect, excellent UX, rapid iteration

---

## 27. Conclusion

This specification defines a comprehensive social productivity platform that gamifies focused work through social accountability, streaks, challenges, and community. The MVP focuses on core features that enable users to track their work, share progress with friends, and stay motivated through social engagement.

**Key Success Factors:**
1. **Simplicity**: Easy to log a session in under 30 seconds
2. **Social**: Make productivity shareable and celebratory
3. **Sustainable**: Encourage healthy work habits, not burnout
4. **Community**: Foster supportive groups and friendly competition
5. **Mobile-Ready**: Responsive design from day one

**Next Steps:**
1. Build MVP using Lovable or similar rapid development platform
2. Recruit 20-50 beta users from target demographics
3. Iterate based on usage data and feedback
4. Launch publicly with marketing to student/productivity communities
5. Monitor KPIs and adjust roadmap based on user behavior

---

**Document Version:** 1.0  
**Last Updated:** October 1, 2025  
**Status:** Ready for Development