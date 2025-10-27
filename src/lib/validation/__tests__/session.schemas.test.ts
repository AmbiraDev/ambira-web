/**
 * Tests for session validation schemas
 */

import { validate } from '../utils/validate';
import { CreateSessionSchema, UpdateSessionSchema, SessionFormSchema } from '../schemas/session.schemas';

describe('Session Schemas', () => {
  describe('CreateSessionSchema', () => {
    it('should validate valid session data', () => {
      const input = {
        activityId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Deep Work Session',
        duration: 3600,
        startTime: new Date('2025-01-15T10:00:00Z'),
        visibility: 'everyone' as const,
      };

      const result = validate(CreateSessionSchema, input);

      expect(result.success).toBe(true);
    });

    it('should accept optional fields', () => {
      const input = {
        activityId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Study Session',
        duration: 1800,
        startTime: new Date(),
        description: 'Studying algorithms',
        tags: ['coding', 'algorithms'],
        images: ['https://example.com/image1.jpg'],
        howFelt: 4,
        privateNotes: 'Great session!',
        allowComments: true,
      };

      const result = validate(CreateSessionSchema, input);

      expect(result.success).toBe(true);
    });

    it('should fail for missing required fields', () => {
      const input = {
        title: 'Test Session',
        duration: 3600,
      };

      const result = validate(CreateSessionSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.errors.map((e) => e.path);
        expect(paths).toContain('activityId');
        expect(paths).toContain('startTime');
      }
    });

    it('should fail for invalid activity ID', () => {
      const input = {
        activityId: 'not-a-uuid',
        title: 'Test',
        duration: 3600,
        startTime: new Date(),
      };

      const result = validate(CreateSessionSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('activityId');
      }
    });

    it('should fail for invalid duration', () => {
      const inputs = [
        { duration: 0 }, // Too short
        { duration: -100 }, // Negative
        { duration: 90000 }, // Too long (> 24 hours)
      ];

      inputs.forEach((durationInput) => {
        const input = {
          activityId: '550e8400-e29b-41d4-a716-446655440000',
          title: 'Test',
          startTime: new Date(),
          ...durationInput,
        };

        const result = validate(CreateSessionSchema, input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors[0].path).toBe('duration');
        }
      });
    });

    it('should fail for title too long', () => {
      const input = {
        activityId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'A'.repeat(201), // Max is 200
        duration: 3600,
        startTime: new Date(),
      };

      const result = validate(CreateSessionSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('title');
      }
    });

    it('should fail for invalid visibility', () => {
      const input = {
        activityId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test',
        duration: 3600,
        startTime: new Date(),
        visibility: 'invalid' as any,
      };

      const result = validate(CreateSessionSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('visibility');
      }
    });

    it('should fail for invalid howFelt rating', () => {
      const inputs = [{ howFelt: 0 }, { howFelt: 6 }, { howFelt: -1 }];

      inputs.forEach((ratingInput) => {
        const input = {
          activityId: '550e8400-e29b-41d4-a716-446655440000',
          title: 'Test',
          duration: 3600,
          startTime: new Date(),
          ...ratingInput,
        };

        const result = validate(CreateSessionSchema, input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors[0].path).toBe('howFelt');
        }
      });
    });

    it('should trim title and description', () => {
      const input = {
        activityId: '550e8400-e29b-41d4-a716-446655440000',
        title: '  Spaced Title  ',
        description: '  Spaced Description  ',
        duration: 3600,
        startTime: new Date(),
      };

      const result = validate(CreateSessionSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Spaced Title');
        expect(result.data.description).toBe('Spaced Description');
      }
    });
  });

  describe('UpdateSessionSchema', () => {
    it('should validate partial updates', () => {
      const input = {
        title: 'Updated Title',
        visibility: 'private' as const,
      };

      const result = validate(UpdateSessionSchema, input);

      expect(result.success).toBe(true);
    });

    it('should allow updating isArchived', () => {
      const input = {
        isArchived: true,
      };

      const result = validate(UpdateSessionSchema, input);

      expect(result.success).toBe(true);
    });

    it('should validate all fields when provided', () => {
      const input = {
        title: 'Complete Update',
        description: 'Updated description',
        visibility: 'followers' as const,
        tags: ['updated'],
        howFelt: 3,
        privateNotes: 'Updated notes',
        allowComments: false,
        isArchived: false,
      };

      const result = validate(UpdateSessionSchema, input);

      expect(result.success).toBe(true);
    });

    it('should fail for invalid values', () => {
      const input = {
        howFelt: 10, // Invalid rating
      };

      const result = validate(UpdateSessionSchema, input);

      expect(result.success).toBe(false);
    });
  });

  describe('SessionFormSchema', () => {
    it('should transform string duration to number', () => {
      const input = {
        activityId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test',
        duration: '3600', // String duration
        startTime: new Date(),
      };

      const result = validate(SessionFormSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.duration).toBe(3600);
        expect(typeof result.data.duration).toBe('number');
      }
    });

    it('should transform comma-separated tags to array', () => {
      const input = {
        activityId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test',
        duration: 3600,
        startTime: new Date(),
        tags: 'coding, algorithms, practice', // String tags
      };

      const result = validate(SessionFormSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual(['coding', 'algorithms', 'practice']);
      }
    });

    it('should transform string boolean to boolean', () => {
      const input = {
        activityId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test',
        duration: 3600,
        startTime: new Date(),
        showStartTime: 'true', // String boolean
        allowComments: 'false', // String boolean
      };

      const result = validate(SessionFormSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.showStartTime).toBe(true);
        expect(result.data.allowComments).toBe(false);
      }
    });
  });
});
