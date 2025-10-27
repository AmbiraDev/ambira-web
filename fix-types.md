# TypeScript Fixes Required

## Summary

Total errors: ~260
Main categories:

1. Missing properties on types (isFollowing, weeklyHours, etc.)
2. Wrong mutation argument types
3. Possibly undefined access
4. Wrong data types (string vs User object)
5. Missing properties on interfaces

## Critical Fixes Needed

### 1. Profile Page (page-content.tsx)

- Use `useIsFollowing` hook instead of `profile.isFollowing`
- Fix mutation calls: pass `{ currentUserId, targetUserId }` instead of just ID
- Fix followers/following: they return `string[]` not `User[]`
- Stats access: use properties that actually exist

### 2. Challenge Type

- Add `isParticipating?: boolean`
- Add `userProgress?: number`

### 3. ProfileStats Type

- Add `weeklyHours?: number`
- Add `sessionsThisWeek?: number`

### 4. User Type

- Consider if `isFollowing` should be added or if separate hook is correct approach

### 5. Timer Types

- ActiveTimer needs `isPaused?: boolean`
- Fix type mismatches

### 6. Groups API

- Many files reference `api.group` which doesn't exist
- Should use group hooks instead

### 7. Feed Filters

- Type incompatibility between component and service
- Need to align types

### 8. Mutation contexts

- Many mutations have `{}` context type issues
- Need proper typing for optimistic updates context
