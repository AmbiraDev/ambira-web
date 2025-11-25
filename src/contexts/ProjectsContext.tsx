'use client'

/**
 * DEPRECATED: Context API has been migrated to React Query hooks
 *
 * This file is kept for backwards compatibility only.
 * All functionality has been moved to React Query hooks for better performance
 * and code splitting capabilities.
 *
 * Migration Guide:
 * Old: import { useProjects } from '@/contexts/ProjectsContext'
 * New: import { useActivities as useProjects } from '@/hooks/useActivitiesQuery'
 *
 * Old: import { useProject } from '@/contexts/ProjectsContext'
 * New: import { useActivity as useProject } from '@/hooks/useActivitiesQuery'
 */

// Re-export the hooks for backward compatibility
export { useActivities as useProjects, useActivity as useProject } from '@/hooks/useActivitiesQuery'
