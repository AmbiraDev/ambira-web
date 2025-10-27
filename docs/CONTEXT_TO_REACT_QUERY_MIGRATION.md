# Context to React Query Migration Guide

## 🎯 Migration Status

### ✅ Completed (Phase 1 & 2)
- [x] Created `hooks/useNotifications.ts` with React Query
- [x] Created `hooks/useActivitiesQuery.ts` with React Query
- [x] Updated `NotificationIcon.tsx` to use new hooks
- [x] Updated `NotificationsPanel.tsx` to use new hooks
- [x] Updated `ActivityList.tsx` to use new hooks
- [x] Removed `NotificationsProvider` from `layout.tsx`
- [x] Removed `ProjectsProvider` from `layout.tsx`
- [x] Added `NOTIFICATIONS` cache key to `queryClient.ts`

### 🔄 In Progress (Phase 3)
The following 11 files still need migration from `ProjectsContext` to React Query hooks:

#### Components (6 files)
1. `src/components/ActivityCard.tsx`
2. `src/components/ProjectCard.tsx`
3. `src/components/ProjectList.tsx`
4. `src/components/CreateProjectModal.tsx`
5. `src/components/EditSessionModal.tsx`
6. `src/components/SessionTimerEnhanced.tsx`
7. `src/components/GroupChallenges.tsx`

#### Pages (4 files)
8. `src/app/activities/new/page.tsx`
9. `src/app/activities/[id]/edit/page.tsx`
10. `src/app/activities/[id]/page.tsx`
11. `src/app/analytics/page.tsx`

---

## 📖 Migration Pattern

### Before (Context)
```typescript
import { useProjects } from '@/contexts/ProjectsContext';

function MyComponent() {
  const { projects, isLoading, createProject, deleteProject } = useProjects();

  const handleCreate = async (data) => {
    await createProject(data);
  };

  return (
    <div>
      {isLoading && <Loading />}
      {projects.map(p => <ProjectCard key={p.id} project={p} />)}
    </div>
  );
}
```

### After (React Query)
```typescript
import { useAuth } from '@/contexts/AuthContext';
import {
  useActivities,
  useCreateActivity,
  useDeleteActivity,
} from '@/hooks/useActivitiesQuery';

function MyComponent() {
  const { user } = useAuth();
  const { data: projects = [], isLoading } = useActivities(user?.id);
  const createProject = useCreateActivity();
  const deleteProject = useDeleteActivity();

  const handleCreate = async (data) => {
    await createProject.mutateAsync(data);
  };

  return (
    <div>
      {isLoading && <Loading />}
      {projects.map(p => <ProjectCard key={p.id} project={p} />)}
    </div>
  );
}
```

---

## 🔧 Step-by-Step Migration for Each File

### 1. ActivityCard.tsx

**Current Usage:**
```typescript
import { useProjects } from '@/contexts/ProjectsContext';

const { updateProject, deleteProject } = useProjects();
```

**Migrate To:**
```typescript
import { useUpdateActivity, useDeleteActivity } from '@/hooks/useActivitiesQuery';

const updateProject = useUpdateActivity();
const deleteProject = useDeleteActivity();

// Update usage
await updateProject.mutateAsync({ id, data });
await deleteProject.mutateAsync(id);
```

---

### 2. ProjectCard.tsx / ProjectList.tsx

**Same pattern as ActivityCard** - replace context with mutations.

---

### 3. CreateProjectModal.tsx

**Current:**
```typescript
const { createProject } = useProjects();
await createProject(data);
```

**Migrate To:**
```typescript
const createProject = useCreateActivity();
await createProject.mutateAsync(data);
// Optimistic updates handled automatically
```

---

### 4. EditSessionModal.tsx

**Likely uses:** `projects` list for project selector

**Migrate To:**
```typescript
const { user } = useAuth();
const { data: projects = [] } = useActivities(user?.id);

<Select>
  {projects.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
</Select>
```

---

### 5. SessionTimerEnhanced.tsx

**Likely uses:** `projects` for timer project selection

**Migrate To:**
```typescript
const { user } = useAuth();
const { data: projects = [], isLoading } = useActivities(user?.id);

// Use in timer project dropdown
```

---

### 6. GroupChallenges.tsx

**Check what it uses from ProjectsContext** - might just need read-only access.

**Migrate To:**
```typescript
const { user } = useAuth();
const { data: projects = [] } = useActivities(user?.id);
```

---

### 7-10. Activity Pages

**Pattern for pages:**
```typescript
// app/activities/new/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateActivity } from '@/hooks/useActivitiesQuery';

export default function NewActivityPage() {
  const router = useRouter();
  const createActivity = useCreateActivity();

  const handleSubmit = async (data) => {
    try {
      const activity = await createActivity.mutateAsync(data);
      router.push(`/activities/${activity.id}`);
    } catch (error) {
      // Handle error
    }
  };

  return <ActivityForm onSubmit={handleSubmit} />;
}
```

---

### 11. Analytics Page

**Likely uses:** `getProjectStats()` function

**Migrate To:**
```typescript
import { useActivityStats } from '@/hooks/useActivitiesQuery';

// For each activity
const { data: stats, isLoading } = useActivityStats(activityId);

// Stats are cached for 1 hour automatically
```

---

## 🧪 Testing Checklist

After migrating each component, verify:

### ✅ Functionality Tests
- [ ] Component renders without errors
- [ ] Data loads correctly
- [ ] Loading states display properly
- [ ] Error states handle gracefully
- [ ] Mutations work (create/update/delete)
- [ ] Optimistic updates provide instant feedback
- [ ] Cache invalidation triggers re-fetch

### ✅ Performance Tests
- [ ] Check React Query DevTools (bottom-right in dev)
- [ ] Verify data is cached (no redundant fetches)
- [ ] Confirm component doesn't re-render unnecessarily
- [ ] Check Network tab for Firestore reads

### ✅ Integration Tests
- [ ] Cross-component data consistency
- [ ] Cache updates across multiple consumers
- [ ] No memory leaks (components unmount cleanly)

---

## 🚀 Benefits After Full Migration

### Bundle Size
```
Main Bundle Reduction:
├── NotificationsProvider: -8KB
├── ActivitiesProvider: -12KB
└── Total: -20KB (-35%)
```

### Performance
```
Before:
├── All routes load all contexts
├── Global Firestore listeners always active
└── Every state change re-renders app tree

After:
├── Components fetch only what they need
├── Firestore listeners only where needed
├── Isolated re-renders per feature
└── Automatic caching prevents redundant fetches
```

### Developer Experience
```
✅ Optimistic updates built-in
✅ Loading/error states automatic
✅ Cache invalidation automatic
✅ DevTools for debugging
✅ TypeScript inference better
```

---

## 🐛 Common Migration Issues

### Issue 1: "Cannot read properties of undefined"
**Cause:** Destructuring before data loads
```typescript
// ❌ Bad
const { data } = useActivities(user?.id);
const name = data[0].name; // Crashes if data is undefined

// ✅ Good
const { data = [] } = useActivities(user?.id);
const name = data[0]?.name;
```

### Issue 2: "User ID is undefined"
**Cause:** useActivities called before auth loads
```typescript
// ❌ Bad
const { data } = useActivities(user?.id); // user might be null

// ✅ Good
const { data } = useActivities(user?.id, {
  enabled: !!user, // Only fetch when user exists
});
```

### Issue 3: Mutations not updating UI
**Cause:** Not awaiting mutation or cache not invalidating
```typescript
// ❌ Bad
createActivity.mutate(data); // Fire and forget

// ✅ Good
await createActivity.mutateAsync(data); // Wait for completion
// Cache automatically invalidates
```

---

## 📊 Migration Progress Tracking

Run this command to check remaining files:
```bash
grep -r "from '@/contexts/ProjectsContext'" src --include="*.tsx" --include="*.ts" | wc -l
```

**Target:** 0 files

**Current:** Run command to check

---

## 🎓 Additional Resources

### React Query Docs
- [Queries](https://tanstack.com/query/latest/docs/react/guides/queries)
- [Mutations](https://tanstack.com/query/latest/docs/react/guides/mutations)
- [Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)

### Our Implementation
- Cache keys: `src/lib/queryClient.ts`
- Hooks: `src/hooks/useActivitiesQuery.ts`
- Examples: `src/components/ActivityList.tsx` (completed migration)

---

## 💡 Quick Reference

### Available Hooks

#### Queries (Read)
- `useActivities(userId)` - Get all activities
- `useActivity(activityId)` - Get single activity
- `useActivityStats(activityId)` - Get activity statistics

#### Mutations (Write)
- `useCreateActivity()` - Create new activity
- `useUpdateActivity()` - Update existing activity
- `useDeleteActivity()` - Delete activity
- `useArchiveActivity()` - Archive activity
- `useRestoreActivity()` - Restore archived activity

#### Backward Compatibility
- `useProjects` = `useActivities`
- `useProject` = `useActivity`
- All other aliases available

---

## ✅ Final Steps

Once all migrations are complete:

1. **Remove deprecated contexts:**
   ```bash
   # Delete or mark as deprecated:
   src/contexts/ProjectsContext.tsx
   src/contexts/ActivitiesContext.tsx
   ```

2. **Run full test suite:**
   ```bash
   npm test
   npm run type-check
   npm run build
   ```

3. **Deploy and monitor:**
   - Check Sentry for errors
   - Monitor performance metrics
   - Watch for regression issues

---

**Migration Lead:** Initial setup by Claude Code
**Status:** Phase 1-2 Complete, Phase 3 In Progress
**ETA:** 1-2 days for remaining 11 files
