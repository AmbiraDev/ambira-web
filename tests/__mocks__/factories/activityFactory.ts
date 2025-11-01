/**
 * Activity (Project) Factory
 * Creates mock activities/projects for testing
 */

import type { Activity } from '@/types';

let activityIdCounter = 0;

export function createMockActivity(
  overrides: Partial<Activity> = {}
): Activity {
  const id = overrides.id || `activity-${Date.now()}-${++activityIdCounter}`;

  return {
    id,
    userId: overrides.userId || `user-${Date.now()}`,
    name: overrides.name || 'Test Activity',
    description: overrides.description || 'A test activity description',
    icon: overrides.icon || 'flat-color-icons:briefcase',
    color: overrides.color || '#0066CC',
    weeklyTarget: overrides.weeklyTarget,
    totalTarget: overrides.totalTarget,
    status: overrides.status || 'active',
    isDefault: overrides.isDefault || false,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
}

export function createMockProject(overrides: Partial<Activity> = {}): Activity {
  return createMockActivity(overrides);
}

export function createMockActivityBatch(
  count: number,
  baseOverrides: Partial<Activity> = {}
): Activity[] {
  return Array.from({ length: count }, (_, i) =>
    createMockActivity({ ...baseOverrides, name: `Activity ${i + 1}` })
  );
}

export function resetActivityFactory() {
  activityIdCounter = 0;
}
