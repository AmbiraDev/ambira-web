# Firebase API Modules - Quick Start

## TL;DR

The massive `firebaseApi.ts` file is being split into focused modules. **Your existing code still works!**

## Import Patterns

### ✅ Both patterns work (backward compatible):

```typescript
// OLD (still works)
import { firebaseAuthApi } from '@/lib/firebaseApi';

// NEW (preferred)
import { firebaseAuthApi } from '@/lib/api/auth';
```

## Available Modules

### ✅ Extracted (Use new paths)

```typescript
// Authentication
import { firebaseAuthApi } from '@/lib/api/auth';

// Shared utilities
import {
  convertTimestamp,
  removeUndefinedFields
} from '@/lib/api/shared/utils';

// Social helpers
import {
  updateSocialGraph,
  fetchUserDataForSocialContext
} from '@/lib/api/social/helpers';
```

### 🚧 In Progress (Use old paths for now)

```typescript
// These still use the original file
import {
  firebaseUserApi,
  firebaseSessionApi,
  firebaseProjectApi,
  firebaseCommentApi,
  firebaseChallengeApi,
  firebaseStreakApi,
  firebaseAchievementApi,
  firebaseNotificationApi,
} from '@/lib/firebaseApi';
```

## Module Map

| Feature | Module Path | Status |
|---------|-------------|--------|
| Login/Signup/OAuth | `@/lib/api/auth` | ✅ Complete |
| User Profiles | `@/lib/firebaseApi` | 🚧 In Progress |
| Sessions | `@/lib/firebaseApi` | 🚧 In Progress |
| Projects | `@/lib/firebaseApi` | 🚧 In Progress |
| Comments | `@/lib/firebaseApi` | 🚧 In Progress |
| Challenges | `@/lib/firebaseApi` | 🚧 In Progress |
| Social (follows) | `@/lib/api/social/helpers` | ✅ Complete |
| Utilities | `@/lib/api/shared/utils` | ✅ Complete |

## Example Migration

### Before
```typescript
import { firebaseAuthApi, firebaseUserApi } from '@/lib/firebaseApi';

// Use the APIs
await firebaseAuthApi.login({ email, password });
const profile = await firebaseUserApi.getUserProfile(username);
```

### After (Gradually)
```typescript
// Already extracted - use new path
import { firebaseAuthApi } from '@/lib/api/auth';

// Not yet extracted - use old path
import { firebaseUserApi } from '@/lib/firebaseApi';

// Use the APIs (no changes)
await firebaseAuthApi.login({ email, password });
const profile = await firebaseUserApi.getUserProfile(username);
```

## FAQs

**Q: Do I need to change my code?**
A: No! Backward compatibility is maintained. Old imports still work.

**Q: Should I use new or old import paths?**
A: For extracted modules (auth, social helpers), use new paths. For others, use old paths until they're extracted.

**Q: Will this break my code?**
A: No. We've ensured 100% backward compatibility. Type checks pass.

**Q: How do I know when a module is extracted?**
A: Check the table above or look for updates in `src/lib/api/README.md`.

**Q: Can I help extract modules?**
A: Yes! See `MIGRATION_GUIDE.md` for step-by-step instructions.

**Q: What if I find a bug?**
A: Report it immediately. Refactoring shouldn't introduce bugs.

## For New Features

When adding new functionality:

1. **Check if module exists** in `src/lib/api/[domain]/`
2. **If yes:** Add to the module
3. **If no:** Add to `src/lib/firebaseApi.ts` for now

Example:
```typescript
// Auth features -> add to src/lib/api/auth/index.ts
export const firebaseAuthApi = {
  // ... existing methods
  newAuthMethod: async () => { /* new code */ },
};

// User features -> add to src/lib/firebaseApi.ts (for now)
// Will be moved when users module is extracted
```

## Need Help?

1. **Quick questions:** Check this file
2. **How to extract modules:** See `MIGRATION_GUIDE.md`
3. **Full documentation:** See `README.md`
4. **Overall status:** See `REFACTORING_SUMMARY.md`

## Status Dashboard

```
Progress: ███████░░░░░░░░░░░░░░░░░ 23%

✅ auth/             (461 lines)
✅ social/helpers    (180 lines)
✅ shared/utils      (90 lines)
🚧 users/            (1,312 lines) - Next
🚧 sessions/         (917 lines)
🚧 projects/         (152 lines)
🚧 comments/         (1,426 lines)
🚧 challenges/       (837 lines)
🚧 streaks/          (520 lines)
🚧 achievements/     (374 lines)
🚧 notifications/    (370 lines)
```

Last Updated: 2025-10-25
