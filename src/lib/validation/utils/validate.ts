/**
 * Core validation utilities for the Ambira application
 *
 * Provides type-safe validation using Valibot schemas with consistent error handling
 * and Firestore compatibility.
 */

import * as v from 'valibot';

/**
 * Custom validation error class with structured error information
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: Array<{
      path?: string;
      message: string;
    }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates data against a Valibot schema and throws a ValidationError if validation fails
 *
 * @param schema - Valibot schema to validate against
 * @param data - Data to validate
 * @returns Validated and transformed data
 * @throws ValidationError if validation fails
 *
 * @example
 * ```typescript
 * const validated = validateOrThrow(CreateSessionSchema, userInput);
 * // validated is now type-safe and guaranteed to match schema
 * ```
 */
export function validateOrThrow<
  TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
>(schema: TSchema, data: unknown): v.InferOutput<TSchema> {
  const result = v.safeParse(schema, data);

  if (!result.success) {
    const issues = result.issues.map(issue => ({
      path: issue.path?.map(p => String(p.key)).join('.'),
      message: issue.message,
    }));

    throw new ValidationError('Validation failed', issues);
  }

  return result.output;
}

/**
 * Validates data against a Valibot schema and returns a result object
 *
 * @param schema - Valibot schema to validate against
 * @param data - Data to validate
 * @returns Result object with success flag and either data or errors
 *
 * @example
 * ```typescript
 * const result = validate(CreateSessionSchema, userInput);
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.log(result.errors);
 * }
 * ```
 */
export function validate<
  TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
>(
  schema: TSchema,
  data: unknown
):
  | { success: true; data: v.InferOutput<TSchema> }
  | {
      success: false;
      errors: Array<{
        path?: string;
        message: string;
      }>;
    } {
  const result = v.safeParse(schema, data);

  if (!result.success) {
    const errors = result.issues.map(issue => ({
      path: issue.path?.map(p => String(p.key)).join('.'),
      message: issue.message,
    }));

    return { success: false, errors };
  }

  return { success: true, data: result.output };
}

/**
 * Strips undefined values from an object for Firestore compatibility
 *
 * Firestore rejects documents with undefined values, so this utility
 * recursively removes them before writing to the database.
 *
 * @param data - Object to clean
 * @returns Object with undefined values removed
 *
 * @example
 * ```typescript
 * const input = { name: 'John', age: undefined, email: 'john@example.com' };
 * const cleaned = stripUndefined(input);
 * // Result: { name: 'John', email: 'john@example.com' }
 * ```
 */
export function stripUndefined<T extends Record<string, unknown>>(
  data: T
): Partial<T> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      continue;
    }

    // Recursively strip undefined from nested objects
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = stripUndefined(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result as Partial<T>;
}

/**
 * Prepares data for Firestore by stripping undefined values
 *
 * This is a convenience wrapper around stripUndefined that can be used
 * in schema transformations.
 *
 * @param data - Data to prepare
 * @returns Data with undefined values removed
 *
 * @example
 * ```typescript
 * const FirestoreSessionSchema = v.pipe(
 *   CreateSessionSchema,
 *   v.transform((data) => prepareForFirestore(data))
 * );
 * ```
 */
export function prepareForFirestore<T extends Record<string, unknown>>(
  data: T
): Partial<T> {
  return stripUndefined(data);
}

/**
 * Formats validation errors for user-friendly display
 *
 * @param error - ValidationError instance
 * @returns Formatted error message
 *
 * @example
 * ```typescript
 * try {
 *   validateOrThrow(schema, data);
 * } catch (_error) {
 *   if (error instanceof ValidationError) {
 *     toast.error(formatValidationError(error));
 *   }
 * }
 * ```
 */
export function formatValidationError(error: ValidationError): string {
  if (error.issues.length === 1) {
    return error.issues[0]?.message ?? 'Validation failed';
  }

  return error.issues
    .map(issue => `${issue.path ? `${issue.path}: ` : ''}${issue.message}`)
    .join('\n');
}

/**
 * Checks if an error is a ValidationError
 *
 * @param error - Error to check
 * @returns True if error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}
