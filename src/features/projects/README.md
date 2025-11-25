# Projects Feature

This feature provides hooks and services for managing projects (activities) in the Ambira application. Projects are used to organize and track work across different areas.

**Note**: Projects are now called "Activities" in the codebase, but we maintain backwards compatibility with Project naming in this feature.

## Structure

```
projects/
├── services/ProjectService.ts          # Business logic (no React dependencies)
├── hooks/
│   ├── useProjects.ts                  # Query hooks (React Query boundary)
│   ├── useProjectMutations.ts          # Mutation hooks (React Query boundary)
│   └── index.ts                        # Public API exports
└── README.md                           # This file
```

## Quick Start

```typescript
import {
  useProjects,
  useProject,
  useProjectStats,
  useCreateProject,
  useUpdateProject,
  useArchiveProject
} from '@/features/projects/hooks';

// Get all projects
function ProjectsList() {
  const { data: projects, isLoading } = useProjects();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {projects?.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

// Create a project
function CreateProject() {
  const createMutation = useCreateProject();

  const handleCreate = async () => {
    await createMutation.mutateAsync({
      name: 'My New Project',
      description: 'Project description',
      icon: '📚',
      color: '#3B82F6',
      weeklyTarget: 10
    });
  };

  return (
    <button onClick={handleCreate} disabled={createMutation.isPending}>
      {createMutation.isPending ? 'Creating...' : 'Create Project'}
    </button>
  );
}
```

## Available Hooks

### Query Hooks

- `useProjects()` - Get all projects for current user (15 min cache)
- `useProject(projectId)` - Get single project by ID (15 min cache)
- `useProjectStats(projectId)` - Get project statistics (5 min cache)

### Mutation Hooks

- `useCreateProject()` - Create new project (optimistic add to list)
- `useUpdateProject()` - Update project (optimistic updates)
- `useDeleteProject()` - Delete project (optimistic removal)
- `useArchiveProject()` - Archive project (optimistic status update)
- `useRestoreProject()` - Restore archived project (optimistic status update)

### Helper Hooks

- `useInvalidateProject()` - Invalidate single project cache
- `useInvalidateAllProjects()` - Invalidate all project caches

## Features

✅ **15-minute cache** for projects (they don't change often)
✅ **5-minute cache** for stats (change more frequently)
✅ **Optimistic updates** for all mutations
✅ **Archive/restore** functionality
✅ **Project statistics** support
✅ **TypeScript** end-to-end type safety
✅ **Testable** service layer without React

## Cache Keys Structure

```typescript
PROJECT_KEYS = {
  all: () => ['projects'],
  lists: () => ['projects', 'list'],
  list: () => ['projects', 'list'],
  details: () => ['projects', 'detail'],
  detail: (id) => ['projects', 'detail', id],
  stats: (id) => ['projects', 'detail', id, 'stats'],
}
```

## Migration from Old Hooks

**Before:**

```typescript
import { useProjects } from '@/hooks/useCache'
import {
  useCreateActivityMutation,
  useUpdateActivityMutation,
  useDeleteActivityMutation,
} from '@/hooks/useMutations'
```

**After:**

```typescript
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from '@/features/projects/hooks'
```

## Further Reading

- [Architecture Overview](../../../docs/architecture/README.md)
- [Caching Strategy](../../../docs/architecture/CACHING_STRATEGY.md)
- [Migration Guide](../../../docs/architecture/MIGRATION_GUIDE.md)
