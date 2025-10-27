/**
 * Tests for validation utility functions
 */

import * as v from 'valibot';
import { validateOrThrow, validate, stripUndefined, prepareForFirestore, formatValidationError, isValidationError, ValidationError } from '../utils/validate';

describe('Validation Utilities', () => {
  describe('validateOrThrow', () => {
    const TestSchema = v.object({
      name: v.pipe(v.string(), v.nonEmpty()),
      age: v.pipe(v.number(), v.minValue(0)),
    });

    it('should return validated data for valid input', () => {
      const input = { name: 'John', age: 30 };
      const result = validateOrThrow(TestSchema, input);

      expect(result).toEqual(input);
    });

    it('should throw ValidationError for invalid input', () => {
      const input = { name: '', age: -1 };

      expect(() => validateOrThrow(TestSchema, input)).toThrow(ValidationError);
    });

    it('should include error details in ValidationError', () => {
      const input = { name: '', age: -1 };

      try {
        validateOrThrow(TestSchema, input);
        fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.issues).toHaveLength(2);
          expect(error.issues[0].path).toBe('name');
          expect(error.issues[1].path).toBe('age');
        }
      }
    });
  });

  describe('validate', () => {
    const TestSchema = v.object({
      email: v.pipe(v.string(), v.email()),
    });

    it('should return success result for valid input', () => {
      const input = { email: 'test@example.com' };
      const result = validate(TestSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it('should return error result for invalid input', () => {
      const input = { email: 'invalid-email' };
      const result = validate(TestSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].path).toBe('email');
      }
    });
  });

  describe('stripUndefined', () => {
    it('should remove undefined values from flat object', () => {
      const input = {
        name: 'John',
        age: undefined,
        email: 'john@example.com',
        bio: undefined,
      };

      const result = stripUndefined(input);

      expect(result).toEqual({
        name: 'John',
        email: 'john@example.com',
      });
    });

    it('should preserve null values', () => {
      const input = {
        name: 'John',
        age: null,
        email: undefined,
      };

      const result = stripUndefined(input);

      expect(result).toEqual({
        name: 'John',
        age: null,
      });
    });

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: 'John',
          email: undefined,
          settings: {
            theme: 'dark',
            notifications: undefined,
          },
        },
      };

      const result = stripUndefined(input);

      expect(result).toEqual({
        user: {
          name: 'John',
          settings: {
            theme: 'dark',
          },
        },
      });
    });

    it('should preserve arrays', () => {
      const input = {
        tags: ['tag1', 'tag2'],
        items: undefined,
      };

      const result = stripUndefined(input);

      expect(result).toEqual({
        tags: ['tag1', 'tag2'],
      });
    });

    it('should handle empty objects', () => {
      const input = {};
      const result = stripUndefined(input);

      expect(result).toEqual({});
    });
  });

  describe('prepareForFirestore', () => {
    it('should remove undefined values for Firestore compatibility', () => {
      const input = {
        title: 'Test Session',
        description: undefined,
        tags: ['tag1'],
        notes: undefined,
      };

      const result = prepareForFirestore(input);

      expect(result).toEqual({
        title: 'Test Session',
        tags: ['tag1'],
      });
    });
  });

  describe('formatValidationError', () => {
    it('should format single error', () => {
      const error = new ValidationError('Validation failed', [{ path: 'email', message: 'Invalid email' }]);

      const formatted = formatValidationError(error);

      expect(formatted).toBe('Invalid email');
    });

    it('should format multiple errors with paths', () => {
      const error = new ValidationError('Validation failed', [
        { path: 'email', message: 'Invalid email' },
        { path: 'name', message: 'Name is required' },
      ]);

      const formatted = formatValidationError(error);

      expect(formatted).toBe('email: Invalid email\nname: Name is required');
    });

    it('should format errors without paths', () => {
      const error = new ValidationError('Validation failed', [{ message: 'General error' }]);

      const formatted = formatValidationError(error);

      expect(formatted).toBe('General error');
    });
  });

  describe('isValidationError', () => {
    it('should return true for ValidationError instances', () => {
      const error = new ValidationError('Test', []);

      expect(isValidationError(error)).toBe(true);
    });

    it('should return false for regular errors', () => {
      const error = new Error('Test');

      expect(isValidationError(error)).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isValidationError('string')).toBe(false);
      expect(isValidationError(null)).toBe(false);
      expect(isValidationError(undefined)).toBe(false);
      expect(isValidationError({})).toBe(false);
    });
  });
});
