'use client';

// This file is kept for backwards compatibility
// All functionality has moved to ActivitiesContext
export {
  ActivitiesContext as ProjectsContext,
  ActivitiesProvider as ProjectsProvider,
  useActivities as useProjects,
  useActivity as useProject
} from './ActivitiesContext';
