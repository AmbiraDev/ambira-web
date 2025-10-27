/**
 * Common validation schemas used across multiple features
 *
 * These reusable schemas ensure consistency in validation patterns
 * throughout the application.
 */

import * as v from 'valibot';

/**
 * Common error messages for consistent UX
 */
export const ERROR_MESSAGES = {
  required: 'This field is required',
  invalidEmail: 'Please enter a valid email address',
  invalidUrl: 'Please enter a valid URL',
  invalidUuid: 'Invalid ID format',
  tooShort: (min: number) => `Must be at least ${min} characters`,
  tooLong: (max: number) => `Cannot exceed ${max} characters`,
  minValue: (min: number) => `Must be at least ${min}`,
  maxValue: (max: number) => `Cannot exceed ${max}`,
  invalidDate: 'Invalid date',
  invalidVisibility: 'Invalid visibility setting',
} as const;

/**
 * UUID validation schema
 */
export const UuidSchema = v.pipe(
  v.string(ERROR_MESSAGES.required),
  v.nonEmpty(ERROR_MESSAGES.required),
  v.uuid(ERROR_MESSAGES.invalidUuid)
);

/**
 * Email validation schema
 */
export const EmailSchema = v.pipe(
  v.string(ERROR_MESSAGES.required),
  v.nonEmpty(ERROR_MESSAGES.required),
  v.email(ERROR_MESSAGES.invalidEmail)
);

/**
 * URL validation schema
 */
export const UrlSchema = v.pipe(
  v.string(ERROR_MESSAGES.required),
  v.nonEmpty(ERROR_MESSAGES.required),
  v.url(ERROR_MESSAGES.invalidUrl)
);

/**
 * Visibility options schema (matches Firestore values)
 */
export const VisibilitySchema = v.picklist(['everyone', 'followers', 'private'], ERROR_MESSAGES.invalidVisibility);

/**
 * Optional visibility schema with default
 */
export const OptionalVisibilitySchema = v.optional(VisibilitySchema, 'private');

/**
 * Timestamp schema (accepts Date or number)
 */
export const TimestampSchema = v.union([v.date(), v.number()]);

/**
 * Non-empty string schema
 */
export const NonEmptyStringSchema = v.pipe(
  v.string(ERROR_MESSAGES.required),
  v.nonEmpty(ERROR_MESSAGES.required),
  v.transform((str) => str.trim())
);

/**
 * Optional trimmed string schema
 */
export const OptionalStringSchema = v.optional(v.pipe(v.string(), v.transform((str) => str.trim())));

/**
 * Username schema (alphanumeric, underscores, hyphens)
 */
export const UsernameSchema = v.pipe(
  v.string(ERROR_MESSAGES.required),
  v.nonEmpty(ERROR_MESSAGES.required),
  v.regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  v.minLength(3, ERROR_MESSAGES.tooShort(3)),
  v.maxLength(30, ERROR_MESSAGES.tooLong(30))
);

/**
 * Positive integer schema
 */
export const PositiveIntegerSchema = v.pipe(v.number(), v.integer(), v.minValue(1, ERROR_MESSAGES.minValue(1)));

/**
 * Duration schema (in seconds, 1 second to 24 hours)
 */
export const DurationSchema = v.pipe(
  v.number('Duration must be a number'),
  v.integer('Duration must be whole seconds'),
  v.minValue(1, 'Duration must be at least 1 second'),
  v.maxValue(86400, 'Duration cannot exceed 24 hours')
);

/**
 * Short text schema (max 500 characters)
 */
export const ShortTextSchema = v.optional(
  v.pipe(
    v.string(),
    v.maxLength(500, ERROR_MESSAGES.tooLong(500)),
    v.transform((str) => str.trim())
  )
);

/**
 * Long text schema (max 5000 characters)
 */
export const LongTextSchema = v.optional(
  v.pipe(
    v.string(),
    v.maxLength(5000, ERROR_MESSAGES.tooLong(5000)),
    v.transform((str) => str.trim())
  )
);

/**
 * Tags array schema
 */
export const TagsSchema = v.optional(
  v.pipe(
    v.array(v.pipe(v.string(), v.nonEmpty(), v.maxLength(50))),
    v.maxLength(20, 'Cannot exceed 20 tags')
  )
);

/**
 * Image URL array schema
 */
export const ImageUrlsSchema = v.optional(
  v.pipe(v.array(UrlSchema), v.maxLength(10, 'Cannot upload more than 10 images'))
);
