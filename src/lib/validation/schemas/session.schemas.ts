/**
 * Session validation schemas
 *
 * Validates session creation and updates with proper type safety,
 * input sanitization, and Firestore compatibility.
 */

import * as v from 'valibot';
import {
  UuidSchema,
  VisibilitySchema,
  OptionalVisibilitySchema,
  DurationSchema,
  LongTextSchema,
  TagsSchema,
  ImageUrlsSchema,
  NonEmptyStringSchema,
  OptionalStringSchema,
} from '../utils/common-schemas';

/**
 * Schema for creating a new session
 *
 * Validates all required fields and optional fields with appropriate constraints.
 */
export const CreateSessionSchema = v.object({
  // Required fields
  activityId: UuidSchema,
  title: v.pipe(
    v.string('Title is required'),
    v.nonEmpty('Title cannot be empty'),
    v.maxLength(200, 'Title cannot exceed 200 characters'),
    v.transform(str => str.trim())
  ),
  duration: DurationSchema,
  startTime: v.union([
    v.date('Invalid start time'),
    v.pipe(
      v.number(),
      v.transform(n => new Date(n))
    ),
  ]),

  // Optional fields
  description: OptionalStringSchema,
  visibility: OptionalVisibilitySchema,
  tags: TagsSchema,
  images: ImageUrlsSchema,
  showStartTime: v.optional(v.boolean()),
  howFelt: v.optional(
    v.pipe(
      v.number(),
      v.integer(),
      v.minValue(1, 'Rating must be 1-5'),
      v.maxValue(5, 'Rating must be 1-5')
    )
  ),
  privateNotes: LongTextSchema,
  allowComments: v.optional(v.boolean()),

  // Backwards compatibility
  projectId: v.optional(UuidSchema),
});

/**
 * Schema for updating an existing session
 *
 * All fields are optional since updates can be partial.
 */
export const UpdateSessionSchema = v.object({
  title: v.optional(
    v.pipe(
      v.string(),
      v.nonEmpty('Title cannot be empty'),
      v.maxLength(200, 'Title cannot exceed 200 characters'),
      v.transform(str => str.trim())
    )
  ),
  description: OptionalStringSchema,
  visibility: v.optional(VisibilitySchema),
  tags: TagsSchema,
  images: ImageUrlsSchema,
  showStartTime: v.optional(v.boolean()),
  howFelt: v.optional(
    v.pipe(
      v.number(),
      v.integer(),
      v.minValue(1, 'Rating must be 1-5'),
      v.maxValue(5, 'Rating must be 1-5')
    )
  ),
  privateNotes: LongTextSchema,
  allowComments: v.optional(v.boolean()),
  isArchived: v.optional(v.boolean()),
});

/**
 * Schema for session form data (used in UI forms)
 *
 * Similar to CreateSessionSchema but with more flexible input types
 * that can be transformed into the final format.
 */
export const SessionFormSchema = v.object({
  activityId: NonEmptyStringSchema,
  title: NonEmptyStringSchema,
  duration: v.union([
    DurationSchema,
    v.pipe(
      v.string(),
      v.transform(str => parseInt(str, 10)),
      DurationSchema
    ),
  ]),
  startTime: v.union([
    v.date(),
    v.pipe(
      v.string(),
      v.transform(str => new Date(str))
    ),
  ]),
  description: OptionalStringSchema,
  visibility: OptionalVisibilitySchema,
  tags: v.optional(
    v.union([
      v.array(v.string()),
      v.pipe(
        v.string(),
        v.transform(str => (str ? str.split(',').map(tag => tag.trim()) : []))
      ),
    ])
  ),
  images: v.optional(v.array(v.string())),
  showStartTime: v.optional(
    v.union([
      v.boolean(),
      v.pipe(
        v.string(),
        v.transform(str => str === 'true')
      ),
    ])
  ),
  howFelt: v.optional(
    v.union([
      v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(5)),
      v.pipe(
        v.string(),
        v.transform(str => parseInt(str, 10)),
        v.integer(),
        v.minValue(1),
        v.maxValue(5)
      ),
    ])
  ),
  privateNotes: OptionalStringSchema,
  allowComments: v.optional(
    v.union([
      v.boolean(),
      v.pipe(
        v.string(),
        v.transform(str => str === 'true')
      ),
    ])
  ),
});

/**
 * Schema for session filters (used in queries)
 */
export const SessionFiltersSchema = v.object({
  userId: v.optional(UuidSchema),
  activityId: v.optional(UuidSchema),
  visibility: v.optional(VisibilitySchema),
  startDate: v.optional(v.date()),
  endDate: v.optional(v.date()),
  isArchived: v.optional(v.boolean()),
  tags: v.optional(v.array(v.string())),
});

/**
 * Schema for session sort options
 */
export const SessionSortSchema = v.object({
  field: v.picklist(['createdAt', 'startTime', 'duration', 'supportCount']),
  direction: v.picklist(['asc', 'desc']),
});

// Type exports for use throughout the application
export type CreateSessionInput = v.InferInput<typeof CreateSessionSchema>;
export type CreateSessionData = v.InferOutput<typeof CreateSessionSchema>;

export type UpdateSessionInput = v.InferInput<typeof UpdateSessionSchema>;
export type UpdateSessionData = v.InferOutput<typeof UpdateSessionSchema>;

export type SessionFormInput = v.InferInput<typeof SessionFormSchema>;
export type SessionFormData = v.InferOutput<typeof SessionFormSchema>;

export type SessionFiltersInput = v.InferInput<typeof SessionFiltersSchema>;
export type SessionFilters = v.InferOutput<typeof SessionFiltersSchema>;

export type SessionSortInput = v.InferInput<typeof SessionSortSchema>;
export type SessionSort = v.InferOutput<typeof SessionSortSchema>;
