# Validation Library

Comprehensive input validation for the Ambira application using [Valibot](https://valibot.dev/) - a lightweight, modular validation library with excellent TypeScript support.

## Overview

This validation library provides:

- **Runtime Type Safety** - Validate data at runtime, not just compile time
- **Firestore Compatibility** - Automatic handling of `undefined` values
- **Input Sanitization** - Trim strings, transform data, prevent injection
- **Consistent Error Messages** - User-friendly validation feedback
- **Type Inference** - Auto-generate TypeScript types from schemas

## Quick Start

```typescript
import { validateOrThrow, CreateSessionSchema } from '@/lib/validation';

// Validate user input
const sessionData = validateOrThrow(CreateSessionSchema, userInput);
// sessionData is now type-safe and validated

// Or use non-throwing validation
const result = validate(CreateSessionSchema, userInput);
if (result.success) {
  console.log(result.data); // Type-safe validated data
} else {
  console.error(result.errors); // Structured error information
}
```

## Directory Structure

```
src/lib/validation/
├── index.ts                    # Main export file
├── README.md                   # This file
│
├── utils/                      # Validation utilities
│   ├── index.ts               # Utility exports
│   ├── validate.ts            # Core validation functions
│   └── common-schemas.ts      # Reusable schema building blocks
│
├── schemas/                    # Domain-specific schemas
│   ├── index.ts               # Schema exports
│   ├── session.schemas.ts     # Session validation
│   └── user.schemas.ts        # User/profile validation
│
└── __tests__/                  # Test suites
    ├── validate.test.ts       # Utility function tests
    └── session.schemas.test.ts # Schema tests
```

## Core Utilities

### `validateOrThrow(schema, data)`

Validates data and throws a `ValidationError` if validation fails.

```typescript
import { validateOrThrow, CreateSessionSchema } from '@/lib/validation';

try {
  const validated = validateOrThrow(CreateSessionSchema, userInput);
  // Use validated data
} catch (error) {
  if (isValidationError(error)) {
    console.error(formatValidationError(error));
  }
}
```

### `validate(schema, data)`

Validates data and returns a result object (non-throwing).

```typescript
import { validate, CreateSessionSchema } from '@/lib/validation';

const result = validate(CreateSessionSchema, userInput);

if (result.success) {
  // result.data is type-safe
  await createSession(result.data);
} else {
  // result.errors contains structured error information
  return { errors: result.errors };
}
```

### `stripUndefined(data)`

Removes `undefined` values from objects (Firestore compatibility).

```typescript
import { stripUndefined } from '@/lib/validation';

const data = {
  title: 'Session',
  description: undefined,
  tags: ['tag1'],
};

const cleaned = stripUndefined(data);
// Result: { title: 'Session', tags: ['tag1'] }
```

### `prepareForFirestore(data)`

Alias for `stripUndefined` - use in schema transformations.

```typescript
const FirestoreSessionSchema = v.pipe(
  CreateSessionSchema,
  v.transform(data => prepareForFirestore(data))
);
```

## Common Schemas

Reusable schema building blocks in `utils/common-schemas.ts`:

```typescript
import {
  UuidSchema, // UUID validation
  EmailSchema, // Email validation
  UrlSchema, // URL validation
  VisibilitySchema, // 'everyone' | 'followers' | 'private'
  UsernameSchema, // Alphanumeric + underscore/hyphen
  DurationSchema, // 1 second to 24 hours
  ShortTextSchema, // Max 500 characters
  LongTextSchema, // Max 5000 characters
  TagsSchema, // Array of tags (max 20)
  ImageUrlsSchema, // Array of image URLs (max 10)
} from '@/lib/validation';
```

## Session Schemas

Located in `schemas/session.schemas.ts`:

### `CreateSessionSchema`

Validates session creation data:

```typescript
import { validateOrThrow, CreateSessionSchema } from '@/lib/validation';

const sessionData = validateOrThrow(CreateSessionSchema, {
  activityId: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Deep Work Session',
  duration: 3600, // seconds
  startTime: new Date(),
  description: 'Working on the validation library',
  visibility: 'everyone',
  tags: ['coding', 'deep-work'],
  howFelt: 4, // 1-5 rating
});
```

**Required Fields:**

- `activityId` - UUID of the activity
- `title` - Session title (1-200 characters)
- `duration` - Duration in seconds (1-86400)
- `startTime` - Date object or timestamp

**Optional Fields:**

- `description` - Session description (max 5000 chars)
- `visibility` - 'everyone' | 'followers' | 'private' (default: 'private')
- `tags` - Array of tags (max 20)
- `images` - Array of image URLs (max 10)
- `showStartTime` - Boolean
- `howFelt` - Rating 1-5
- `privateNotes` - Private notes (max 5000 chars)
- `allowComments` - Boolean

### `UpdateSessionSchema`

Validates partial session updates:

```typescript
const updates = validateOrThrow(UpdateSessionSchema, {
  title: 'Updated Title',
  visibility: 'private',
  isArchived: true,
});
```

### `SessionFormSchema`

Validates form data with type transformations:

```typescript
// Handles string inputs from HTML forms
const formData = validateOrThrow(SessionFormSchema, {
  activityId: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Test',
  duration: '3600', // String converted to number
  startTime: '2025-01-15T10:00:00Z', // String converted to Date
  tags: 'coding, algorithms', // String split into array
  showStartTime: 'true', // String converted to boolean
});
```

## User Schemas

Located in `schemas/user.schemas.ts`:

### `SignupSchema`

Validates user registration:

```typescript
import { validateOrThrow, SignupSchema } from '@/lib/validation';

const userData = validateOrThrow(SignupSchema, {
  email: 'user@example.com',
  password: 'securePassword123',
  name: 'John Doe',
  username: 'johndoe',
});
```

### `UpdateProfileSchema`

Validates profile updates:

```typescript
const updates = validateOrThrow(UpdateProfileSchema, {
  name: 'John Smith',
  bio: 'Software developer passionate about productivity',
  website: 'https://johnsmith.com',
  socialLinks: {
    twitter: '@johnsmith',
    github: 'johnsmith',
  },
});
```

### `PrivacySettingsSchema`

Validates privacy settings:

```typescript
const settings = validateOrThrow(PrivacySettingsSchema, {
  profileVisibility: 'everyone',
  activityVisibility: 'followers',
  projectVisibility: 'private',
  showEmail: false,
  allowFollowRequests: true,
});
```

## Creating Custom Schemas

### Basic Schema

```typescript
import * as v from 'valibot';
import { NonEmptyStringSchema } from '@/lib/validation';

const MySchema = v.object({
  name: NonEmptyStringSchema,
  age: v.pipe(v.number(), v.minValue(0), v.maxValue(120)),
  email: v.optional(EmailSchema),
});

export type MyInput = v.InferInput<typeof MySchema>;
export type MyData = v.InferOutput<typeof MySchema>;
```

### Schema with Transformations

```typescript
const TransformSchema = v.object({
  title: v.pipe(
    v.string(),
    v.transform(str => str.trim()), // Trim whitespace
    v.transform(str => str.toLowerCase()), // Convert to lowercase
    v.nonEmpty('Title is required')
  ),
});
```

### Schema with Custom Validation

```typescript
const PasswordSchema = v.pipe(
  v.object({
    password: v.string(),
    confirmPassword: v.string(),
  }),
  v.forward(
    v.partialCheck(
      [['password'], ['confirmPassword']],
      input => input.password === input.confirmPassword,
      'Passwords must match'
    ),
    ['confirmPassword']
  )
);
```

## Error Handling

### ValidationError Class

```typescript
import { ValidationError, isValidationError } from '@/lib/validation';

try {
  validateOrThrow(schema, data);
} catch (error) {
  if (isValidationError(error)) {
    // error.issues contains detailed validation errors
    error.issues.forEach(issue => {
      console.log(`${issue.path}: ${issue.message}`);
    });
  }
}
```

### Formatting Errors for Users

```typescript
import { formatValidationError } from '@/lib/validation';

try {
  validateOrThrow(schema, data);
} catch (error) {
  if (isValidationError(error)) {
    toast.error(formatValidationError(error));
  }
}
```

## Integration Examples

### React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { validate, CreateSessionSchema } from '@/lib/validation';

function SessionForm() {
  const { register, handleSubmit, setError } = useForm();

  const onSubmit = async (data: unknown) => {
    const result = validate(CreateSessionSchema, data);

    if (!result.success) {
      // Set form errors
      result.errors.forEach((error) => {
        if (error.path) {
          setError(error.path as any, { message: error.message });
        }
      });
      return;
    }

    // Submit validated data
    await createSession(result.data);
  };

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

### Service Layer

```typescript
// src/features/sessions/services/SessionService.ts
import { validateOrThrow, CreateSessionSchema } from '@/lib/validation';

export async function createSession(input: unknown) {
  // Validate at service boundary
  const data = validateOrThrow(CreateSessionSchema, input);

  // Data is now type-safe and validated
  const sessionData = {
    ...data,
    createdAt: serverTimestamp(),
  };

  return await sessionRepo.create(sessionData);
}
```

### API Routes

```typescript
// src/app/api/sessions/route.ts
import { validate, CreateSessionSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const body = await request.json();

  const result = validate(CreateSessionSchema, body);

  if (!result.success) {
    return Response.json({ errors: result.errors }, { status: 400 });
  }

  const session = await createSession(result.data);
  return Response.json(session);
}
```

## Testing

All schemas include comprehensive test coverage:

```bash
# Run all validation tests
npm test -- src/lib/validation/__tests__

# Run specific test file
npm test -- src/lib/validation/__tests__/validate.test.ts
npm test -- src/lib/validation/__tests__/session.schemas.test.ts
```

### Example Test

```typescript
import { validate, CreateSessionSchema } from '@/lib/validation';

describe('CreateSessionSchema', () => {
  it('should validate valid session data', () => {
    const input = {
      activityId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test Session',
      duration: 3600,
      startTime: new Date(),
    };

    const result = validate(CreateSessionSchema, input);

    expect(result.success).toBe(true);
  });
});
```

## Best Practices

### 1. Validate at Boundaries

Always validate data at system boundaries (forms, APIs, services):

```typescript
// ✅ Good - Validate at service boundary
export function createSession(input: unknown) {
  const data = validateOrThrow(CreateSessionSchema, input);
  return repo.create(data);
}

// ❌ Bad - No validation
export function createSession(data: CreateSessionData) {
  return repo.create(data); // Trust user input
}
```

### 2. Use Type Inference

Let Valibot generate TypeScript types from schemas:

```typescript
// ✅ Good - Single source of truth
const MySchema = v.object({ name: v.string() });
type MyData = v.InferOutput<typeof MySchema>;

// ❌ Bad - Duplicate definitions
const MySchema = v.object({ name: v.string() });
interface MyData {
  name: string;
} // Can drift out of sync
```

### 3. Reuse Common Schemas

Build complex schemas from common building blocks:

```typescript
// ✅ Good - Reuse common patterns
import { UuidSchema, NonEmptyStringSchema } from '@/lib/validation';

const MySchema = v.object({
  id: UuidSchema,
  title: NonEmptyStringSchema,
});

// ❌ Bad - Duplicate validation logic
const MySchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  title: v.pipe(v.string(), v.nonEmpty()),
});
```

### 4. Transform Before Validate

Clean data before validation when needed:

```typescript
const FormSchema = v.object({
  title: v.pipe(
    v.string(),
    v.transform(str => str.trim()), // Clean first
    v.nonEmpty('Title is required') // Then validate
  ),
});
```

## Performance

Valibot is optimized for performance:

- **Tiny Bundle Size**: ~600 bytes (vs 14KB for Zod)
- **Tree Shaking**: Import only what you use
- **Fast Validation**: Optimized runtime performance
- **Zero Dependencies**: No transitive dependencies

## Resources

- [Valibot Documentation](https://valibot.dev/)
- [Valibot GitHub](https://github.com/fabian-hiller/valibot)
- [Validation Best Practices](/docs/architecture/VALIDATION.md)

## Migration Guide

When migrating existing code to use validation:

1. **Identify validation points**: Forms, API routes, service layers
2. **Create schemas**: Define validation rules for data structures
3. **Replace manual checks**: Replace `if (!data.field)` with schemas
4. **Update types**: Use inferred types from schemas
5. **Add tests**: Write tests for validation edge cases
6. **Deploy incrementally**: Migrate one feature at a time

## Support

For questions or issues:

1. Check the [Valibot documentation](https://valibot.dev/)
2. Review existing schemas in `src/lib/validation/schemas/`
3. Look at test examples in `src/lib/validation/__tests__/`
4. Ask the team in #engineering channel
