/**
 * Validation library
 *
 * Central export for all validation utilities and schemas.
 *
 * @example
 * ```typescript
 * import { validateOrThrow, CreateSessionSchema } from '@/lib/validation';
 *
 * const validatedData = validateOrThrow(CreateSessionSchema, userInput);
 * ```
 */

// Export all utilities
export * from './utils';

// Export all schemas
export * from './schemas';

// Re-export valibot for convenience
export * as v from 'valibot';
