# Ambira Activities Implementation Analysis

## Executive Summary

Activities (formerly called "Projects") is the core organizational unit in Ambira. They represent categories/types of work that users can track time against. The system has undergone a naming migration from "Project" to "Activity" while maintaining backward compatibility through type aliases.

---

## 1. Current Activities Definition & Storage

### Type Definition

Located in: `/src/types/index.ts` (lines 39-52)

```typescript
export interface Activity {
  id: string;
  userId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  weeklyTarget?: number; // hours
  totalTarget?: number; // hours
  status: 'active' | 'completed' | 'archived';
  isDefault?: boolean; // True for default activities
  createdAt: Date;
  updatedAt: Date;
}

// Backwards compatibility alias
export type Project = Activity;
```

### Database Storage

**Location**: Firestore subcollection under user

- **Path**: `projects/{userId}/userProjects/{activityId}`
- **Structure**: Document-based with fields matching the Activity interface
- **Note**: Despite the folder name "projects", this stores activities

**Key Storage Details**:

- Uses `serverTimestamp()` for createdAt and updatedAt
- Timestamps stored as Firestore Timestamp objects
- Status field defaults to 'active' if not present
- Optional fields (weeklyTarget, totalTarget) only written if provided

---

## 2. Existing Activity Types & Categories

### Default Activities

Pre-defined activities available to all users (defined in `/src/types/index.ts`, lines 109-158):

```typescript
export const DEFAULT_ACTIVITIES = [
  {
    id: 'work',
    name: 'Work',
    icon: 'flat-color-icons:briefcase',
    color: '#0066CC',
  },
  {
    id: 'study',
    name: 'Study',
    icon: 'flat-color-icons:reading',
    color: '#34C759',
  },
  {
    id: 'side-project',
    name: 'Side Project',
    icon: 'flat-color-icons:electronics',
    color: '#FF9500',
  },
  {
    id: 'reading',
    name: 'Reading',
    icon: 'flat-color-icons:book',
    color: '#FF2D55',
  },
  {
    id: 'writing',
    name: 'Writing',
    icon: 'flat-color-icons:document',
    color: '#AF52DE',
  },
  {
    id: 'creative',
    name: 'Creative',
    icon: 'flat-color-icons:gallery',
    color: '#FF6482',
  },
  {
    id: 'exercise',
    name: 'Exercise',
    icon: 'flat-color-icons:sports-mode',
    color: '#32ADE6',
  },
  {
    id: 'learning',
    name: 'Learning',
    icon: 'flat-color-icons:graduation-cap',
    color: '#FFD60A',
  },
];
```

### Status Values

- `active`: Currently being used
- `completed`: Finished/completed activity
- `archived`: Hidden but not deleted

### Custom Activities

Users can create custom activities with:

- Any name and description
- Custom icon (from flat-color-icons library)
- Custom color (hex or named color)
- Optional weekly and total hour targets

---

## 3. Relationship to Sessions & Projects

### Activity-Session Relationship

**Sessions** are work periods logged against activities.

**Session Type** (lines 160-184 in `/src/types/index.ts`):

```typescript
export interface Session {
  id: string;
  userId: string;
  activityId: string; // PRIMARY - Current field name
  projectId?: string; // DEPRECATED - Kept for backwards compatibility
  title: string;
  description?: string;
  duration: number; // seconds
  startTime: Date;
  // ... other fields
  visibility: 'everyone' | 'followers' | 'private';
  // Social fields (sessions ARE posts)
  supportCount: number;
  supportedBy?: string[];
  commentCount: number;
  isSupported?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Key Points**:

- Sessions reference activities via `activityId` (primary field)
- `projectId` is kept for backward compatibility with existing data
- Queries check both fields to support old and new data:
  ```typescript
  where('activityId', '==', activityId) OR where('projectId', '==', activityId)
  ```

### Activity-Project Terminology

- **"Activity"** = The new preferred term
- **"Project"** = Legacy term, fully aliased for backward compatibility
- All new code should use "Activity" terminology
- APIs export both: `firebaseActivityApi` and `firebaseProjectApi` (they're the same object)

---

## 4. UI Components for Activity Selection

### ActivityPicker Component

**Location**: `/src/components/timer/ActivityPicker.tsx`

**Purpose**: Dropdown selector for choosing an activity when starting a timer

**Key Features**:

- Displays all user activities in dropdown
- Shows activity icon and name
- Marks currently selected activity with checkmark
- Has "Create New Activity" link when no activities exist
- Shows error state with red border when validation fails
- Keyboard accessible (Tab, Enter, Escape)

**Props**:

```typescript
interface ActivityPickerProps {
  selectedActivityId: string;
  setSelectedActivityId: (id: string) => void;
  allActivities: Activity[];
  selectedActivity: Activity | null;
  showError?: boolean;
  onErrorClear?: () => void;
}
```

### ActivityCard Component

**Location**: `/src/components/ActivityCard.tsx`

**Purpose**: Displays activity in a grid/list view

**Features**:

- Shows activity icon (with colored background)
- Displays name and description
- Shows progress bars for weekly and total targets
- Dropdown menu (Edit, Archive/Restore, Delete)
- Fetches stats with React Query (1-hour cache)
- Keyboard accessible for menu navigation
- Responsive design (280px minimum height)

**Color Handling**:

- Consolidated color map with Tailwind classes and hex values
- Supports both hex colors (#0066CC) and named colors (blue, orange, etc.)

### ActivityList Component

**Location**: `/src/components/ActivityList.tsx`

**Purpose**: Main activities management interface

**Features**:

- Grid display (1 column mobile, 2 columns tablet, 3 columns desktop)
- Create new activity button
- Delete confirmation modal
- Archive/Restore functionality
- Loading skeletons
- Empty state with guidance

---

## 5. Database Schema

### Firestore Structure

```
projects/
  {userId}/
    userProjects/
      {activityId}/
        id: string
        userId: string
        name: string
        description: string
        icon: string (e.g., "flat-color-icons:briefcase")
        color: string (e.g., "#0066CC")
        weeklyTarget?: number
        totalTarget?: number
        status: 'active' | 'completed' | 'archived'
        isDefault?: boolean
        createdAt: Timestamp
        updatedAt: Timestamp

sessions/
  {sessionId}/
    id: string
    userId: string
    activityId: string (PRIMARY - points to activity)
    projectId?: string (DEPRECATED - legacy field)
    title: string
    duration: number (seconds)
    ... other session fields ...
    createdAt: Timestamp
    updatedAt: Timestamp
```

### Indexes Required

None specifically for activities, but sessions queries on `activityId` and `userId` need to be efficient.

---

## 6. API Layer

### Firebase Activity API

**Location**: `/src/lib/api/projects/index.ts`

The module is named "projects" but handles activities (they're aliased).

**Exported as**: `firebaseActivityApi` (via `/src/lib/api/index.ts` line 79)

**Available Methods**:

#### getProjects()

```typescript
const activities = await firebaseActivityApi.getProjects();
// Returns: Activity[]
// Fetches all activities for current user
```

#### createProject(data: CreateActivityData)

```typescript
const activity = await firebaseActivityApi.createProject({
  name: 'My Activity',
  description: 'Description',
  icon: 'flat-color-icons:briefcase',
  color: '#0066CC',
  weeklyTarget: 10, // optional
  totalTarget: 100, // optional
});
```

#### updateProject(id: string, data: UpdateActivityData)

```typescript
const updated = await firebaseActivityApi.updateProject(activityId, {
  name: 'Updated Name',
  status: 'archived',
  // ... partial update
});
```

#### deleteProject(id: string)

```typescript
await firebaseActivityApi.deleteProject(activityId);
```

#### getProjectById(id: string)

```typescript
const activity = await firebaseActivityApi.getProjectById(activityId);
// Returns: Activity | null
```

#### getProjectStats(id: string)

```typescript
const stats = await firebaseActivityApi.getProjectStats(activityId);
// Returns: ProjectStats | null
```

**Returns**:

```typescript
interface ProjectStats {
  totalHours: number;
  weeklyHours: number;
  sessionCount: number;
  currentStreak: number;
  weeklyProgressPercentage: number;
  totalProgressPercentage: number;
  averageSessionDuration: number;
  lastSessionDate?: Date;
}
```

### React Query Hooks

**Location**: `/src/hooks/useActivitiesQuery.ts`

These hooks wrap the API with caching and optimistic updates:

#### useActivities(userId?: string)

- Fetches user's activities
- Cache time: 15 minutes
- Returns: `{ data: Activity[], isLoading: boolean, error: Error | null }`

#### useActivity(activityId: string)

- Fetches single activity (derived from activities list)
- Returns: `{ data: Activity | null, isLoading: boolean }`

#### useActivityStats(activityId: string)

- Fetches activity statistics
- Cache time: 1 hour
- Queries sessions manually for stats calculation

#### useCreateActivity()

- Optimistic update: adds temp activity immediately
- Rolls back on error
- Returns: `{ mutateAsync, isPending, error }`

#### useUpdateActivity()

- Optimistic update for name, description, targets, status
- Returns updated activity on success

#### useDeleteActivity()

- Optimistic delete (removes from list immediately)
- Rolls back on error

#### useArchiveActivity() & useRestoreActivity()

- Convenience wrappers around useUpdateActivity
- Sets status to 'archived' or 'active'

#### Backward Compatibility Aliases

All hooks are aliased for projects:

- `useProjects = useActivities`
- `useProject = useActivity`
- `useProjectStats = useActivityStats`
- etc.

---

## 7. State Management

### Context (Deprecated)

**Location**: `/src/contexts/ActivitiesContext.tsx`

This context is a **placeholder for backward compatibility only**. It throws errors directing users to use hooks instead.

```typescript
// DO NOT USE - DEPRECATED
// Use: import { useActivities } from '@/hooks/useActivitiesQuery'
```

### Hooks-Based (Current)

All activities state is managed through React Query hooks in `/src/hooks/useActivitiesQuery.ts`. This provides:

- Automatic caching
- Background refetching
- Optimistic updates
- Better code splitting

---

## 8. Routes & Pages

### Activities Management Routes

#### `/activities`

**Component**: `/src/app/activities/page.tsx`

Displays list of user's activities in a grid. Features:

- Responsive grid layout (1/2/3 columns)
- Activity cards with stats
- Create button
- Edit/Archive/Delete actions

#### `/activities/new`

**Component**: `/src/app/activities/new/page.tsx`

Create new activity form. Includes:

- Name, description fields
- Icon and color picker
- Weekly/total target inputs
- Validation

#### `/activities/[id]`

**Component**: `/src/app/activities/[id]/page.tsx`

Activity detail page with:

- Activity header with icon
- Tabs: Analytics & Sessions
- Charts (hours, duration, sessions) with time period selector
- Session list filtered for this activity

#### `/activities/[id]/edit`

**Component**: `/src/app/activities/[id]/edit/page.tsx`

Edit existing activity form.

---

## 9. Icon System

### Icon Library

Uses **flat-color-icons** (Iconify library)

**Format**: `flat-color-icons:{icon-name}`

**Examples**:

- `flat-color-icons:briefcase`
- `flat-color-icons:reading`
- `flat-color-icons:sports-mode`

### Icon Rendering

**Component**: `/src/components/IconRenderer.tsx`

Renders icons with Iconify API, supports:

- Size customization
- Color styling
- Fallback handling

---

## 10. Color System

### Supported Color Values

1. **Hex Colors**: `#0066CC`, `#FF2D55`, etc.
2. **Named Colors**: Blue, orange, purple, etc. (Tailwind classes)

### Color Application

In `ActivityCard.tsx`, colors are mapped to:

- **Tailwind classes** for progress bars: `bg-orange-500`, `bg-blue-500`
- **Hex values** for icon backgrounds: `#f97316`, `#3b82f6`

**Color Map**:

```
orange → { tailwind: 'bg-orange-500', hex: '#f97316' }
blue → { tailwind: 'bg-blue-500', hex: '#3b82f6' }
green → { tailwind: 'bg-green-500', hex: '#22c55e' }
... (14 colors total)
```

---

## 11. Statistics & Analytics

### Activity Statistics

Calculated by querying sessions for an activity:

**Data Point**: `ActivityStats`

```typescript
interface ActivityStats {
  totalHours: number; // Sum of all session durations
  weeklyHours: number; // Sum of sessions in last 7 days
  sessionCount: number; // Total sessions for activity
  currentStreak: number; // Days in a row with activity
  weeklyProgressPercentage: number; // (weeklyHours / weeklyTarget) * 100
  totalProgressPercentage: number; // (totalHours / totalTarget) * 100
  averageSessionDuration: number; // In hours
  lastSessionDate?: Date; // When last session was
}
```

### How Stats Are Calculated

From `useActivityStats` hook:

1. Query all sessions with `activityId` (or `projectId` for backward compat)
2. Sum durations for total hours
3. Filter last 7 days for weekly hours
4. Calculate percentages based on optional targets
5. Average duration = total seconds / session count
6. Simplified streak: 1 if activity in last 2 days, 0 otherwise

### Performance Considerations

- Stats cached for 1 hour
- Can be provided as prop to avoid refetch
- Heavy computation on client-side
- Could be optimized with server-side caching

---

## 12. Backwards Compatibility

### Project → Activity Migration

The system maintains full backward compatibility:

1. **Type Aliases**:

   ```typescript
   export type Project = Activity;
   export type CreateProjectData = CreateActivityData;
   export type ProjectStats = ActivityStats;
   ```

2. **API Aliases**:

   ```typescript
   export const firebaseActivityApi = firebaseProjectApi;
   ```

3. **Hook Aliases**:

   ```typescript
   export const useProjects = useActivities;
   export const useProject = useActivity;
   // ... etc
   ```

4. **Session Field Handling**:
   - New: `session.activityId`
   - Old: `session.projectId`
   - Queries check both with OR logic

5. **Deprecated Context**:
   - Old hook `useActivities()` from context throws error
   - Directs to new hook in `/hooks/useActivitiesQuery.ts`

---

## 13. Test Fixtures

### Activity Factory

**Location**: `/tests/__mocks__/factories/activityFactory.ts`

```typescript
export function createMockActivity(
  overrides: Partial<Activity> = {}
): Activity {
  // Creates mock activity with sensible defaults
  // Supports batch creation
  // Has reset function for test isolation
}
```

---

## 14. Key Files Summary

| Path                                            | Purpose                                 |
| ----------------------------------------------- | --------------------------------------- |
| `/src/types/index.ts`                           | Type definitions and DEFAULT_ACTIVITIES |
| `/src/lib/api/projects/index.ts`                | Firebase CRUD API                       |
| `/src/hooks/useActivitiesQuery.ts`              | React Query hooks                       |
| `/src/contexts/ActivitiesContext.tsx`           | Deprecated (placeholder)                |
| `/src/components/ActivityCard.tsx`              | Grid card display                       |
| `/src/components/ActivityList.tsx`              | List management UI                      |
| `/src/components/timer/ActivityPicker.tsx`      | Dropdown selector                       |
| `/src/app/activities/page.tsx`                  | Main activities page                    |
| `/src/app/activities/[id]/page.tsx`             | Activity detail page                    |
| `/src/app/activities/[id]/edit/page.tsx`        | Edit activity page                      |
| `/tests/__mocks__/factories/activityFactory.ts` | Test fixtures                           |

---

## 15. Current Implementation Status

### Complete Features

- ✅ Create activities with custom name, description, icon, color
- ✅ Read/fetch activities for user
- ✅ Update activity properties
- ✅ Delete activities
- ✅ Archive/restore activities
- ✅ Activity statistics (hours, sessions, progress)
- ✅ Weekly and total hour targets
- ✅ Session association (sessions reference activities)
- ✅ Analytics dashboard with charts
- ✅ Activity detail page with session history

### Limitations & Notes

- Default activities are hardcoded (not user-created or editable)
- Statistics calculation happens client-side (could be optimized)
- Streak calculation is simplified (presence in last 2 days)
- Icon/color selection limited to predefined set
- No activity grouping or categorization beyond custom names

---

## 16. Key Implementation Decisions

1. **Naming Migration**: Project → Activity done but backward compatibility maintained
2. **Storage Path**: Activities stored as subcollection under user (`projects/{userId}/userProjects`)
3. **Stats Calculation**: Client-side, not pre-computed in database
4. **Icons**: Using Iconify flat-color-icons set
5. **State Management**: React Query for automatic caching and sync
6. **UI Pattern**: Card-based grid display with dropdown menus

---

## 17. Development Notes

### When Adding Features

- Use `Activity` type, not `Project`
- Use `activityId`, not `projectId` (keep backward compat field)
- Add hooks in `useActivitiesQuery.ts`, not context
- Update tests in `/tests/__mocks__/factories/activityFactory.ts`

### Common Patterns

```typescript
// Fetch activities
const { data: activities } = useActivities(userId);

// Create activity
const createMutation = useCreateActivity();
await createMutation.mutateAsync(activityData);

// Update activity
const updateMutation = useUpdateActivity();
await updateMutation.mutateAsync({ id, data });

// Archive activity
const archiveMutation = useArchiveActivity();
await archiveMutation.mutateAsync(activityId);
```

---
