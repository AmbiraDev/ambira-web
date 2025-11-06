# Activities Refactor Plan

**Created**: 2025-11-04
**Branch**: `feature/activities-refactor`
**Goal**: Simplify activities to use defaults primarily (like Strava) while removing the dedicated management screen

## TL;DR - Key Changes

1. **Remove** `/activities` list page entirely
2. **Horizontal + Vertical Dropdown**: Recent activities in horizontal scrollable bar (like Strava), all activities in vertical list below
3. **Smart Analytics Filtering**: Only show activities with ≥1 session in filter dropdown
4. **Two Creation Points**: Bottom of dropdowns + Settings page (with better card-based UI)
5. **Full Backward Compatibility**: Existing custom activities/projects work everywhere
6. **Settings → Activities**: New page for managing custom activities (create/edit/delete with rich stats)

---

## Current State

### What We Have

- Dedicated `/activities` page with full CRUD interface
- 8 default activities created per-user on first load
- Users can create unlimited custom activities
- Activities stored in user subcollection: `/projects/{userId}/userProjects/{activityId}`
- Full management UI: ActivityList, ActivityCard, edit/delete modals
- Complex state management with React Query hooks

### Problems

1. **Over-engineered**: Full CRUD UI is overkill for most users
2. **Inconsistent with Strava model**: Strava doesn't have activity type management, just selection
3. **Poor discoverability**: Users don't know what default activities are available
4. **Duplication**: Every user has their own copy of the same 8 defaults
5. **Navigation clutter**: `/activities` page adds complexity

---

## Proposed Solution

### Core Concept

**"Activities should be picked, not managed"** - like Strava's activity types

### Key Changes

#### 1. Remove `/activities` Management Page

- ❌ Remove `/activities` route entirely
- ❌ Remove `/activities/new` creation page
- ❌ Remove `/activities/[id]/edit` edit page
- ✅ Keep `/activities/[id]` detail page (for viewing stats/sessions)

#### 2. Simplify to Activity Picker Only

Users interact with activities only when:

- Starting a timer (select from dropdown)
- Logging a manual session (select from dropdown)
- Viewing activity stats (from profile or dashboard)

#### 3. Default Activities as Global Types

**New Firestore Collection**: `/activityTypes/{typeId}`

```typescript
interface ActivityType {
  id: string // e.g., 'work', 'study', 'exercise'
  name: string // Display name
  category: string // 'productivity' | 'learning' | 'health' | 'creative'
  icon: string // Iconify icon name
  defaultColor: string // Hex color
  isSystem: boolean // true for defaults, false for custom
  order: number // Display order
  description?: string // Brief description
}
```

**Default Activity Types** (system-wide):

1. **Work** - Professional work and meetings
2. **Study** - Academic learning and coursework
3. **Side Project** - Personal projects and side hustles
4. **Reading** - Books, articles, and documentation
5. **Writing** - Blog posts, documentation, journaling
6. **Creative** - Design, art, music, video
7. **Exercise** - Physical fitness and sports
8. **Learning** - Skill development and online courses
9. **Research** - Investigation and analysis
10. **Coding** - Software development (separate from Work)
11. **Planning** - Goal setting and strategy
12. **Review** - Retrospectives and analysis

#### 4. User Activity Preferences (Lightweight)

**User Subcollection**: `/users/{userId}/activityPreferences/{typeId}`

```typescript
interface UserActivityPreference {
  typeId: string // References /activityTypes/{id}
  isHidden: boolean // Hide from picker (default: false)
  customColor?: string // Override default color
  weeklyTarget?: number // Personal goal in hours
  lastUsed?: Timestamp // For smart sorting
  isPinned?: boolean // Pin to top of picker
}
```

**Benefits**:

- Minimal data per user (only preferences, not full activity data)
- Global defaults can be updated without migrations
- Users can hide activities they don't use
- Smart sorting based on usage

#### 5. Custom Activities (Still Supported)

Users can still create custom activities, but via a simpler flow:

**Where**:

- "Add custom activity" option at bottom of ActivityPicker dropdown
- Opens a simple modal/dialog (not a full page)

**What Gets Created**:

- New entry in `/activityTypes` with `isSystem: false` and `userId: <userId>`
- Automatically creates preference in `/users/{userId}/activityPreferences/{typeId}`

**Constraints**:

- Limited to 5-10 custom activities per user
- Cannot delete system activities (only hide)
- Custom activities are user-scoped (not global)

---

## Migration Strategy

### Phase 1: Add New Collections (Non-Breaking)

1. Create `/activityTypes` collection with 12 default types
2. Add Cloud Function to sync existing user activities → preferences
3. Run migration for existing users

### Phase 2: Update Data Layer

1. Create new `ActivityTypesApi` service
2. Update `useActivitiesQuery` to read from new structure
3. Add fallback logic (try new structure, fall back to old)
4. Ensure sessions still work with both `activityId` and `projectId`

### Phase 3: Update UI Components

1. Refactor `ActivityPicker` to show global types + user customs
2. Add "Hide/Pin" actions to dropdown items
3. Add "Create custom" button at bottom of picker
4. Update activity stats to pull from new structure

### Phase 4: Remove Old Pages

1. Delete `/src/app/activities/page.tsx` (main list)
2. Delete `/src/app/activities/new/page.tsx` (create page)
3. Delete `/src/app/activities/[id]/edit/page.tsx` (edit page)
4. Keep `/src/app/activities/[id]/page.tsx` (stats detail)
5. Remove unused components: ActivityList, ActivityCard (edit mode)

### Phase 5: Cleanup

1. Remove old API methods (deleteProject, updateProject for activities)
2. Clean up deprecated ActivitiesContext
3. Update tests to use new structure
4. Remove old Firestore indexes

---

## UI/UX Improvements

### Enhanced ActivityPicker

**Structure** (Strava-inspired horizontal + vertical layout):

```
┌─────────────────────────────────────────────────────────────┐
│ Select Activity                                          ▼  │
├─────────────────────────────────────────────────────────────┤
│ RECENT                                                      │
│ ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                     │
│ │  📊  │  │  💻  │  │  📚  │  │  ✍️   │  ←  Horizontal     │
│ │ Work │  │ Code │  │Study │  │Write │      scroll        │
│ └──────┘  └──────┘  └──────┘  └──────┘                     │
├─────────────────────────────────────────────────────────────┤
│ ALL ACTIVITIES (Vertical List)                              │
│   🎨 Creative                                               │
│   🏃 Exercise                                               │
│   📖 Reading                                                │
│   🔬 Research                                               │
│   🎯 Planning                                               │
│   📝 Review                                                 │
│   🧠 Learning                                               │
│   🚀 Side Project                                           │
│   ... (all defaults + custom activities)                    │
│   🎸 Guitar Practice          ← Custom activity            │
│   🎮 Game Dev                 ← Custom activity            │
├─────────────────────────────────────────────────────────────┤
│ ➕ Create custom activity...                                │
└─────────────────────────────────────────────────────────────┘
```

**Layout Details**:

- **Horizontal bar** (top): Shows 3-5 most recently used activities
  - Circular icons with activity name below
  - Horizontal scrollable if more than fit in viewport
  - Tapping selects the activity immediately
  - Updates automatically based on usage

- **Vertical list** (below): All default activities + custom activities
  - Standard dropdown list items with icon + name
  - Alphabetically sorted (defaults first, then custom)
  - Custom activities visually distinct (lighter icon/badge)
  - Clicking selects the activity

- **Create custom button** (bottom): Always visible
  - Opens modal for quick activity creation
  - Only place to create custom from dropdown

**Features**:

- ~~No pinning/hiding from dropdown~~ (moved to Settings)
- Keyboard navigation (↑↓ arrows, Enter to select)
- Auto-scroll to selected activity when dropdown opens

### Activity Stats Access

Since we're removing `/activities` page, where do users see their stats?

**Option A: Dashboard Widget** (Recommended)

- Add "Activities" section to main dashboard
- Show top 3-5 activities by time this week
- Click activity → navigate to `/activities/[id]` detail page

**Option B: Profile Tab**

- Add "Activities" tab to profile page (next to Sessions/Achievements)
- Grid/list view of all active activities with stats
- Click activity → navigate to detail page

**Option C: Both**

- Dashboard shows quick summary
- Profile has comprehensive view

### Analytics / Progress Filtering

**CRITICAL REQUIREMENT**: Activity filtering should be smart and session-aware.

**Filter Dropdown in Analytics**:

```
┌─────────────────────────────────────┐
│ Filter by Activity               ▼  │
├─────────────────────────────────────┤
│ ✓ All Activities (default)          │
├─────────────────────────────────────┤
│   📊 Work (142 sessions)            │ ← Has sessions
│   💻 Coding (89 sessions)           │
│   📚 Study (67 sessions)            │
│   ✍️  Writing (34 sessions)         │
│   🎸 Guitar Practice (12 sessions)  │ ← Custom activity
│   🏃 Exercise (5 sessions)          │
└─────────────────────────────────────┘

(Activities with 0 sessions are NOT shown)
```

**Rules**:

1. **Only show activities that have ≥1 session** for the current user
2. **Include both default AND custom activities** if they have sessions
3. **Sort by session count** (most sessions first)
4. **Show session count** next to each activity name
5. **Default selection**: "All Activities" (shows combined data)
6. **Visual distinction**: Custom activities have subtle badge/indicator

**Graph Behavior**:

- When "All Activities" selected → show combined totals
- When specific activity selected → filter all graphs to that activity only
- Graphs update smoothly (animated transition)
- URL updates with query param: `/analytics?activity=coding`

**Backward Compatibility**:

- Legacy sessions with `projectId` instead of `activityId` must be included
- Migration logic: Check both fields when querying
- Display name from activity type (not old project name)

**Empty State**:

- If user has NO sessions yet → Show helpful message
- "Start tracking time to see your analytics"
- Button to start first timer

### Settings Integration

**Settings → Activities** (REQUIRED - new page with better UI):

This is the ONLY place (besides dropdown) to create/edit/delete custom activities.

```
┌─────────────────────────────────────────────┐
│ My Custom Activities                        │
├─────────────────────────────────────────────┤
│ [+ Create Custom Activity]  ← Top button    │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ 🎸 Guitar Practice                      │ │
│ │ Last used: 2 hours ago                  │ │
│ │ 12 sessions · 24.5 hours total          │ │
│ │                            [Edit] [🗑️]  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 🎮 Game Dev                             │ │
│ │ Last used: 3 days ago                   │ │
│ │ 5 sessions · 8 hours total              │ │
│ │                            [Edit] [🗑️]  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 🎨 Digital Art                          │ │
│ │ Never used                              │ │
│ │                            [Edit] [🗑️]  │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

(3/10 custom activities) ← Show limit
```

**Features**:

- **Card-based layout** for each custom activity
- **Rich context**: Shows last used, session count, total hours
- **Create button** at top (prominent)
- **Edit/Delete** actions per card
- **Activity limit** displayed (e.g., "3/10 custom activities")
- **Sorting**: Recently used first
- **Empty state**: Friendly prompt to create first custom activity

**Edit Modal**:

- Simple form: Name, Icon picker, Color picker
- Validation: No duplicate names
- Preview of how it will look in picker

**Delete Confirmation**:

- Warn if activity has existing sessions
- Display count: "This activity has 12 sessions"
- Confirm: "Sessions will be marked as Unassigned"
- **Hard delete** (no soft archive for MVP)

**NOT in Settings**:

- ~~No hiding/pinning of default activities~~ (Simplified - use recent instead)
- ~~No editing of default activities~~ (System-managed)
- ~~No goals~~ (Future feature)
- Focus exclusively on custom activities management

---

## Technical Considerations

### 1. Backward Compatibility

**Sessions Collection**:

```typescript
// Sessions already support both fields
interface Session {
  activityId?: string // New field (preferred)
  projectId?: string // Legacy field
  // ... other fields
}
```

**Query Strategy**:

```typescript
// Queries should check both fields during transition
const sessions = await getDocs(
  query(
    collection(db, 'sessions'),
    where('userId', '==', userId),
    where('activityId', 'in', activityIds) // Primary
  )
)

// Fallback for legacy data
if (sessions.empty) {
  const legacySessions = await getDocs(
    query(
      collection(db, 'sessions'),
      where('userId', '==', userId),
      where('projectId', 'in', activityIds) // Fallback
    )
  )
}
```

### 2. Firestore Security Rules

**New Rules for `/activityTypes`**:

```javascript
match /activityTypes/{typeId} {
  // Anyone can read system activity types
  allow read: if request.auth != null;

  // Only admins can write system types (isSystem == true)
  allow write: if request.auth != null &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';

  // Users can create/update their own custom types
  allow create: if request.auth != null &&
    request.resource.data.userId == request.auth.uid &&
    request.resource.data.isSystem == false;

  allow update, delete: if request.auth != null &&
    resource.data.userId == request.auth.uid &&
    resource.data.isSystem == false;
}
```

**New Rules for `/users/{userId}/activityPreferences`**:

```javascript
match /users/{userId}/activityPreferences/{typeId} {
  allow read, write: if request.auth != null &&
    request.auth.uid == userId;
}
```

### 3. Performance

**Caching Strategy**:

- `/activityTypes` (system): Cache for 24 hours (rarely changes)
- User preferences: Cache for 15 minutes (React Query default)
- Activity stats: Keep current 1-hour cache

**Initial Load**:

- Fetch system activity types once on app load
- Store in React Query cache
- Fetch user preferences lazily (on picker open)

### 4. Search & Filtering

For power users with many custom activities:

```typescript
// Add search to ActivityPicker
const [searchTerm, setSearchTerm] = useState('')

const filteredActivities = useMemo(() => {
  if (!searchTerm) return activities
  return activities.filter((a) => a.name.toLowerCase().includes(searchTerm.toLowerCase()))
}, [activities, searchTerm])
```

---

## Testing Strategy

### Unit Tests

- [ ] `ActivityTypesApi.getSystemTypes()` - returns 12 defaults
- [ ] `ActivityTypesApi.getUserCustomTypes()` - filters by userId
- [ ] `UserActivityPreferences.hide()` / `.pin()` - updates correctly
- [ ] `ActivityPicker` renders with smart sorting

### Integration Tests

- [ ] Create custom activity → appears in picker
- [ ] Hide default activity → disappears from picker
- [ ] Pin activity → appears in pinned section
- [ ] Start timer with activity → session created with correct `activityId`

### E2E Tests

- [ ] New user sees all 12 default activities in picker
- [ ] User can create custom activity from picker
- [ ] User can hide/unhide activities from settings
- [ ] Activity stats page still works after refactor

### Migration Tests

- [ ] Existing user activities migrate to preferences
- [ ] Legacy sessions (with `projectId`) still display correctly
- [ ] Stats calculations work with mixed old/new data

---

## Implementation Checklist

### Data Layer

- [ ] Create `ActivityType` interface in `/src/types/index.ts`
- [ ] Create `UserActivityPreference` interface
- [ ] Create `/src/lib/api/activityTypes.ts` service
- [ ] Create `/src/lib/api/userActivityPreferences.ts` service
- [ ] Add Firestore security rules
- [ ] Create migration script for existing users
- [ ] Update `firebaseSessions.ts` to handle both `activityId` and `projectId`

### State Management

- [ ] Create `useActivityTypes()` query hook
- [ ] Create `useUserActivityPreferences()` query hook
- [ ] Create `useCreateCustomActivity()` mutation
- [ ] Create `useUpdateActivityPreference()` mutation (hide/pin/color)
- [ ] Add global cache for system activity types

### UI Components

- [ ] Refactor `ActivityPicker` to use new data structure
- [ ] Add pinned/recent/all sections to picker
- [ ] Add "Create custom" button to picker
- [ ] Create `CreateCustomActivityModal` component
- [ ] Create `ActivityPreferenceActions` dropdown (hide/pin/color)
- [ ] Update dashboard to show activity stats widget
- [ ] Create `/settings/activities` page (optional)

### Routes

- [ ] Remove `/src/app/activities/page.tsx` (list page)
- [ ] Remove `/src/app/activities/new/page.tsx` (create page)
- [ ] Remove `/src/app/activities/[id]/edit/page.tsx` (edit page)
- [ ] Keep `/src/app/activities/[id]/page.tsx` (stats/detail page)
- [ ] Update navigation to remove "Activities" link

### Cleanup

- [ ] Delete `ActivityList` component
- [ ] Delete `ActivityCard` component (or simplify to read-only)
- [ ] Remove unused API methods
- [ ] Clean up deprecated `ActivitiesContext`
- [ ] Remove old Firestore indexes
- [ ] Update documentation (CLAUDE.md, architecture docs)

### Testing

- [ ] Write unit tests for new API services
- [ ] Write integration tests for picker flow
- [ ] Write E2E test for custom activity creation
- [ ] Write migration test
- [ ] Update existing tests to use new structure

### Documentation

- [ ] Update CLAUDE.md with new architecture
- [ ] Update ACTIVITIES_ANALYSIS.md
- [ ] Add migration guide for developers
- [ ] Update README if needed

---

## Decisions Made

### ✅ 1. Dropdown Layout

- **Decision**: Horizontal bar (recent) + vertical list (all activities)
- Matches Strava's "Your Top Sports" pattern
- Recent activities in horizontal scrollable bar at top
- All other defaults + custom in vertical list below

### ✅ 2. Settings Page

- **Decision**: YES - Required for custom activity management
- Card-based UI showing stats, last used, edit/delete
- Primary place to create/edit/delete custom activities
- Create button at TOP (prominent)

### ✅ 3. Analytics Filtering

- **Decision**: Smart filtering - only show activities with ≥1 session
- No empty defaults cluttering the filter dropdown
- Sort by session count (most used first)
- Include both default and custom activities

### ✅ 4. Custom Activity Creation Points

- **Decision**: Two places only:
  1. Bottom of any activity dropdown ("+ Create custom activity")
  2. Settings → Activities page (primary management)

### ✅ 5. Backward Compatibility

- **Decision**: Full backward compatibility required
- Support both `activityId` and `projectId` in sessions
- Existing custom activities/projects must appear everywhere
- Migration should be seamless for existing users

## Open Questions / Decisions Needed

### 1. How Many Default Activities? ✅ FINAL

- **Decision**: 10 default work/study/productivity activities
- Final list: Work, Coding, Side Project, Planning, Study, Learning, Reading, Research, Creative, Writing
- **Removed**: Exercise, Mindfulness (health activities don't fit focus)
- Users can create custom activities for fitness/health if needed

### 2. Custom Activity Limit? ✅ DECIDED

- **Decision**: 10 max custom activities
- Shown in Settings UI as "2/10 custom activities"

### 3. Where to Show Activity Stats? ✅ ANSWERED

- **Decision**: Progress tab (mobile) + Analytics page (web)
- No separate dashboard widget needed

### 4. Category System for Activities? ✅ ANSWERED

- **Decision**: NO categories
- Activities ARE the groups/categories themselves
- Keep flat list

### 5. Migration Timeline? ✅ ANSWERED

- **Decision**: Big bang migration
- Deploy all changes at once
- Full backward compatibility ensures safety

### 6. Hide/Pin Default Activities? ✅ ANSWERED

- **Decision**: NO hide/pin feature
- Rely on "recent" smart sorting for personalization

### 7. Horizontal Bar: How Many Recent Activities? ✅ ANSWERED

- **Decision**: 5 recent activities
- Fixed count, horizontal scrollable

### 8. Delete Custom Activity Behavior? ✅ ANSWERED

- **Decision**: Hard delete (permanent)
- Sessions using deleted activity → marked as "Unassigned"
- No soft delete/archive for MVP

### 9. Icon Picker Implementation? ✅ ANSWERED

- **Decision**: Use existing dropdown icon picker
- Same implementation as current system
- Simple, familiar, works well

### 10. Search in Dropdown? ✅ ANSWERED

- **Decision**: NO search for MVP
- Users won't have many activities (12 defaults + max 10 custom = 22 total)
- Scrolling is sufficient

---

## Default Activities (FINAL) ✅

**10 Work/Study/Productivity-Focused Activities:**

| Icon | Name         | ID             | Category     | Description                           |
| ---- | ------------ | -------------- | ------------ | ------------------------------------- |
| 📊   | Work         | `work`         | Productivity | Professional work and meetings        |
| 💻   | Coding       | `coding`       | Productivity | Software development and programming  |
| 🚀   | Side Project | `side-project` | Productivity | Personal projects and side hustles    |
| 🎯   | Planning     | `planning`     | Productivity | Goal setting, planning, and strategy  |
| 📚   | Study        | `study`        | Learning     | Academic learning and coursework      |
| 🧠   | Learning     | `learning`     | Learning     | Skill development and online courses  |
| 📖   | Reading      | `reading`      | Learning     | Books, articles, and documentation    |
| 🔬   | Research     | `research`     | Learning     | Investigation and analysis            |
| 🎨   | Creative     | `creative`     | Creative     | Design, art, music, video production  |
| ✍️   | Writing      | `writing`      | Creative     | Blog posts, documentation, journaling |

**Notes:**

- IDs are kebab-case for Firestore collection paths
- Icons use emoji for consistency across platforms
- Categories are metadata only (not shown in UI, just for organization)
- Order field determines default sort order (1-10)
- **Removed health-related activities** (Exercise, Mindfulness) to keep focus on work/study/productivity
- Users can create custom activities for fitness/health if needed

---

## Recent Activities Tracking

**Method: Track in UserActivityPreference**

```typescript
interface UserActivityPreference {
  typeId: string // References /activityTypes/{id}
  userId: string // Owner
  lastUsed: Timestamp // Updated on every session creation
  useCount: number // Incremented on each session
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**Update Logic (on session creation):**

```typescript
// When user creates a session
async function onSessionCreate(sessionData) {
  const { activityId, userId } = sessionData

  // Update or create activity preference
  const prefRef = doc(db, `users/${userId}/activityPreferences/${activityId}`)
  await setDoc(
    prefRef,
    {
      typeId: activityId,
      userId: userId,
      lastUsed: serverTimestamp(),
      useCount: increment(1),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}
```

**Query for Recent (horizontal bar):**

```typescript
async function getRecentActivities(userId: string, limit: number = 5) {
  const prefsQuery = query(
    collection(db, `users/${userId}/activityPreferences`),
    orderBy('lastUsed', 'desc'),
    limit(limit)
  )

  const snapshot = await getDocs(prefsQuery)
  const recentIds = snapshot.docs.map((doc) => doc.data().typeId)

  // If user has < 5 recent, fill with popular defaults
  if (recentIds.length < limit) {
    const popularDefaults = ['work', 'study', 'coding', 'reading', 'writing']
    const fillCount = limit - recentIds.length
    const fillIds = popularDefaults.filter((id) => !recentIds.includes(id)).slice(0, fillCount)
    recentIds.push(...fillIds)
  }

  return recentIds
}
```

**Fallback for New Users:**

- First 5 alphabetically: Work, Coding, Creative, Exercise, Learning
- Or most popular globally: Work, Study, Coding, Reading, Writing
- Updates automatically as user creates sessions

**Performance:**

- Single query, indexed on `lastUsed`
- Cached in React Query (15-min cache)
- Optimistic update on session creation (instant UI)

---

## Goal Setting System (Future Feature)

**Note**: Goal setting features have been **removed from MVP scope** to simplify initial implementation.

**Tracked in**: [GitHub Issue #86](https://github.com/AmbiraDev/ambira-web/issues/86)

**Future Implementation**:

- Activity-level weekly/total targets
- Progress tracking and indicators
- "Your Weekly Goals" section in Progress tab
- Goal filtering in Analytics dropdown
- Color-coded status (on track/behind/exceeded)

**Proposed Approach** (for future reference):

- Add `weeklyTarget` and `totalTarget` fields to `UserActivityPreference`
- Optional per-activity goals (works for defaults + custom)
- Display in Settings → Activities (edit modal)
- Show progress in Progress tab (mobile) + Analytics (web)
- Smart sorting (activities with goals appear first)

See GitHub issue for full specification and acceptance criteria.

---

## Success Criteria

### User Experience

- ✅ Users can start a timer in ≤2 clicks (pick activity → start)
- ✅ Activity picker loads in <500ms
- ✅ No user sees "No activities" state (defaults always available)
- ✅ Creating custom activity takes ≤30 seconds

### Technical

- ✅ Page weight reduced (remove /activities pages)
- ✅ Firestore reads reduced (global defaults = fewer queries)
- ✅ 100% backward compatibility (legacy sessions still work)
- ✅ All tests passing

### Business

- ✅ Reduce confusion (simpler mental model)
- ✅ Increase engagement (easier to get started)
- ✅ Match Strava UX (familiar pattern)

---

## Timeline Estimate

**Phase 1: Data Layer** (2-3 days)

- Create collections, interfaces, APIs, security rules

**Phase 2: UI Refactor** (3-4 days)

- Update ActivityPicker, create modals, add dashboard widget

**Phase 3: Migration** (1-2 days)

- Write and test migration script, run for existing users

**Phase 4: Cleanup** (1-2 days)

- Remove old pages/components, update docs, fix tests

**Phase 5: Testing & Polish** (2-3 days)

- E2E tests, bug fixes, performance optimization

**Total**: ~2 weeks

---

## Next Steps

1. **Review this plan** - Discuss and finalize open questions
2. **Get feedback** - Share with team/users if applicable
3. **Start Phase 1** - Begin with data layer (non-breaking)
4. **Iterate** - Build incrementally, test often

---

---

## Summary of Decisions ✅

All key decisions have been made! Here's the finalized plan:

✅ **10 default activities** (Work, Coding, Side Project, Planning, Study, Learning, Reading, Research, Creative, Writing)
✅ **10 max custom activities** per user (max 20 total activities)
✅ **Progress tab (mobile) + Analytics page (web)** for activity stats
✅ **No categories** - activities are the groups
✅ **Big bang migration** with full backward compatibility
✅ **No hide/pin** - rely on recent smart sorting
✅ **5 recent activities** in horizontal bar
✅ **Hard delete** - sessions become "Unassigned"
✅ **Existing icon picker** dropdown
✅ **No search** in dropdown (20 total activities max)
✅ **Goal features removed** from MVP scope (future GitHub issue)

**Focus**: Work/study/productivity tracking (not fitness/health like Strava)

**Ready to implement!**
