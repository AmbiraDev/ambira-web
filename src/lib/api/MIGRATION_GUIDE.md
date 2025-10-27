# Firebase API Refactoring - Migration Guide

## Overview

The monolithic `src/lib/firebaseApi.ts` file (7846 lines) has been refactored into domain-specific modules for better maintainability, testability, and developer experience.

## Current Status

### ✅ Phase 1: Foundation (Complete)

**Completed Modules:**
1. `src/lib/api/shared/utils.ts` - Common utilities (timestamp conversion, data sanitization)
2. `src/lib/api/auth/index.ts` - Authentication operations (login, signup, OAuth)
3. `src/lib/api/social/helpers.ts` - Social graph management (follow/unfollow, user fetching)
4. `src/lib/api/index.ts` - Backward compatibility layer
5. `src/lib/api/README.md` - Comprehensive documentation

**What Works:**
- All existing code continues to work unchanged
- New auth module can be imported directly: `import { firebaseAuthApi } from '@/lib/api/auth'`
- Old imports still work: `import { firebaseAuthApi } from '@/lib/firebaseApi'`
- Type checking passes
- No breaking changes

### 🚧 Phase 2: Extract Remaining Modules (In Progress)

**Modules To Extract:**

| Module | Lines | Priority | Status |
|--------|-------|----------|--------|
| users/index.ts | 1312 | HIGH | Not Started |
| sessions/index.ts | 917 | HIGH | Not Started |
| projects/index.ts | 152 | MEDIUM | Not Started |
| challenges/index.ts | 837 | MEDIUM | Not Started |
| social/comments.ts | 1426 | MEDIUM | Not Started |
| sessions/posts.ts | 867 | LOW | Not Started (Legacy) |
| streaks/index.ts | 520 | LOW | Not Started |
| achievements/index.ts | 374 | LOW | Not Started |
| notifications/index.ts | 370 | LOW | Not Started |

## How to Continue the Refactoring

### Step 1: Extract a Module

Pick a module from the table above. We'll use `users/index.ts` as an example:

#### 1.1 Create the module file

```bash
# File: src/lib/api/users/index.ts
```

#### 1.2 Copy the module code

From `src/lib/firebaseApi.ts`, copy lines 1055-2366 (firebaseUserApi section)

#### 1.3 Add proper imports

```typescript
import {
  collection,
  doc,
  getDoc,
  getDocs,
  // ... other Firestore imports needed
} from 'firebase/firestore';

import { db, auth, storage } from '@/lib/firebase';
import { handleError, ErrorSeverity } from '@/lib/errorHandler';
import { checkRateLimit } from '@/lib/rateLimit';

// Import from our new shared modules
import {
  convertTimestamp,
  removeUndefinedFields,
} from '../shared/utils';

import {
  updateSocialGraph,
  fetchUserDataForSocialContext,
} from '../social/helpers';

// Import types
import type {
  User,
  UserProfile,
  UserStats,
  // ... other types needed
} from '@/types';
```

#### 1.4 Add module documentation

```typescript
/**
 * User API Module
 * Handles user profile operations: CRUD, stats, privacy, search, social graph
 */

export const firebaseUserApi = {
  // ... methods
};
```

#### 1.5 Export from main index

Update `src/lib/api/index.ts`:

```typescript
// Remove from "MODULES STILL IN ORIGINAL FILE" section
- export const firebaseUserApi = originalUserApi;

// Add to "EXTRACTED MODULES" section
+ export { firebaseUserApi } from './users';
```

### Step 2: Validate the Extraction

```bash
# Run type checks
npm run type-check

# Run linter
npm run lint

# Run tests (if they exist)
npm test
```

### Step 3: Update Imports (Optional but Recommended)

Find and update imports in the codebase:

```bash
# Find all uses of the module
grep -r "firebaseUserApi" src/

# Update imports from:
import { firebaseUserApi } from '@/lib/firebaseApi'

# To:
import { firebaseUserApi } from '@/lib/api/users'
```

### Step 4: Test the Application

```bash
# Start dev server
npm run dev

# Test the affected features:
# - For users module: profile viewing, editing, search, follow/unfollow
# - For sessions module: session creation, editing, feed
# - For projects module: project CRUD operations
# etc.
```

### Step 5: Commit Your Changes

```bash
git add src/lib/api/
git commit -m "refactor: extract [module-name] from firebaseApi

- Extract [module-name] API (XXX lines) to src/lib/api/[module]/
- Maintain backward compatibility through index.ts
- Add comprehensive module documentation
- All type checks pass
- No breaking changes

Part of epic to refactor monolithic firebaseApi.ts (7846 lines) into
domain-specific modules for better maintainability and testability.

Related: #[issue-number]"
```

## Module Extraction Template

Use this template when extracting a new module:

```typescript
/**
 * [Module Name] API Module
 * [Brief description of what this module handles]
 */

// ============================================================================
// IMPORTS
// ============================================================================

// Firebase imports
import {
  collection,
  doc,
  getDoc,
  // ... add as needed
} from 'firebase/firestore';

// Local Firebase config
import { db, auth, storage } from '@/lib/firebase';

// Error handling
import { handleError, ErrorSeverity } from '@/lib/errorHandler';
import { checkRateLimit } from '@/lib/rateLimit';

// Shared utilities
import {
  convertTimestamp,
  convertToTimestamp,
  removeUndefinedFields,
} from '../shared/utils';

// Other module dependencies (if any)
// import { updateSocialGraph } from '../social/helpers';

// Types
import type {
  // Add all needed types from @/types
} from '@/types';

// ============================================================================
// PRIVATE HELPERS (if any)
// ============================================================================

/**
 * Private helper functions used only within this module
 */

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * [Module Name] API
 * All [module-name]-related operations
 */
export const firebase[ModuleName]Api = {
  /**
   * [Method description]
   * @param [param-name] - [param description]
   * @returns [return description]
   */
  methodName: async (params: Type): Promise<ReturnType> => {
    try {
      // Implementation from original file
      // ...
    } catch (error) {
      const apiError = handleError(error, '[Operation name]', {
        defaultMessage: '[Error message]',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // ... more methods
};

// ============================================================================
// TYPE EXPORTS (if module defines its own types)
// ============================================================================

// Export any module-specific types here
```

## Testing Checklist

After extracting a module, verify:

- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] All imports are resolved correctly
- [ ] Module exports are correct
- [ ] Backward compatibility maintained (old imports still work)
- [ ] Application runs without runtime errors (`npm run dev`)
- [ ] Manual testing of module features passes
- [ ] No console errors in browser
- [ ] Git commit message follows convention

## Common Issues and Solutions

### Issue 1: Missing Imports

**Error:**
```
Cannot find name 'convertTimestamp'
```

**Solution:**
Add the import from shared utils:
```typescript
import { convertTimestamp } from '../shared/utils';
```

### Issue 2: Circular Dependencies

**Error:**
```
Module has circular dependencies
```

**Solution:**
- Move shared code to `shared/utils.ts`
- Restructure dependencies to be hierarchical
- Consider if module boundaries need adjustment

### Issue 3: Type Import Errors

**Error:**
```
Cannot find type 'UserProfile'
```

**Solution:**
Import from types file:
```typescript
import type { UserProfile } from '@/types';
```

### Issue 4: Firebase Not Initialized

**Error:**
```
Firebase app not initialized
```

**Solution:**
Ensure you're importing from the correct config:
```typescript
import { db, auth, storage } from '@/lib/firebase';
// NOT from 'firebase/app' directly
```

## Best Practices

### 1. Module Size
- **Ideal:** 200-400 lines
- **Acceptable:** 400-600 lines
- **Too Large:** >600 lines (consider splitting further)

### 2. Naming Conventions
- **Modules:** `firebase[Domain]Api` (e.g., `firebaseUserApi`)
- **Files:** `src/lib/api/[domain]/index.ts`
- **Helper Files:** `src/lib/api/[domain]/helpers.ts` or specific names

### 3. Documentation
- Add JSDoc comments for all public methods
- Document parameters and return types
- Include usage examples for complex operations
- Note any breaking changes or deprecations

### 4. Error Handling
- Always use `handleError()` from `@/lib/errorHandler`
- Provide meaningful error messages
- Set appropriate error severity
- Use rate limiting for sensitive operations

### 5. Dependencies
- Keep modules loosely coupled
- Depend on shared utilities, not other domain modules
- If cross-domain dependencies exist, consider refactoring

## Progress Tracking

Update this checklist as modules are extracted:

- [x] shared/utils.ts
- [x] auth/index.ts
- [x] social/helpers.ts
- [ ] users/index.ts
- [ ] projects/index.ts
- [ ] sessions/index.ts
- [ ] sessions/posts.ts (legacy)
- [ ] social/comments.ts
- [ ] challenges/index.ts
- [ ] streaks/index.ts
- [ ] achievements/index.ts
- [ ] notifications/index.ts

## Timeline

**Estimated Effort:** 2-3 days for one developer

- **Phase 1:** Foundation (✅ Complete) - 2 hours
- **Phase 2:** Extract high-priority modules (users, sessions, projects) - 4 hours
- **Phase 3:** Extract medium-priority modules (comments, challenges) - 3 hours
- **Phase 4:** Extract low-priority modules (streaks, achievements, notifications) - 2 hours
- **Phase 5:** Update imports across codebase - 2 hours
- **Phase 6:** Testing and validation - 2 hours
- **Phase 7:** Documentation and cleanup - 1 hour

## Questions or Help Needed?

If you need assistance:
1. Check this migration guide
2. Review `src/lib/api/README.md` for module structure
3. Look at completed modules (auth, social helpers) as examples
4. Check git history for original code: `git log -p src/lib/firebaseApi.ts`
5. Ask team members or create a GitHub issue

## Success Criteria

The refactoring is complete when:
- [ ] All modules extracted from firebaseApi.ts
- [ ] All imports updated to use new module paths
- [ ] Type checks pass: `npm run type-check`
- [ ] Linter passes: `npm run lint`
- [ ] All tests pass: `npm test`
- [ ] Application runs without errors: `npm run dev`
- [ ] Manual testing of all features passes
- [ ] Documentation is complete
- [ ] Old firebaseApi.ts file is removed
- [ ] Backward compatibility layer is removed from index.ts

---

**Last Updated:** 2025-10-25
**Status:** Phase 1 Complete, Phase 2 In Progress
**Maintainer:** Claude Code Refactoring Team
