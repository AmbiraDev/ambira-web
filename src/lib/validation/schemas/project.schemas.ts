/**
 * Project/Activity validation schemas
 *
 * Validates project creation and updates with proper type safety
 * and input sanitization.
 */

import * as v from 'valibot';
import { UuidSchema, NonEmptyStringSchema } from '../utils/common-schemas';

/**
 * Schema for creating a new project/activity
 */
export const CreateProjectSchema = v.object({
  // Required fields
  name: v.pipe(
    v.string('Project name is required'),
    v.nonEmpty('Project name cannot be empty'),
    v.maxLength(100, 'Project name cannot exceed 100 characters'),
    v.transform((str) => str.trim())
  ),
  description: v.pipe(
    v.string('Description is required'),
    v.nonEmpty('Description cannot be empty'),
    v.maxLength(500, 'Description cannot exceed 500 characters'),
    v.transform((str) => str.trim())
  ),
  icon: NonEmptyStringSchema,
  color: v.pipe(
    v.string('Color is required'),
    v.regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex code (e.g., #007AFF)')
  ),

  // Optional fields
  weeklyTarget: v.optional(
    v.pipe(v.number('Weekly target must be a number'), v.minValue(0, 'Weekly target cannot be negative'), v.maxValue(168, 'Weekly target cannot exceed 168 hours'))
  ),
  totalTarget: v.optional(
    v.pipe(v.number('Total target must be a number'), v.minValue(0, 'Total target cannot be negative'), v.maxValue(10000, 'Total target cannot exceed 10000 hours'))
  ),
  status: v.optional(v.picklist(['active', 'completed', 'archived'], 'Invalid status')),
});

/**
 * Schema for updating an existing project/activity
 */
export const UpdateProjectSchema = v.object({
  name: v.optional(
    v.pipe(
      v.string(),
      v.nonEmpty('Project name cannot be empty'),
      v.maxLength(100, 'Project name cannot exceed 100 characters'),
      v.transform((str) => str.trim())
    )
  ),
  description: v.optional(
    v.pipe(
      v.string(),
      v.nonEmpty('Description cannot be empty'),
      v.maxLength(500, 'Description cannot exceed 500 characters'),
      v.transform((str) => str.trim())
    )
  ),
  icon: v.optional(NonEmptyStringSchema),
  color: v.optional(v.pipe(v.string(), v.regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex code'))),
  weeklyTarget: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(168))),
  totalTarget: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(10000))),
  status: v.optional(v.picklist(['active', 'completed', 'archived'])),
});

/**
 * Schema for project filters
 */
export const ProjectFiltersSchema = v.object({
  userId: v.optional(UuidSchema),
  status: v.optional(v.picklist(['active', 'completed', 'archived'])),
  search: v.optional(v.string()),
});

/**
 * Schema for project sort options
 */
export const ProjectSortSchema = v.object({
  field: v.picklist(['name', 'createdAt', 'updatedAt']),
  direction: v.picklist(['asc', 'desc']),
});

// Type exports
export type CreateProjectInput = v.InferInput<typeof CreateProjectSchema>;
export type CreateProjectData = v.InferOutput<typeof CreateProjectSchema>;

export type UpdateProjectInput = v.InferInput<typeof UpdateProjectSchema>;
export type UpdateProjectData = v.InferOutput<typeof UpdateProjectSchema>;

export type ProjectFiltersInput = v.InferInput<typeof ProjectFiltersSchema>;
export type ProjectFilters = v.InferOutput<typeof ProjectFiltersSchema>;

export type ProjectSortInput = v.InferInput<typeof ProjectSortSchema>;
export type ProjectSort = v.InferOutput<typeof ProjectSortSchema>;
