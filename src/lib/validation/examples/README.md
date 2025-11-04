# Validation Examples

Practical examples showing how to use the validation infrastructure in React components, forms, and API routes.

## Overview

The Ambira validation system uses [Valibot](https://valibot.dev/) for type-safe validation with these key utilities:

- `validate()` - Returns `{ success, data }` or `{ success, errors }`
- `validateOrThrow()` - Throws `ValidationError` on failure
- `prepareForFirestore()` - Strips undefined values for Firestore
- `formatValidationError()` - Formats errors for display
- `isValidationError()` - Type guard for ValidationError

## Examples

### 1. SessionFormExample.tsx - Complete Form Validation

Full-featured session creation form with:

- Controlled form inputs with useState
- Real-time validation error clearing
- Field-level and form-level error display
- Type-safe form submission
- Success/error state management

```tsx
import { validate, SessionFormSchema } from '@/lib/validation';

const result = validate(SessionFormSchema, formData);
if (!result.success) {
  // Map errors to form fields
  result.errors.forEach(error => {
    if (error.path) {
      setErrors(prev => ({ ...prev, [error.path]: error.message }));
    }
  });
  return;
}

// Type-safe validated data
const validatedData = result.data;
```

**Use this pattern when:**

- Building complex forms with multiple fields
- Need field-specific error display
- Want real-time validation clearing

### 2. CommentFormExample.tsx - Inline Validation

Lightweight comment form with:

- Inline validation on blur
- Real-time character counter
- Quick submit with keyboard shortcuts
- Optimistic UI updates

```tsx
import { validate, CreateCommentSchema } from '@/lib/validation';

const handleBlur = () => {
  const result = validate(CreateCommentSchema, { sessionId, content });
  if (!result.success) {
    const contentError = result.errors.find(err => err.path === 'content');
    if (contentError) {
      setError(contentError.message);
    }
  }
};
```

**Use this pattern when:**

- Building simple, single-field forms
- Need inline validation feedback
- Want keyboard shortcuts (Cmd/Ctrl+Enter)

### 3. ProfileUpdateExample.tsx - Optional Fields & Nested Objects

Profile update form demonstrating:

- Multi-field form with optional values
- Nested object validation (social links)
- URL validation
- Change tracking (dirty state)
- Reset functionality

```tsx
import { validate, UpdateProfileSchema } from '@/lib/validation';

// Only include fields with values (optional field handling)
const dataToValidate = {};
if (formData.name.trim()) dataToValidate.name = formData.name;
if (formData.bio.trim()) dataToValidate.bio = formData.bio;

// Validate nested objects
if (formData.socialLinks.twitter) {
  dataToValidate.socialLinks = {
    twitter: formData.socialLinks.twitter,
    // ... other links
  };
}

const result = validate(UpdateProfileSchema, dataToValidate);
```

**Use this pattern when:**

- Updating existing data (partial updates)
- Dealing with optional fields
- Validating nested objects (like social links)
- Tracking form changes

### 4. ApiRouteExample.ts - API Route Validation

Next.js App Router API examples with:

- Request body validation
- Query parameter validation
- Error response formatting
- Type-safe responses
- Authentication middleware
- Firestore preparation

#### Pattern A: Using `validate()` for explicit error handling

```typescript
import { validate, CreateSessionSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = validate(CreateSessionSchema, body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.errors },
      { status: 400 }
    );
  }

  // Type-safe validated data
  const validatedData = result.data;

  // Prepare for Firestore
  const firestoreData = prepareForFirestore({
    ...validatedData,
    userId: 'current-user-id',
    createdAt: new Date(),
  });

  // Save to database...
}
```

#### Pattern B: Using `validateOrThrow()` with try-catch

```typescript
import {
  validateOrThrow,
  isValidationError,
  formatValidationError,
} from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = validateOrThrow(CreateCommentSchema, body);

    // Process validated data...

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isValidationError(error)) {
      return NextResponse.json(
        { error: formatValidationError(error) },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Pattern C: Reusable error response helper

```typescript
function createErrorResponse(error: unknown, defaultMessage: string) {
  if (isValidationError(error)) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        message: formatValidationError(error),
        details: error.issues,
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: 'Internal server error', message: defaultMessage },
    { status: 500 }
  );
}

// Usage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = validateOrThrow(CreateSessionSchema, body);
    // ...
  } catch (error) {
    return createErrorResponse(error, 'Failed to create session');
  }
}
```

**Use these patterns when:**

- Building API routes
- Validating request bodies or query params
- Need consistent error responses
- Preparing data for Firestore

## Common Patterns

### Pattern 1: Real-time Error Clearing

Clear errors as the user types:

```tsx
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));

  // Clear field-specific error
  if (errors[name]) {
    setErrors(prev => ({ ...prev, [name]: undefined }));
  }
};
```

### Pattern 2: Validation on Blur

Validate individual fields when user leaves the field:

```tsx
const handleBlur = (field: string) => {
  const result = validate(SomeSchema, { [field]: formData[field] });
  if (!result.success) {
    const error = result.errors.find(err => err.path === field);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error.message }));
    }
  }
};
```

### Pattern 3: Character Counter with Validation

Show remaining characters and warn at threshold:

```tsx
const MAX_LENGTH = 2000;
const remainingChars = MAX_LENGTH - content.length;

<p
  className={remainingChars < 100 ? 'text-orange-500' : 'text-muted-foreground'}
>
  {remainingChars} characters remaining
</p>;
```

### Pattern 4: Optional Fields in Forms

Only include fields with values:

```tsx
const dataToValidate = {};
if (formData.name.trim()) dataToValidate.name = formData.name;
if (formData.bio.trim()) dataToValidate.bio = formData.bio;

const result = validate(UpdateSchema, dataToValidate);
```

### Pattern 5: Nested Object Validation

Validate nested structures like social links:

```tsx
if (formData.socialLinks.twitter || formData.socialLinks.github) {
  dataToValidate.socialLinks = {
    ...(formData.socialLinks.twitter && {
      twitter: formData.socialLinks.twitter,
    }),
    ...(formData.socialLinks.github && { github: formData.socialLinks.github }),
  };
}
```

### Pattern 6: Form Change Tracking

Track if form has unsaved changes:

```tsx
const [hasChanges, setHasChanges] = useState(false);

useEffect(() => {
  const hasChanged = JSON.stringify(formData) !== JSON.stringify(initialData);
  setHasChanges(hasChanged);
}, [formData, initialData]);

// Disable submit if no changes
<button type="submit" disabled={!hasChanges}>
  Save
</button>;
```

### Pattern 7: Success/Error State Management

Manage form submission states:

```tsx
const [isSubmitting, setIsSubmitting] = useState(false);
const [submitError, setSubmitError] = useState('');
const [submitSuccess, setSubmitSuccess] = useState(false);

const handleSubmit = async () => {
  setIsSubmitting(true);
  setSubmitError('');
  setSubmitSuccess(false);

  try {
    // Validate and submit...
    setSubmitSuccess(true);
  } catch (error) {
    setSubmitError(error.message);
  } finally {
    setIsSubmitting(false);
  }
};
```

## Available Schemas

### Session Schemas

- `CreateSessionSchema` - Creating new sessions
- `UpdateSessionSchema` - Updating existing sessions
- `SessionFormSchema` - UI forms with flexible input types
- `SessionFiltersSchema` - Query filters
- `SessionSortSchema` - Sort options

### Comment Schemas

- `CreateCommentSchema` - Creating comments
- `UpdateCommentSchema` - Updating comments
- `CommentLikeSchema` - Like/unlike operations
- `CommentFiltersSchema` - Query filters
- `CommentSortSchema` - Sort options

### User Schemas

- `SignupSchema` - User registration
- `LoginSchema` - User login
- `UpdateProfileSchema` - Profile updates
- `PrivacySettingsSchema` - Privacy settings
- `UpdatePrivacySettingsSchema` - Privacy updates
- `PasswordChangeSchema` - Password changes
- `PasswordResetSchema` - Password reset
- `EmailVerificationSchema` - Email verification
- `UsernameCheckSchema` - Username availability

### Project Schemas

- `CreateProjectSchema` - Creating projects
- `UpdateProjectSchema` - Updating projects
- `ProjectFiltersSchema` - Query filters

### Group Schemas

- `CreateGroupSchema` - Creating groups
- `UpdateGroupSchema` - Updating groups
- `GroupMemberSchema` - Member operations
- `GroupFiltersSchema` - Query filters

## Error Handling Best Practices

### 1. Field-Level Errors

Map validation errors to specific form fields:

```tsx
const result = validate(schema, data);
if (!result.success) {
  const newErrors = {};
  result.errors.forEach(error => {
    if (error.path) {
      newErrors[error.path] = error.message;
    }
  });
  setErrors(newErrors);
}
```

### 2. Form-Level Errors

Show generic errors at the form level:

```tsx
{
  submitError && (
    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
      {submitError}
    </div>
  );
}
```

### 3. API Error Responses

Return consistent error structures:

```typescript
// Validation errors (400)
{
  error: 'Validation failed',
  message: 'Formatted error message',
  details: [
    { path: 'email', message: 'Email is invalid' },
    { path: 'password', message: 'Password too short' }
  ]
}

// Server errors (500)
{
  error: 'Internal server error',
  message: 'Failed to create resource'
}
```

## Firestore Integration

Always prepare data before writing to Firestore:

```typescript
import { prepareForFirestore } from '@/lib/validation';

const validatedData = validateOrThrow(CreateSessionSchema, data);

const firestoreData = prepareForFirestore({
  ...validatedData,
  userId: currentUser.uid,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Safe to write - no undefined values
await db.collection('sessions').add(firestoreData);
```

## TypeScript Types

All schemas export input and output types:

```typescript
import type {
  CreateSessionInput,   // Before validation
  CreateSessionData,    // After validation
  UpdateProfileInput,
  UpdateProfileData,
} from '@/lib/validation';

// Use Input types for form data
const formData: CreateSessionInput = { ... };

// Use Data types for validated data
const handleSubmit = (data: CreateSessionData) => { ... };
```

## Troubleshooting

### Issue: Validation passes but Firestore rejects

**Solution:** Use `prepareForFirestore()` to strip undefined values:

```typescript
const cleaned = prepareForFirestore(validatedData);
await db.collection('sessions').add(cleaned);
```

### Issue: Nested errors not showing

**Solution:** Check for nested paths in errors:

```typescript
result.errors.forEach(error => {
  // error.path might be "socialLinks.twitter"
  if (error.path) {
    setErrors(prev => ({ ...prev, [error.path]: error.message }));
  }
});
```

### Issue: Optional fields causing validation errors

**Solution:** Only include fields with values:

```typescript
const dataToValidate = {};
if (value) dataToValidate.field = value;
```

### Issue: Date validation failing

**Solution:** Transform strings to Date objects:

```typescript
// The schema handles this automatically:
startTime: v.union([
  v.date(),
  v.pipe(
    v.string(),
    v.transform(str => new Date(str))
  ),
]);
```

### Issue: Form resets too early

**Solution:** Reset in try-finally block:

```typescript
try {
  await submitForm();
  setSuccess(true);
  // Only reset on success
  resetForm();
} catch (error) {
  setError(error.message);
} finally {
  setIsSubmitting(false);
}
```

## Copy-Paste Snippets

### Quick Form Setup

```tsx
'use client';

import { useState } from 'react';
import { validate, SomeSchema } from '@/lib/validation';

export function MyForm() {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
    if (submitError) setSubmitError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setErrors({});
    setSubmitError('');

    const result = validate(SomeSchema, formData);
    if (!result.success) {
      const newErrors = {};
      result.errors.forEach(err => {
        if (err.path) newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit validated data
      await submitData(result.data);
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return <form onSubmit={handleSubmit}>{/* fields */}</form>;
}
```

### Quick API Route Setup

```typescript
import { NextRequest, NextResponse } from 'next/server';
import {
  validateOrThrow,
  isValidationError,
  formatValidationError,
} from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = validateOrThrow(SomeSchema, body);

    // Process data...

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isValidationError(error)) {
      return NextResponse.json(
        { error: formatValidationError(error) },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Further Reading

- [Valibot Documentation](https://valibot.dev/)
- [Validation Schema Files](../schemas/)
- [Validation Utilities](../utils/)
- [Project Architecture](../../../../docs/architecture/)
