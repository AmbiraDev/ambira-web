/**
 * Tests for project validation schemas
 */

import { validate } from '../utils/validate';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  ProjectFiltersSchema,
  ProjectSortSchema,
} from '../schemas/project.schemas';

describe('Project Schemas', () => {
  describe('CreateProjectSchema', () => {
    it('should validate valid project data with all required fields', () => {
      const input = {
        name: 'Machine Learning Research',
        description: 'Deep learning research project for image classification',
        icon: '🧠',
        color: '#007AFF',
      };

      const result = validate(CreateProjectSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe(input.name);
        expect(result.data.description).toBe(input.description);
        expect(result.data.icon).toBe(input.icon);
        expect(result.data.color).toBe(input.color);
      }
    });

    it('should validate project with all optional fields', () => {
      const input = {
        name: 'Side Project',
        description: 'Building a SaaS application',
        icon: '💡',
        color: '#34C759',
        weeklyTarget: 20,
        totalTarget: 500,
        status: 'active' as const,
      };

      const result = validate(CreateProjectSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.weeklyTarget).toBe(20);
        expect(result.data.totalTarget).toBe(500);
        expect(result.data.status).toBe('active');
      }
    });

    it('should fail for missing name', () => {
      const input = {
        description: 'Test description',
        icon: '📚',
        color: '#FF3B30',
      };

      const result = validate(CreateProjectSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.errors.map(e => e.path);
        expect(paths).toContain('name');
      }
    });

    it('should fail for missing description', () => {
      const input = {
        name: 'Test Project',
        icon: '📚',
        color: '#FF3B30',
      };

      const result = validate(CreateProjectSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.errors.map(e => e.path);
        expect(paths).toContain('description');
      }
    });

    it('should fail for missing icon', () => {
      const input = {
        name: 'Test Project',
        description: 'Test description',
        color: '#FF3B30',
      };

      const result = validate(CreateProjectSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.errors.map(e => e.path);
        expect(paths).toContain('icon');
      }
    });

    it('should fail for missing color', () => {
      const input = {
        name: 'Test Project',
        description: 'Test description',
        icon: '📚',
      };

      const result = validate(CreateProjectSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.errors.map(e => e.path);
        expect(paths).toContain('color');
      }
    });

    it('should fail for empty name', () => {
      const input = {
        name: '',
        description: 'Test description',
        icon: '📚',
        color: '#FF3B30',
      };

      const result = validate(CreateProjectSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('name');
      }
    });

    it('should fail for name exceeding 100 characters', () => {
      const input = {
        name: 'A'.repeat(101), // Max is 100
        description: 'Test description',
        icon: '📚',
        color: '#FF3B30',
      };

      const result = validate(CreateProjectSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('name');
      }
    });

    it('should allow name at exactly 100 characters', () => {
      const input = {
        name: 'A'.repeat(100),
        description: 'Test description',
        icon: '📚',
        color: '#FF3B30',
      };

      const result = validate(CreateProjectSchema, input);

      expect(result.success).toBe(true);
    });

    it('should fail for empty description', () => {
      const input = {
        name: 'Test Project',
        description: '',
        icon: '📚',
        color: '#FF3B30',
      };

      const result = validate(CreateProjectSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('description');
      }
    });

    it('should fail for description exceeding 500 characters', () => {
      const input = {
        name: 'Test Project',
        description: 'B'.repeat(501), // Max is 500
        icon: '📚',
        color: '#FF3B30',
      };

      const result = validate(CreateProjectSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('description');
      }
    });

    it('should allow description at exactly 500 characters', () => {
      const input = {
        name: 'Test Project',
        description: 'B'.repeat(500),
        icon: '📚',
        color: '#FF3B30',
      };

      const result = validate(CreateProjectSchema, input);

      expect(result.success).toBe(true);
    });

    it('should fail for invalid hex color format', () => {
      const invalidColors = [
        'FF3B30', // Missing #
        '#FF3B3', // Too short
        '#FF3B300', // Too long
        '#GGGGGG', // Invalid characters
        'rgb(255,0,0)', // Wrong format
      ];

      invalidColors.forEach((color: string) => {
        const input = {
          name: 'Test Project',
          description: 'Test description',
          icon: '📚',
          color,
        };

        const result = validate(CreateProjectSchema, input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors[0]?.path).toBe('color');
        }
      });
    });

    it('should validate various valid hex color formats', () => {
      const validColors = [
        '#007AFF',
        '#ff3b30',
        '#34C759',
        '#FFFFFF',
        '#000000',
      ];

      validColors.forEach(color => {
        const input = {
          name: 'Test Project',
          description: 'Test description',
          icon: '📚',
          color,
        };

        const result = validate(CreateProjectSchema, input);

        expect(result.success).toBe(true);
      });
    });

    it('should fail for negative weeklyTarget', () => {
      const input = {
        name: 'Test Project',
        description: 'Test description',
        icon: '📚',
        color: '#FF3B30',
        weeklyTarget: -5,
      };

      const result = validate(CreateProjectSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('weeklyTarget');
      }
    });

    it('should fail for weeklyTarget exceeding 168 hours', () => {
      const input = {
        name: 'Test Project',
        description: 'Test description',
        icon: '📚',
        color: '#FF3B30',
        weeklyTarget: 169, // Max is 168 (7 days * 24 hours)
      };

      const result = validate(CreateProjectSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('weeklyTarget');
      }
    });

    it('should allow weeklyTarget at exactly 168 hours', () => {
      const input = {
        name: 'Test Project',
        description: 'Test description',
        icon: '📚',
        color: '#FF3B30',
        weeklyTarget: 168,
      };

      const result = validate(CreateProjectSchema, input);

      expect(result.success).toBe(true);
    });

    it('should allow weeklyTarget at 0', () => {
      const input = {
        name: 'Test Project',
        description: 'Test description',
        icon: '📚',
        color: '#FF3B30',
        weeklyTarget: 0,
      };

      const result = validate(CreateProjectSchema, input);

      expect(result.success).toBe(true);
    });

    it('should fail for negative totalTarget', () => {
      const input = {
        name: 'Test Project',
        description: 'Test description',
        icon: '📚',
        color: '#FF3B30',
        totalTarget: -100,
      };

      const result = validate(CreateProjectSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('totalTarget');
      }
    });

    it('should fail for totalTarget exceeding 10000 hours', () => {
      const input = {
        name: 'Test Project',
        description: 'Test description',
        icon: '📚',
        color: '#FF3B30',
        totalTarget: 10001, // Max is 10000
      };

      const result = validate(CreateProjectSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('totalTarget');
      }
    });

    it('should allow totalTarget at exactly 10000 hours', () => {
      const input = {
        name: 'Test Project',
        description: 'Test description',
        icon: '📚',
        color: '#FF3B30',
        totalTarget: 10000,
      };

      const result = validate(CreateProjectSchema, input);

      expect(result.success).toBe(true);
    });

    it('should allow totalTarget at 0', () => {
      const input = {
        name: 'Test Project',
        description: 'Test description',
        icon: '📚',
        color: '#FF3B30',
        totalTarget: 0,
      };

      const result = validate(CreateProjectSchema, input);

      expect(result.success).toBe(true);
    });

    it('should validate all status enum values', () => {
      const statuses = ['active', 'completed', 'archived'] as const;

      statuses.forEach(status => {
        const input = {
          name: 'Test Project',
          description: 'Test description',
          icon: '📚',
          color: '#FF3B30',
          status,
        };

        const result = validate(CreateProjectSchema, input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe(status);
        }
      });
    });

    it('should fail for invalid status value', () => {
      const input: {
        name: string;
        description: string;
        icon: string;
        color: string;
        status: string;
      } = {
        name: 'Test Project',
        description: 'Test description',
        icon: '📚',
        color: '#FF3B30',
        status: 'invalid-status',
      };

      const result = validate(CreateProjectSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('status');
      }
    });

    it('should trim name and description whitespace', () => {
      const input = {
        name: '  Test Project  ',
        description: '  Test description  ',
        icon: '📚',
        color: '#FF3B30',
      };

      const result = validate(CreateProjectSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test Project');
        expect(result.data.description).toBe('Test description');
      }
    });

    it('should pass nonEmpty but trim to empty string', () => {
      const input = {
        name: '   ',
        description: 'Test description',
        icon: '📚',
        color: '#FF3B30',
      };

      const result = validate(CreateProjectSchema, input);

      // Schema validates nonEmpty before trim, so "   " passes (not empty)
      // Then it gets trimmed to "" during transformation
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('');
      }
    });
  });

  describe('UpdateProjectSchema', () => {
    it('should validate partial update with name only', () => {
      const input = {
        name: 'Updated Project Name',
      };

      const result = validate(UpdateProjectSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe(input.name);
      }
    });

    it('should validate partial update with description only', () => {
      const input = {
        description: 'Updated description',
      };

      const result = validate(UpdateProjectSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe(input.description);
      }
    });

    it('should validate partial update with color only', () => {
      const input = {
        color: '#34C759',
      };

      const result = validate(UpdateProjectSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.color).toBe(input.color);
      }
    });

    it('should validate partial update with weeklyTarget only', () => {
      const input = {
        weeklyTarget: 30,
      };

      const result = validate(UpdateProjectSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.weeklyTarget).toBe(30);
      }
    });

    it('should validate partial update with status only', () => {
      const input = {
        status: 'completed' as const,
      };

      const result = validate(UpdateProjectSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('completed');
      }
    });

    it('should validate empty update object', () => {
      const input = {};

      const result = validate(UpdateProjectSchema, input);

      expect(result.success).toBe(true);
    });

    it('should validate multiple fields updated together', () => {
      const input = {
        name: 'Updated Name',
        description: 'Updated description',
        color: '#FF3B30',
        weeklyTarget: 25,
        totalTarget: 1000,
        status: 'active' as const,
      };

      const result = validate(UpdateProjectSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Name');
        expect(result.data.description).toBe('Updated description');
        expect(result.data.color).toBe('#FF3B30');
        expect(result.data.weeklyTarget).toBe(25);
        expect(result.data.totalTarget).toBe(1000);
        expect(result.data.status).toBe('active');
      }
    });

    it('should fail for empty name', () => {
      const input = {
        name: '',
      };

      const result = validate(UpdateProjectSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('name');
      }
    });

    it('should fail for name exceeding 100 characters', () => {
      const input = {
        name: 'A'.repeat(101),
      };

      const result = validate(UpdateProjectSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('name');
      }
    });

    it('should fail for empty description', () => {
      const input = {
        description: '',
      };

      const result = validate(UpdateProjectSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('description');
      }
    });

    it('should fail for description exceeding 500 characters', () => {
      const input = {
        description: 'B'.repeat(501),
      };

      const result = validate(UpdateProjectSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('description');
      }
    });

    it('should fail for invalid color format', () => {
      const input = {
        color: 'not-a-hex-color',
      };

      const result = validate(UpdateProjectSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('color');
      }
    });

    it('should fail for weeklyTarget out of range', () => {
      const invalidTargets = [-1, 169, 200];

      invalidTargets.forEach((weeklyTarget: number) => {
        const input = { weeklyTarget };
        const result = validate(UpdateProjectSchema, input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors[0]?.path).toBe('weeklyTarget');
        }
      });
    });

    it('should fail for totalTarget out of range', () => {
      const invalidTargets = [-1, 10001, 20000];

      invalidTargets.forEach((totalTarget: number) => {
        const input = { totalTarget };
        const result = validate(UpdateProjectSchema, input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors[0]?.path).toBe('totalTarget');
        }
      });
    });

    it('should fail for invalid status', () => {
      const input: {
        status: string;
      } = {
        status: 'pending',
      };

      const result = validate(UpdateProjectSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('status');
      }
    });

    it('should trim name and description whitespace', () => {
      const input = {
        name: '  Updated Name  ',
        description: '  Updated Description  ',
      };

      const result = validate(UpdateProjectSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Name');
        expect(result.data.description).toBe('Updated Description');
      }
    });
  });

  describe('ProjectFiltersSchema', () => {
    it('should validate empty filters', () => {
      const input = {};

      const result = validate(ProjectFiltersSchema, input);

      expect(result.success).toBe(true);
    });

    it('should validate userId filter', () => {
      const input = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = validate(ProjectFiltersSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(input.userId);
      }
    });

    it('should validate status filter', () => {
      const input = {
        status: 'active' as const,
      };

      const result = validate(ProjectFiltersSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('active');
      }
    });

    it('should validate search filter', () => {
      const input = {
        search: 'machine learning',
      };

      const result = validate(ProjectFiltersSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe(input.search);
      }
    });

    it('should validate all filters together', () => {
      const input = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'completed' as const,
        search: 'research',
      };

      const result = validate(ProjectFiltersSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(input.userId);
        expect(result.data.status).toBe('completed');
        expect(result.data.search).toBe('research');
      }
    });

    it('should fail for invalid userId format', () => {
      const input = {
        userId: 'not-a-uuid',
      };

      const result = validate(ProjectFiltersSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('userId');
      }
    });

    it('should fail for invalid status', () => {
      const input: {
        status: string;
      } = {
        status: 'invalid-status',
      };

      const result = validate(ProjectFiltersSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('status');
      }
    });
  });

  describe('ProjectSortSchema', () => {
    it('should validate sort by name ascending', () => {
      const input = {
        field: 'name' as const,
        direction: 'asc' as const,
      };

      const result = validate(ProjectSortSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.field).toBe('name');
        expect(result.data.direction).toBe('asc');
      }
    });

    it('should validate sort by createdAt descending', () => {
      const input = {
        field: 'createdAt' as const,
        direction: 'desc' as const,
      };

      const result = validate(ProjectSortSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.field).toBe('createdAt');
        expect(result.data.direction).toBe('desc');
      }
    });

    it('should validate sort by updatedAt', () => {
      const input = {
        field: 'updatedAt' as const,
        direction: 'asc' as const,
      };

      const result = validate(ProjectSortSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.field).toBe('updatedAt');
      }
    });

    it('should fail for missing field', () => {
      const input = {
        direction: 'asc' as const,
      };

      const result = validate(ProjectSortSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.errors.map(e => e.path);
        expect(paths).toContain('field');
      }
    });

    it('should fail for missing direction', () => {
      const input = {
        field: 'name' as const,
      };

      const result = validate(ProjectSortSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.errors.map(e => e.path);
        expect(paths).toContain('direction');
      }
    });

    it('should fail for invalid field', () => {
      const input: {
        field: string;
        direction: 'asc';
      } = {
        field: 'invalid',
        direction: 'asc',
      };

      const result = validate(ProjectSortSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('field');
      }
    });

    it('should fail for invalid direction', () => {
      const input: {
        field: 'name';
        direction: string;
      } = {
        field: 'name',
        direction: 'invalid',
      };

      const result = validate(ProjectSortSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('direction');
      }
    });
  });
});
