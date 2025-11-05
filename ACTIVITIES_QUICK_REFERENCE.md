# Activities Implementation - Quick Reference

## What Are Activities?

Core organizational units representing categories of work. Users track sessions (time periods) against activities. They replace/are aliased as "Projects" (legacy name).

## 8 Default Activities

Work, Study, Side Project, Reading, Writing, Creative, Exercise, Learning

## Key Files

| File                                       | Purpose                                 |
| ------------------------------------------ | --------------------------------------- |
| `/src/types/index.ts`                      | Activity interface & DEFAULT_ACTIVITIES |
| `/src/lib/api/projects/index.ts`           | Firebase CRUD operations                |
| `/src/hooks/useActivitiesQuery.ts`         | React Query hooks (preferred)           |
| `/src/components/ActivityCard.tsx`         | Grid card with stats                    |
| `/src/components/ActivityList.tsx`         | Management list/grid UI                 |
| `/src/components/timer/ActivityPicker.tsx` | Timer activity selector                 |
| `/src/app/activities/page.tsx`             | Activities management page              |
| `/src/app/activities/[id]/page.tsx`        | Activity detail page                    |

## Database Location

`projects/{userId}/userProjects/{activityId}` in Firestore

## Activity Interface

```typescript
interface Activity {
  id: string;
  userId: string;
  name: string;
  description: string;
  icon: string; // e.g., "flat-color-icons:briefcase"
  color: string; // hex or named color
  weeklyTarget?: number; // hours
  totalTarget?: number; // hours
  status: 'active' | 'completed' | 'archived';
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## API Methods

```typescript
// All from firebaseActivityApi (aliased from firebaseProjectApi)
getProjects(); // Get all activities
createProject(data); // Create activity
updateProject(id, data); // Update activity
deleteProject(id); // Delete activity
getProjectById(id); // Fetch single
getProjectStats(id); // Get statistics
```

## Hooks (React Query)

```typescript
const { data: activities } = useActivities(userId);
const { data: activity } = useActivity(activityId);
const { data: stats } = useActivityStats(activityId);
useCreateActivity();
useUpdateActivity();
useDeleteActivity();
useArchiveActivity();
useRestoreActivity();
```

## Sessions Relationship

- Sessions have `activityId` field (primary)
- Sessions also have `projectId` for backward compatibility
- Query both: `where('activityId', '==', id) OR where('projectId', '==', id)`

## Statistics Available

- totalHours, weeklyHours
- sessionCount, currentStreak
- weeklyProgressPercentage, totalProgressPercentage
- averageSessionDuration, lastSessionDate

## UI Components

- **ActivityPicker**: Dropdown selector for timer
- **ActivityCard**: Grid card with icon, name, progress bars
- **ActivityList**: Full management interface with CRUD actions

## Colors & Icons

- **Icons**: Iconify "flat-color-icons" library
- **Colors**: Hex values (#0066CC) or named colors (blue, orange, etc.)
- **Color Map**: 14 colors (orange, blue, green, red, purple, yellow, pink, indigo, teal, cyan, lime, amber, emerald, violet, etc.)

## Backward Compatibility

- Type alias: `Project = Activity`
- API alias: `firebaseActivityApi = firebaseProjectApi`
- Hook aliases: `useProjects = useActivities`, etc.
- Session field: Checks both `activityId` and `projectId`
- Context: Old context throws error, directs to hooks

## Routes

- `/activities` - List/manage activities
- `/activities/new` - Create activity
- `/activities/[id]` - Detail page with analytics & sessions
- `/activities/[id]/edit` - Edit activity

## State Management

- React Query hooks (preferred)
- Optimistic updates on create/update/delete
- 15-minute cache for activities list
- 1-hour cache for statistics

## Key Decisions

1. Stored in `projects/{userId}/userProjects/` (naming reflects earlier "project" term)
2. Stats calculated client-side from sessions
3. Uses React Query for modern state management
4. Full backward compatibility with "Project" terminology
5. Icons from Iconify, colors as hex or Tailwind classes

## Testing

- Factory: `createMockActivity()` from `/tests/__mocks__/factories/activityFactory.ts`
- Supports partial overrides
- Batch creation available
- Reset function for test isolation

## When Adding Features

1. Use `Activity` type (not Project)
2. Use `activityId` field (keep `projectId` for compat)
3. Add hooks to `useActivitiesQuery.ts` (not context)
4. Check both fields in queries (`activityId` OR `projectId`)
5. Update test factory

## Common Usage Pattern

```typescript
// Fetch
const { data: activities } = useActivities(userId);

// Create
const create = useCreateActivity();
await create.mutateAsync(activityData);

// Update
const update = useUpdateActivity();
await update.mutateAsync({ id, data });

// Archive
const archive = useArchiveActivity();
await archive.mutateAsync(activityId);

// Delete
const remove = useDeleteActivity();
await remove.mutateAsync(activityId);
```

## Performance Notes

- Activities cached 15 minutes
- Stats cached 1 hour
- Stats can be provided as prop to avoid refetch
- Client-side stats calculation could be optimized

## Known Limitations

- Default activities hardcoded (not user-editable)
- Streak simplified (just checks last 2 days)
- Icon/color selection limited to predefined set
- No activity grouping beyond custom names
- No shared/team activities
