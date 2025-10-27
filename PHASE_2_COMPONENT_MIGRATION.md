# Phase 2: Component Migration Plan

**Status**: Ready to Begin
**Goal**: Update all components to use new feature hooks
**Total Files**: 12 components/pages identified

---

## 📋 Migration Checklist

### Priority 1 - Core Feed Components (Highest Impact)

#### 1. Feed.tsx ⭐⭐⭐
**File**: `src/components/Feed.tsx`
**Current Imports**:
- `useFeedSessions`, `useFeedSessionsPaginated` from `@/hooks/useCache`
- `useSupportMutation`, `useDeleteSessionMutation` from `@/hooks/useMutations`

**New Imports**:
- `useFeedInfinite` from `@/features/feed/hooks`
- `useSupportSession`, `useDeleteSession` from `@/features/sessions/hooks`

**Impact**: HIGH - Main feed component used throughout app
**Complexity**: MEDIUM - Infinite scroll + mutations
**Reference**: `Feed.new.tsx` already exists as example!

---

#### 2. CommentList.tsx ⭐⭐⭐
**File**: `src/components/CommentList.tsx`
**Current Imports**:
- `useCommentLikeMutation` from `@/hooks/useMutations`

**New Imports**:
- `useCommentLike` from `@/features/comments/hooks`

**Impact**: HIGH - Used in all comment displays
**Complexity**: LOW - Single mutation replacement

---

#### 3. CommentsModal.tsx ⭐⭐⭐
**File**: `src/components/CommentsModal.tsx`
**Current Imports**:
- `useCommentLikeMutation` from `@/hooks/useMutations`

**New Imports**:
- `useCommentLike` from `@/features/comments/hooks`
- Possibly `useSessionComments`, `useCreateComment` if not already using them

**Impact**: HIGH - Main comments interface
**Complexity**: MEDIUM - Multiple comment operations

---

#### 4. TopComments.tsx ⭐⭐
**File**: `src/components/TopComments.tsx`
**Current Imports**:
- `useCommentLikeMutation` from `@/hooks/useMutations`

**New Imports**:
- `useCommentLike` from `@/features/comments/hooks`

**Impact**: MEDIUM - Top comments widget
**Complexity**: LOW - Single mutation

---

### Priority 2 - Feature Pages

#### 5. app/challenges/page.tsx ⭐⭐
**File**: `src/app/challenges/page.tsx`
**Current Imports**:
- `useChallenges`, `useChallengesProgress` from `@/hooks/useCache`

**New Imports**:
- `useChallenges`, `useChallengeProgress` from `@/features/challenges/hooks`

**Impact**: MEDIUM - Challenges feature page
**Complexity**: LOW - Query hook replacement

---

#### 6. app/groups/page.tsx ⭐⭐
**File**: `src/app/groups/page.tsx`
**Current Imports**:
- `useUserGroups`, `useGroups`, `useGroupSearch` from `@/hooks/useCache`

**New Imports**:
- `useUserGroups`, `usePublicGroups` from `@/features/groups/hooks`
- Note: `useGroupSearch` may need to be implemented or use client-side filtering

**Impact**: MEDIUM - Groups listing page
**Complexity**: MEDIUM - Multiple queries + search

---

#### 7. app/profile/[username]/page-content.tsx ⭐⭐
**File**: `src/app/profile/[username]/page-content.tsx`
**Current Imports**:
- Multiple imports from `@/hooks/useCache`

**New Imports**:
- `useProfileByUsername`, `useProfileStats`, etc. from `@/features/profile/hooks`

**Impact**: MEDIUM - Profile page content
**Complexity**: MEDIUM - Multiple profile queries

---

#### 8. features/profile/components/OwnProfilePageContent.tsx ⭐⭐
**File**: `src/features/profile/components/OwnProfilePageContent.tsx`
**Current Imports**:
- From `@/hooks/useCache`

**New Imports**:
- From `@/features/profile/hooks`

**Impact**: MEDIUM - User's own profile
**Complexity**: MEDIUM - Profile + stats queries

---

#### 9. app/analytics/page.tsx ⭐
**File**: `src/app/analytics/page.tsx`
**Current Imports**:
- `useUserSessions`, `useUserStats` from `@/hooks/useCache`

**New Imports**:
- `useUserSessions` from `@/features/sessions/hooks`
- `useProfileStats` from `@/features/profile/hooks`

**Impact**: LOW - Analytics page
**Complexity**: LOW - Query replacements

---

### Priority 3 - Test Files (Update After Components)

#### 10. __tests__/unit/components/accessibility/keyboard-navigation.test.tsx
**Action**: Update test imports after component migration

#### 11. __tests__/unit/components/analytics/analytics-accessibility.test.tsx
**Action**: Update test imports after component migration

#### 12. hooks/__tests__/useCommentLikeMutation.test.tsx
**Action**: Can be removed after migration (functionality tested in new hooks)

---

## 🎯 Migration Strategy

### Step-by-Step Process

For each component:

1. **Read the component file**
2. **Identify old hook usage**
3. **Map to new hooks**:
   - `useFeedSessions` → `useFeedInfinite` or `useFeed`
   - `useSupportMutation` → `useSupportSession`
   - `useDeleteSessionMutation` → `useDeleteSession`
   - `useCommentLikeMutation` → `useCommentLike`
   - `useChallenges` → `useChallenges` (same name, different path)
4. **Update imports**
5. **Update hook usage** (check parameters)
6. **Test the component** (run dev server, verify functionality)
7. **Move to next component**

### Example Migration

**Before:**
```typescript
import { useFeedSessions } from '@/hooks/useCache';
import { useSupportMutation } from '@/hooks/useMutations';

function Feed() {
  const { data: sessions } = useFeedSessions(20);
  const supportMutation = useSupportMutation();
  
  const handleSupport = (sessionId: string) => {
    supportMutation.mutate({ sessionId });
  };
}
```

**After:**
```typescript
import { useFeedInfinite } from '@/features/feed/hooks';
import { useSupportSession } from '@/features/sessions/hooks';

function Feed() {
  const { data, fetchNextPage } = useFeedInfinite(userId, filters);
  const sessions = data?.pages.flatMap(p => p.sessions) || [];
  const supportMutation = useSupportSession(userId);
  
  const handleSupport = (sessionId: string) => {
    supportMutation.mutate({ sessionId, action: 'support' });
  };
}
```

---

## 📊 Migration Order

### Week 1: Core Components
1. ✅ CommentList.tsx (easiest - single mutation)
2. ✅ TopComments.tsx (easiest - single mutation)
3. ✅ CommentsModal.tsx (medium - multiple operations)
4. ✅ Feed.tsx (use Feed.new.tsx as reference!)

### Week 2: Feature Pages
5. ✅ app/challenges/page.tsx
6. ✅ app/groups/page.tsx
7. ✅ app/analytics/page.tsx

### Week 3: Profile Pages
8. ✅ app/profile/[username]/page-content.tsx
9. ✅ features/profile/components/OwnProfilePageContent.tsx

### Week 4: Testing & Cleanup
10. ✅ Update all test files
11. ✅ Run full test suite
12. ✅ Enable ESLint rules
13. ✅ Remove old hook files

---

## ⚠️ Important Notes

### Feed.tsx Migration
- **Use Feed.new.tsx as reference!** It's already been migrated
- Replace Feed.tsx with Feed.new.tsx content
- Test thoroughly - it's the most used component

### useCommentLikeMutation → useCommentLike
- New hook takes `sessionId` parameter: `useCommentLike(sessionId)`
- Mutation signature: `mutate({ commentId, action: 'like' | 'unlike' })`
- Includes optimistic updates automatically

### useSupportMutation → useSupportSession
- New hook needs `currentUserId`: `useSupportSession(userId)`
- Mutation signature: `mutate({ sessionId, action: 'support' | 'unsupport' })`
- Updates all feed caches automatically

### Missing Hooks
If you encounter a hook that doesn't have a new equivalent:
1. Check the feature's README for alternatives
2. Look in the feature's hooks/index.ts for all exports
3. May need to implement (rare - most are done)

---

## ✅ Success Criteria

For each migrated component:
- [ ] No imports from `@/hooks/useCache`
- [ ] No imports from `@/hooks/useMutations`
- [ ] All functionality works as before
- [ ] No console errors
- [ ] Optimistic updates work (if applicable)
- [ ] Tests pass (if they exist)

---

## 🚀 Quick Start

To begin migration:

```bash
# 1. Start with CommentList.tsx (easiest)
# Open file and update imports

# 2. Run dev server to test
npm run dev

# 3. Verify functionality works

# 4. Move to next component

# 5. After all components:
# Enable ESLint rules in .eslintrc.js
# Remove old hook files
# Run full test suite
```

---

## 📚 Reference Documents

- **Architecture**: `docs/architecture/CACHING_STRATEGY.md`
- **Examples**: `docs/architecture/EXAMPLES.md`
- **Migration Guide**: `docs/architecture/MIGRATION_GUIDE.md`
- **Feature READMEs**: `src/features/{feature}/README.md`

---

**Ready to begin!** Start with CommentList.tsx for a quick win! 🎯
