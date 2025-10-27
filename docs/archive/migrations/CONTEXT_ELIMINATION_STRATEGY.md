# Global Context Elimination Strategy

## Executive Summary

This document provides a comprehensive architectural assessment for eliminating or scoping down global singleton Context providers in the Ambira application. The analysis shows a **hybrid migration pattern** where:

1. **Some contexts are already partially migrated** (Timer, Activities, Notifications)
2. **Critical architectural violations exist** (global contexts still widely consumed)
3. **Clear migration path exists** following established React Query patterns

**Current State**: 5 global singleton providers wrapping the entire application
**Target State**: 0 global providers, all state managed via React Query at feature boundaries
**Risk Level**: Medium (requires careful phased approach)
**Estimated Impact**: High performance gains, better testability, clearer architecture

---

## Table of Contents

1. [Current Architecture Analysis](#current-architecture-analysis)
2. [Provider Inventory & Dependencies](#provider-inventory--dependencies)
3. [Consumption Patterns](#consumption-patterns)
4. [Migration Opportunities](#migration-opportunities)
5. [Phased Migration Strategy](#phased-migration-strategy)
6. [Technical Implementation Guide](#technical-implementation-guide)
7. [Risk Assessment & Mitigation](#risk-assessment--mitigation)
8. [Success Metrics](#success-metrics)

---

## Current Architecture Analysis

### Provider Hierarchy (src/app/layout.tsx)

```
ErrorBoundary
  └─ PWAInstaller
      └─ QueryProvider (React Query) ✅ KEEP - Required infrastructure
          └─ AuthProvider ❌ ELIMINATE
              └─ ToastProvider ⚠️ SCOPE DOWN
                  └─ TimerProvider ❌ ELIMINATE
                      └─ {children}
```

### Architectural Impact Assessment

#### High Impact (Architectural Violations)

- **AuthProvider**: 199+ usages across 74 files
  - Violates clean architecture boundaries
  - Creates tight coupling across all layers
  - Blocks proper feature isolation

- **TimerProvider**: 122+ usages across 47 components
  - Duplicates React Query functionality (already has `useTimerQuery.ts`)
  - Mixes client-state with server-state
  - Prevents proper testing isolation

#### Medium Impact (Partially Migrated)

- **ActivitiesContext**: Deprecated with warning, 122+ usages
  - Migration path exists (`useActivitiesQuery.ts`)
  - Still consumed by 47+ components
  - Needs systematic component migration

- **NotificationsContext**: Deprecated, migration started
  - New hooks exist (`useNotifications.ts`)
  - Reduced provider to passthrough (good pattern)
  - Cleanup phase needed

#### Low Impact (Simple State)

- **ToastContext**: UI-only concern, 0 persistence
  - Could remain as scoped provider
  - Alternative: Use React Query mutation callbacks
  - Consider: shadcn/ui Sonner toast library

---

## Provider Inventory & Dependencies

### 1. AuthProvider (src/contexts/AuthContext.tsx)

**Responsibilities:**

- Firebase Auth state listener
- User authentication state (`user`, `isAuthenticated`, `isLoading`)
- Auth operations: `login`, `signup`, `signInWithGoogle`, `logout`
- Google OAuth redirect handling
- Router navigation after auth changes

**Dependencies:**

```typescript
import { useRouter } from 'next/navigation';
import { firebaseAuthApi } from '@/lib/firebaseApi';
```

**State Management:**

- `user: AuthUser | null` - Current authenticated user
- `isLoading: boolean` - Auth initialization state
- `redirectHandledRef` - Tracks OAuth redirects

**Consumed By:**

- All route pages requiring authentication (23 files in src/app)
- Most components (47 files in src/components)
- All feature modules (4 files in src/features)
- Other contexts (TimerContext, ActivitiesContext)

**Migration Complexity:** 🔴 HIGH

- Central dependency for all authenticated features
- Manages real-time Firebase Auth listener
- Requires careful session state management
- Navigation coupling needs refactoring

**Migration Approach:** Server-side authentication + client-side React Query

```typescript
// PROPOSED: src/features/auth/hooks/useAuth.ts
export function useAuth() {
  return useQuery({
    queryKey: ['auth', 'session'],
    queryFn: () => authService.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

export function useAuthSession() {
  // Subscribe to Firebase Auth state changes
  const [authState, setAuthState] = useState<AuthUser | null>(null);

  useEffect(() => {
    const unsubscribe = firebaseAuthApi.onAuthStateChanged(setAuthState);
    return unsubscribe;
  }, []);

  return authState;
}
```

---

### 2. TimerProvider (src/contexts/TimerContext.tsx)

**Responsibilities:**

- Timer client state (isRunning, startTime, pausedDuration)
- Timer operations: start, pause, resume, finish, reset
- Auto-save to Firebase every 30 seconds
- Cross-tab synchronization via localStorage events
- Network connectivity monitoring
- Elapsed time calculations

**Dependencies:**

```typescript
import { useAuth } from './AuthContext' // ❌ Context dependency
import { useActiveSession, useSaveActiveSession, ... } from '@/hooks/useTimerQuery' // ✅ Already using RQ
import { useActivities } from '@/hooks/useActivitiesQuery' // ✅ Already using RQ
```

**State Management:**

```typescript
timerState: {
  isRunning: boolean;
  startTime: Date | null;
  pausedDuration: number;
  currentProject: Project | null;
  activeTimerId: string | null;
  isConnected: boolean;
  lastAutoSave: Date | null;
}
```

**Consumed By:**

- Header components (timer display)
- Timer page components
- Feed layout (shows active timer bar)
- 47+ component files

**Migration Complexity:** 🟡 MEDIUM

- **Already has React Query hooks** (`useTimerQuery.ts`)
- Main concern: Client-side timer state (running/paused)
- Cross-tab sync can use React Query's built-in refetch
- Auto-save can use React Query mutations

**Migration Approach:** Split into client-state hook + React Query

```typescript
// CLIENT STATE: src/features/timer/hooks/useTimerState.ts
export function useTimerState() {
  const [timerState, setTimerState] = useState<LocalTimerState>({
    isRunning: false,
    startTime: null,
    pausedDuration: 0,
  });

  return { timerState, setTimerState };
}

// SERVER STATE: src/features/timer/hooks/useTimer.ts (already exists!)
export function useActiveTimer() {
  return useQuery({
    queryKey: ['timer', 'active'],
    queryFn: () => timerService.getActiveSession(),
    refetchInterval: 10000, // Cross-tab sync
  });
}
```

**Key Insight:** 🎯 **50% of TimerContext is already using React Query** - This is low-hanging fruit!

---

### 3. ActivitiesContext (src/contexts/ActivitiesContext.tsx)

**Status:** ⚠️ DEPRECATED (with console warning)

**Responsibilities:**

- Fetch user activities/projects
- CRUD operations: create, update, delete, archive, restore
- Activity statistics calculation
- Icon migration (legacy Lucide → Iconify)

**Dependencies:**

```typescript
import { useAuth } from './AuthContext'; // ❌ Context dependency
import { firebaseActivityApi } from '@/lib/firebaseApi';
```

**Migration Status:** 🟢 95% Complete

- ✅ `src/hooks/useActivitiesQuery.ts` exists with full feature parity
- ✅ Deprecation warning in place
- ✅ Backward compatibility aliases exported
- ❌ Still consumed by 47+ components (need to update imports)

**Migration Approach:** Import replacement campaign

```bash
# Find and replace across codebase
import { useActivities } from '@/contexts/ActivitiesContext'
# ↓ Replace with ↓
import { useActivities } from '@/hooks/useActivitiesQuery'
```

**Complexity:** 🟢 LOW - Just import updates

---

### 4. NotificationsContext (src/contexts/NotificationsContext.tsx)

**Status:** ⚠️ DEPRECATED (with console warning)

**Responsibilities:**

- Fetch user notifications
- Unread count tracking
- Mark as read operations
- Delete/clear operations

**Dependencies:**

```typescript
import { useAuth } from './AuthContext'; // ❌ Context dependency
```

**Migration Status:** 🟢 100% Complete

- ✅ `src/hooks/useNotifications.ts` exists
- ✅ Provider reduced to passthrough (just renders children)
- ✅ Deprecation warnings in place
- ❌ Need to remove provider from layout.tsx
- ❌ Need to update component imports

**Migration Approach:** Remove provider entirely

```typescript
// layout.tsx - REMOVE THIS:
<NotificationsProvider>
  {children}
</NotificationsProvider>

// Components - UPDATE IMPORTS:
import { useNotifications } from '@/contexts/NotificationsContext'
// ↓ Replace with ↓
import { useNotifications } from '@/hooks/useNotifications'
```

**Complexity:** 🟢 LOW - Provider is already a no-op

---

### 5. ToastProvider (src/contexts/ToastContext.tsx)

**Responsibilities:**

- UI-only toast notifications
- No persistence or server state
- Simple show/hide with 5s timeout

**Dependencies:** None

**State Management:**

```typescript
toasts: Toast[] = [{ id, message, type }]
```

**Migration Complexity:** 🟢 LOW

- Pure UI concern (no server state)
- Could remain as scoped context
- Alternative: Use shadcn/ui Sonner library
- Or: Use React Query mutation callbacks

**Recommendation:** ⚠️ **KEEP for now** but scope to app shell

- Not an architectural violation
- No server state mixing
- Consider future migration to Sonner

---

## Consumption Patterns

### Usage Statistics

| Context              | Components | App Pages | Features | Total Files |
| -------------------- | ---------- | --------- | -------- | ----------- |
| AuthContext          | 47         | 23        | 4        | **74**      |
| TimerContext         | 47         | -         | -        | **47**      |
| ActivitiesContext    | 47         | -         | -        | **47**      |
| NotificationsContext | ~10        | ~3        | -        | **~13**     |
| ToastContext         | ~30        | ~10       | -        | **~40**     |

### Cross-Layer Violations

**Components calling useAuth (47 files):**

```
src/components/ActivityCard.tsx
src/components/ActivityList.tsx
src/components/CommentList.tsx
src/components/CreateProjectModal.tsx
src/components/EditProfileModal.tsx
src/components/GroupChallenges.tsx
src/components/HeaderComponent.tsx
src/components/SessionTimerEnhanced.tsx
... 39 more files
```

**App routes calling useAuth (23 files):**

```
src/app/analytics/page.tsx
src/app/activities/page.tsx
src/app/sessions/[id]/page.tsx
src/app/profile/[username]/page-content.tsx
src/app/feed/page-content.tsx
... 18 more files
```

**Feature modules calling useAuth (4 files):**

```
src/features/feed/components/FeedPageContent.tsx
src/features/settings/components/SettingsPageContent.tsx
src/features/groups/components/GroupDetailPage.tsx
src/features/profile/components/OwnProfilePageContent.tsx
```

### Anti-Pattern Identification

#### ❌ Violation 1: Context Nesting

```typescript
// TimerContext depends on AuthContext
export const TimerProvider = ({ children }) => {
  const { user } = useAuth(); // ❌ Context calling context
  // ...
};
```

#### ❌ Violation 2: Components Bypassing Feature Boundaries

```typescript
// src/components/SessionCard.tsx
const { user } = useAuth(); // ❌ Should use feature hook
const { timerState } = useTimer(); // ❌ Should use feature hook
```

#### ❌ Violation 3: Mixing Server + Client State

```typescript
// TimerContext mixes:
- Server state (active session in Firebase) ✅ Should be React Query
- Client state (isRunning, elapsed time) ❌ Should be local state
```

---

## Migration Opportunities

### Quick Wins (Low Effort, High Impact)

#### 1. NotificationsContext Removal (1-2 hours)

**Effort:** 🟢 LOW | **Impact:** 🟢 HIGH | **Risk:** 🟢 LOW

**Steps:**

1. ✅ Provider already a passthrough
2. Remove `<NotificationsProvider>` from layout.tsx
3. Find/replace imports across codebase (~13 files)
4. Delete `src/contexts/NotificationsContext.tsx`

**Benefits:**

- One less provider in the tree
- Cleaner architecture
- Sets precedent for other migrations

---

#### 2. ActivitiesContext Removal (2-4 hours)

**Effort:** 🟢 LOW | **Impact:** 🟢 HIGH | **Risk:** 🟢 LOW

**Steps:**

1. ✅ React Query hooks exist with full parity
2. Find/replace imports across 47 files
3. Remove `<ActivitiesProvider>` from layout (if exists)
4. Delete `src/contexts/ActivitiesContext.tsx`
5. Update tests

**Benefits:**

- Eliminates duplicate state management
- Leverages React Query caching
- Better performance

---

### Medium Effort Migrations

#### 3. TimerContext → Feature Hook (4-8 hours)

**Effort:** 🟡 MEDIUM | **Impact:** 🟡 HIGH | **Risk:** 🟡 MEDIUM

**Current State:**

- ✅ 50% already using React Query (`useTimerQuery.ts`)
- ❌ Still has wrapper context for convenience API

**Target Architecture:**

```typescript
// src/features/timer/hooks/useTimer.ts
export function useTimerActions() {
  const queryClient = useQueryClient();
  const saveActiveSession = useSaveActiveSession();

  const startTimer = async (projectId: string) => {
    await saveActiveSession.mutateAsync({
      startTime: new Date(),
      projectId,
      isPaused: false,
    });
  };

  return { startTimer, pauseTimer, resumeTimer, finishTimer };
}

// src/features/timer/hooks/useTimerState.ts (client state)
export function useTimerState() {
  const { data: activeSession } = useActiveSession();
  const [localState, setLocalState] = useState({
    isRunning: false,
    elapsedSeconds: 0,
  });

  // Calculate elapsed time from activeSession
  useEffect(() => {
    // Timer tick logic
  }, [activeSession]);

  return { timerState: localState, isRunning: localState.isRunning };
}
```

**Migration Steps:**

1. Create `src/features/timer/hooks/useTimerActions.ts`
2. Create `src/features/timer/hooks/useTimerState.ts` for client state
3. Migrate components one-by-one to new hooks
4. Remove TimerProvider from layout.tsx
5. Delete context file

**Benefits:**

- Clear server/client state separation
- Better testability
- Eliminates auto-save complexity (React Query handles it)

---

### High Effort Migrations

#### 4. AuthContext → Feature Hook (16-24 hours)

**Effort:** 🔴 HIGH | **Impact:** 🔴 CRITICAL | **Risk:** 🔴 HIGH

**Challenges:**

- Used in 74 files across all layers
- Manages Firebase Auth listener lifecycle
- Handles OAuth redirect flows
- Navigation coupling (useRouter)
- Session management

**Recommended Approach:** Server Components + Client Session Hook

**Phase 1: Create Auth Service Layer**

```typescript
// src/features/auth/services/AuthService.ts
export class AuthService {
  async getCurrentUser(): Promise<AuthUser | null> {
    return firebaseAuthApi.getCurrentUser();
  }

  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const result = await firebaseAuthApi.login(credentials);
    return result.user;
  }

  // ... other methods
}
```

**Phase 2: Create React Query Hooks**

```typescript
// src/features/auth/hooks/useAuth.ts
export function useAuth() {
  return useQuery({
    queryKey: ['auth', 'session'],
    queryFn: () => authService.getCurrentUser(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

// Firebase Auth state subscription (must remain reactive)
export function useAuthListener() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = firebaseAuthApi.onAuthStateChanged(user => {
      queryClient.setQueryData(['auth', 'session'], user);
    });
    return unsubscribe;
  }, [queryClient]);
}
```

**Phase 3: Create Root Auth Initializer**

```typescript
// src/app/auth-initializer.tsx
'use client';

export function AuthInitializer({ children }: { children: ReactNode }) {
  useAuthListener(); // Subscribes to Firebase Auth changes
  return <>{children}</>;
}

// layout.tsx
<QueryProvider>
  <AuthInitializer>
    <ToastProvider>
      {children}
    </ToastProvider>
  </AuthInitializer>
</QueryProvider>
```

**Phase 4: Migrate Components (74 files)**

```typescript
// OLD:
const { user, isAuthenticated, isLoading } = useAuth();

// NEW:
const { data: user, isLoading } = useAuth();
const isAuthenticated = !!user;
```

**Phase 5: Create Auth Mutations**

```typescript
// src/features/auth/hooks/useAuthMutations.ts
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authService.login(credentials),
    onSuccess: user => {
      queryClient.setQueryData(['auth', 'session'], user);
      router.push('/');
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'session'], null);
      router.push('/');
    },
  });
}
```

**Benefits:**

- Eliminates global singleton
- Better separation of concerns
- Testable authentication logic
- Proper cache invalidation
- Server component compatibility

**Risks:**

- High touch count (74 files)
- OAuth redirect flow complexity
- Potential session race conditions
- Router navigation coupling

---

## Phased Migration Strategy

### Overview

```
Phase 1: Quick Wins (1 week)
  └─ Remove deprecated contexts

Phase 2: Timer Migration (1 week)
  └─ Split client/server state

Phase 3: Auth Migration (2-3 weeks)
  └─ High-risk, careful rollout

Phase 4: Cleanup (1 week)
  └─ Remove old code, update docs
```

---

### Phase 1: Quick Wins (1 week, Low Risk)

**Goal:** Remove deprecated contexts, set migration precedent

#### Week 1, Day 1-2: NotificationsContext Removal

- [ ] Remove `<NotificationsProvider>` from layout.tsx
- [ ] Update imports in ~13 files
- [ ] Delete context file
- [ ] Run tests, verify no breakage
- [ ] Commit: "refactor: remove NotificationsContext, use React Query hooks"

#### Week 1, Day 3-5: ActivitiesContext Removal

- [ ] Create migration script for import updates
- [ ] Run automated import replacement across 47 files
- [ ] Manual verification of edge cases
- [ ] Update test mocks
- [ ] Remove provider from layout
- [ ] Delete context file
- [ ] Commit: "refactor: remove ActivitiesContext, migrate to useActivitiesQuery"

**Success Criteria:**

- ✅ 2 fewer providers in layout.tsx
- ✅ All tests passing
- ✅ No performance regressions
- ✅ No user-facing issues

**Rollback Plan:**

- Revert commits (context files still in git history)
- Re-add providers to layout.tsx

---

### Phase 2: Timer Migration (1 week, Medium Risk)

**Goal:** Separate client state from server state, eliminate TimerProvider

#### Week 2, Day 1-2: Create Feature Hooks

- [ ] Create `src/features/timer/hooks/useTimerState.ts`
  - Client-only state (isRunning, elapsed time)
  - No dependencies on contexts
- [ ] Create `src/features/timer/hooks/useTimerActions.ts`
  - Uses existing React Query hooks
  - Wraps `useActiveSession`, `useSaveActiveSession`, etc.
- [ ] Create comprehensive tests for new hooks

#### Week 2, Day 3: Migrate Core Timer Components

- [ ] `src/components/SessionTimerEnhanced.tsx`
- [ ] `src/components/TimerDisplay.tsx`
- [ ] `src/components/TimerControls.tsx`
- [ ] `src/app/timer/page.tsx`

#### Week 2, Day 4: Migrate Header/Navigation

- [ ] `src/components/header/TimerStatus.tsx`
- [ ] `src/components/ActiveTimerBar.tsx`
- [ ] `src/components/BottomNavigation.tsx`

#### Week 2, Day 5: Remove TimerProvider

- [ ] Verify all components migrated
- [ ] Remove from layout.tsx
- [ ] Delete context file
- [ ] Update documentation

**Success Criteria:**

- ✅ Timer functionality identical
- ✅ Cross-tab sync working
- ✅ Auto-save working (via React Query)
- ✅ Performance equivalent or better

**Rollback Plan:**

- Revert to TimerProvider
- Keep new hooks for future retry

---

### Phase 3: Auth Migration (2-3 weeks, High Risk)

**Goal:** Eliminate AuthProvider, move to React Query + Firebase listener

#### Week 3: Preparation & Infrastructure

- [ ] Create `src/features/auth/services/AuthService.ts`
- [ ] Create `src/features/auth/hooks/useAuth.ts` (React Query)
- [ ] Create `src/features/auth/hooks/useAuthListener.ts` (Firebase subscription)
- [ ] Create `src/features/auth/hooks/useAuthMutations.ts`
- [ ] Create `src/app/AuthInitializer.tsx` (root listener)
- [ ] Write comprehensive tests
- [ ] Create migration guide for team

#### Week 4: Component Migration (74 files)

- [ ] **Day 1-2**: Feature modules (4 files)
  - `src/features/feed/components/FeedPageContent.tsx`
  - `src/features/profile/components/OwnProfilePageContent.tsx`
  - `src/features/groups/components/GroupDetailPage.tsx`
  - `src/features/settings/components/SettingsPageContent.tsx`

- [ ] **Day 3-4**: App routes (23 files)
  - Start with low-traffic pages
  - Monitor error rates
  - Deploy incrementally

- [ ] **Day 5**: Critical components (10 high-priority files)
  - `src/components/HeaderComponent.tsx`
  - `src/components/ProtectedRoute.tsx`
  - `src/components/LoginForm.tsx`
  - `src/components/SignupForm.tsx`
  - Monitor closely

#### Week 5: Remaining Components & Cleanup

- [ ] **Day 1-3**: Migrate remaining 37 components
  - Batch by feature area
  - Test thoroughly between batches

- [ ] **Day 4**: Remove AuthProvider
  - Remove from layout.tsx
  - Add AuthInitializer
  - Deploy to staging
  - Monitor error rates

- [ ] **Day 5**: Production rollout
  - Deploy to production
  - Monitor for 24-48 hours
  - Delete AuthContext file after stable

**Success Criteria:**

- ✅ All auth flows working (login, logout, OAuth)
- ✅ Session persistence working
- ✅ Protected routes working
- ✅ No authentication errors
- ✅ Performance equivalent or better

**Rollback Plan:**

- Keep AuthProvider in git history
- Have one-line revert ready: `git revert <commit>`
- Keep feature flag for gradual rollout if needed

---

### Phase 4: Cleanup & Documentation (1 week)

**Goal:** Remove dead code, update docs, enforce patterns

#### Week 6, Day 1-2: Code Cleanup

- [ ] Delete all deprecated context files
- [ ] Remove unused imports
- [ ] Update dependency graphs
- [ ] Clean up test mocks

#### Week 6, Day 3-4: Documentation

- [ ] Update `/docs/architecture/README.md`
- [ ] Update `/docs/architecture/CACHING_STRATEGY.md`
- [ ] Update `CLAUDE.md` with new patterns
- [ ] Create migration retrospective doc

#### Week 6, Day 5: Enforcement

- [ ] Add ESLint rules to prevent context anti-patterns
- [ ] Update code review checklist
- [ ] Create team training materials
- [ ] Celebrate migration completion! 🎉

---

## Technical Implementation Guide

### Pattern 1: Replace Context with React Query Hook

**Before (Context):**

```typescript
// src/contexts/FeatureContext.tsx
export const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export const FeatureProvider = ({ children }) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const result = await firebaseApi.feature.getData();
      setData(result);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <FeatureContext.Provider value={{ data, isLoading }}>
      {children}
    </FeatureContext.Provider>
  );
};

export const useFeature = () => {
  const context = useContext(FeatureContext);
  if (!context) throw new Error('Must be used within FeatureProvider');
  return context;
};
```

**After (React Query):**

```typescript
// src/features/feature/services/FeatureService.ts
export class FeatureService {
  async getData() {
    return featureRepository.findAll();
  }
}

// src/features/feature/hooks/useFeature.ts
import { useQuery } from '@tanstack/react-query';
import { featureService } from '../services/FeatureService';

export function useFeature() {
  return useQuery({
    queryKey: ['feature', 'data'],
    queryFn: () => featureService.getData(),
    staleTime: 5 * 60 * 1000,
  });
}

// Components
import { useFeature } from '@/features/feature/hooks';

function MyComponent() {
  const { data, isLoading } = useFeature(); // Same API!
  // ... rest of component
}
```

**Benefits:**

- Automatic caching
- Built-in refetch logic
- Better TypeScript support
- No provider needed

---

### Pattern 2: Split Server State from Client State

**Before (Mixed State):**

```typescript
// Context managing both server data AND UI state
export const TimerProvider = ({ children }) => {
  const [serverData, setServerData] = useState(null); // Server state
  const [isRunning, setIsRunning] = useState(false);  // Client state
  const [elapsed, setElapsed] = useState(0);          // Derived state

  // Fetching server data
  useEffect(() => {
    fetchActiveSession().then(setServerData);
  }, []);

  // Timer tick
  useEffect(() => {
    const interval = setInterval(() => {
      if (isRunning) setElapsed(e => e + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  return <TimerContext.Provider value={{ serverData, isRunning, elapsed }}>
    {children}
  </TimerContext.Provider>;
};
```

**After (Separated Concerns):**

```typescript
// SERVER STATE: src/features/timer/hooks/useActiveTimer.ts
export function useActiveTimer() {
  return useQuery({
    queryKey: ['timer', 'active'],
    queryFn: () => timerService.getActiveSession(),
    staleTime: 30 * 1000,
    refetchInterval: 10000,
  });
}

// CLIENT STATE: src/features/timer/hooks/useTimerState.ts
export function useTimerState() {
  const { data: activeSession } = useActiveTimer();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Timer tick (client-only)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isRunning) setElapsed(e => e + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  return {
    activeSession, // From server
    isRunning, // Client state
    elapsed, // Derived client state
    setIsRunning,
  };
}
```

**Benefits:**

- Clear separation of concerns
- Server state cached by React Query
- Client state remains local to component tree
- Easier to test
- Better performance

---

### Pattern 3: Auth State with Firebase Listener

**Challenge:** Firebase Auth `onAuthStateChanged` needs to stay reactive

**Solution:** Combine React Query with Firebase subscription

```typescript
// src/features/auth/hooks/useAuth.ts

// 1. React Query hook for auth state
export function useAuth() {
  return useQuery({
    queryKey: ['auth', 'session'],
    queryFn: () => authService.getCurrentUser(),
    staleTime: Infinity, // Managed by Firebase listener
  });
}

// 2. Firebase listener (subscribes to auth changes)
export function useAuthListener() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = firebaseAuthApi.onAuthStateChanged((user) => {
      // Update React Query cache when Firebase auth changes
      queryClient.setQueryData(['auth', 'session'], user);
    });

    return unsubscribe;
  }, [queryClient]);
}

// 3. Root-level initializer (in layout.tsx or app wrapper)
export function AuthInitializer({ children }: { children: ReactNode }) {
  useAuthListener(); // Subscribe once at root
  return <>{children}</>;
}

// 4. Usage in components
function MyComponent() {
  const { data: user, isLoading } = useAuth();
  const isAuthenticated = !!user;

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <LoginForm />;

  return <div>Welcome {user.name}</div>;
}
```

**Benefits:**

- Firebase listener runs once at root
- All components get cached auth state
- React Query manages cache invalidation
- Components don't need to know about Firebase
- Testable (mock React Query cache)

---

### Pattern 4: Auth Mutations with Navigation

**Challenge:** Auth operations need to navigate after success

**Solution:** Use mutation callbacks with router

```typescript
// src/features/auth/hooks/useAuthMutations.ts
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authService.login(credentials),

    onSuccess: (user) => {
      // Update cache
      queryClient.setQueryData(['auth', 'session'], user);

      // Navigate
      router.push('/');
    },

    onError: (error) => {
      // Error handling (could use toast here)
      console.error('Login failed:', error);
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),

    onSuccess: () => {
      // Clear all caches (user-specific data)
      queryClient.clear();

      // Set auth to null
      queryClient.setQueryData(['auth', 'session'], null);

      // Navigate to landing
      router.push('/');
    },
  });
}

// Usage in components
function LoginForm() {
  const loginMutation = useLogin();

  const handleSubmit = (credentials) => {
    loginMutation.mutate(credentials);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={loginMutation.isPending}>
        {loginMutation.isPending ? 'Logging in...' : 'Login'}
      </button>
      {loginMutation.error && <Error message={loginMutation.error.message} />}
    </form>
  );
}
```

**Benefits:**

- Navigation logic in mutation (not component)
- Clear success/error handling
- Loading states built-in
- Optimistic updates possible

---

## Risk Assessment & Mitigation

### Risk Matrix

| Risk                   | Severity    | Likelihood | Mitigation                               |
| ---------------------- | ----------- | ---------- | ---------------------------------------- |
| Auth session loss      | 🔴 CRITICAL | 🟡 MEDIUM  | Comprehensive testing, gradual rollout   |
| Timer state corruption | 🟡 MEDIUM   | 🟡 MEDIUM  | Split client/server state clearly        |
| Performance regression | 🟢 LOW      | 🟢 LOW     | React Query more efficient than contexts |
| Component breakage     | 🟡 MEDIUM   | 🔴 HIGH    | Automated tests, TypeScript checks       |
| Cross-tab sync failure | 🟡 MEDIUM   | 🟢 LOW     | React Query refetch handles this         |

### Specific Risks & Mitigations

#### Risk 1: Auth Session Loss During Migration

**Scenario:** User logs in, auth context removed, session lost

**Mitigation:**

1. Keep AuthProvider during migration (feature flag)
2. Migrate components one-by-one
3. Test OAuth flows thoroughly
4. Monitor error rates in production
5. Have instant rollback plan

**Testing Strategy:**

```typescript
// Test both old and new implementations side-by-side
describe('Auth migration', () => {
  it('should maintain session across migrations', async () => {
    const { result: oldAuth } = renderHook(() => useAuthContext());
    const { result: newAuth } = renderHook(() => useAuth());

    expect(oldAuth.current.user?.id).toBe(newAuth.current.data?.id);
  });
});
```

---

#### Risk 2: Timer Stops Working in Production

**Scenario:** Client state/server state separation breaks timer

**Mitigation:**

1. Create comprehensive E2E tests for timer flows
2. Test cross-tab scenarios
3. Test pause/resume edge cases
4. Monitor timer completion rates
5. Canary deploy to 10% of users first

**Testing Strategy:**

```typescript
// E2E test with Playwright
test('timer should persist across page reloads', async ({ page }) => {
  await page.goto('/timer');
  await page.click('[data-testid="start-timer"]');

  await page.reload();

  // Timer should still be running
  await expect(page.locator('[data-testid="timer-running"]')).toBeVisible();
});
```

---

#### Risk 3: Performance Regression

**Scenario:** React Query caching slower than contexts

**Mitigation:**

1. Benchmark before/after (Lighthouse, Web Vitals)
2. Monitor real user metrics (Vercel Speed Insights)
3. Set appropriate stale times
4. Use React Query devtools to debug

**Monitoring:**

```typescript
// Track cache hit rates
const { data, isStale } = useFeature();

useEffect(() => {
  analytics.track('cache_hit', {
    feature: 'feature-name',
    wasStale: isStale,
  });
}, [isStale]);
```

---

#### Risk 4: Type Safety Loss

**Scenario:** Removing contexts breaks TypeScript types

**Mitigation:**

1. Define types at service layer
2. Export typed hooks
3. Use TypeScript strict mode
4. Run `tsc --noEmit` in CI

**Type Safety Pattern:**

```typescript
// src/features/feature/types/index.ts
export interface Feature {
  id: string;
  name: string;
  // ... other fields
}

export interface FeatureService {
  getData(): Promise<Feature[]>;
}

// src/features/feature/hooks/useFeature.ts
export function useFeature() {
  return useQuery<Feature[]>({
    // ← Typed return
    queryKey: ['feature', 'data'],
    queryFn: () => featureService.getData(),
  });
}
```

---

## Success Metrics

### Quantitative Metrics

| Metric               | Current  | Target | How to Measure                     |
| -------------------- | -------- | ------ | ---------------------------------- |
| Global providers     | 5        | 1-2    | Count in layout.tsx                |
| Context dependencies | ~200     | 0      | `grep -r "useAuth\|useTimer" src/` |
| Bundle size (main)   | Baseline | -10%   | `next build --profile`             |
| Time to Interactive  | Baseline | -15%   | Lighthouse CI                      |
| Test coverage        | 65%      | 80%    | Jest coverage report               |
| Cache hit rate       | N/A      | >80%   | React Query devtools               |

### Qualitative Metrics

- ✅ Architecture follows clean boundaries (no contexts in components)
- ✅ Features are independently testable
- ✅ New developers can understand code flow
- ✅ TypeScript catches more errors at compile time
- ✅ Components are smaller and more focused

### Monitoring Plan

```typescript
// Add telemetry to track migration success
export function useFeatureWithTelemetry(feature: string) {
  const result = useFeature();

  useEffect(() => {
    if (result.isSuccess) {
      analytics.track('react_query_success', { feature });
    }
    if (result.isError) {
      analytics.track('react_query_error', { feature, error: result.error });
    }
  }, [result.isSuccess, result.isError]);

  return result;
}
```

---

## Appendix

### A. Dependency Graph (Current State)

```
src/app/layout.tsx
  └─ QueryProvider ✅ Infrastructure (keep)
      └─ AuthProvider ❌ Eliminate
          ├─ used by: TimerProvider
          ├─ used by: ActivitiesProvider
          ├─ used by: 47 components
          ├─ used by: 23 app routes
          └─ used by: 4 feature modules

      └─ ToastProvider ⚠️ Consider scoping
          └─ used by: 40+ components (UI notifications)

      └─ TimerProvider ❌ Eliminate
          ├─ depends on: AuthProvider (violation)
          ├─ depends on: useTimerQuery (✅ already React Query)
          ├─ depends on: useActivitiesQuery (✅ already React Query)
          └─ used by: 47 components
```

### B. Migration Checklist Template

Use this for each component migration:

```markdown
## Component: [ComponentName.tsx]

- [ ] Identify context dependencies
  - [ ] `useAuth`: \_\_\_
  - [ ] `useTimer`: \_\_\_
  - [ ] `useActivities`: \_\_\_

- [ ] Replace with feature hooks
  - [ ] Import from `@/features/[feature]/hooks`
  - [ ] Update props if needed
  - [ ] Update types if needed

- [ ] Test changes
  - [ ] Unit tests pass
  - [ ] Integration tests pass
  - [ ] Manual testing done

- [ ] Verify no regressions
  - [ ] Functionality identical
  - [ ] Performance acceptable
  - [ ] No console errors

- [ ] Commit & deploy
  - [ ] Commit with clear message
  - [ ] Create PR with before/after
  - [ ] Deploy to staging
  - [ ] Monitor for 24h
```

### C. ESLint Rules for Enforcement

```javascript
// .eslintrc.js - Add after Phase 4 complete
module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@/contexts/AuthContext',
            message: 'Import from @/features/auth/hooks instead',
          },
          {
            name: '@/contexts/TimerContext',
            message: 'Import from @/features/timer/hooks instead',
          },
          {
            name: '@/contexts/ActivitiesContext',
            message: 'Import from @/hooks/useActivitiesQuery instead',
          },
          {
            name: '@/contexts/NotificationsContext',
            message: 'Import from @/hooks/useNotifications instead',
          },
        ],
        patterns: [
          {
            group: ['**/contexts/*Context'],
            message:
              'Use feature hooks from @/features/[feature]/hooks instead',
          },
        ],
      },
    ],
  },
};
```

### D. Quick Reference Commands

```bash
# Find context usage
grep -r "useAuth\|useTimer\|useActivities\|useNotifications" src/ | wc -l

# Find provider usage
grep -r "Provider>" src/app/layout.tsx

# Verify no context imports in components
grep -r "from '@/contexts/" src/components/

# Test coverage after migration
npm test -- --coverage

# Build size comparison
npm run build -- --profile
```

---

## Conclusion

This migration strategy provides a **clear, phased approach** to eliminating global singleton Context providers in favor of React Query at feature boundaries. The approach:

1. ✅ **Preserves functionality** during migration (no user-facing breakage)
2. ✅ **Minimizes risk** through incremental rollout
3. ✅ **Follows established patterns** already present in the codebase
4. ✅ **Aligns with clean architecture** principles
5. ✅ **Improves testability** and maintainability

**Recommended Action:** Start with Phase 1 (Quick Wins) to build momentum and validate the approach.

**Estimated Timeline:** 5-6 weeks for full migration
**Estimated Effort:** 80-100 developer hours
**Risk Level:** Medium (mitigated through phased approach)
**Expected ROI:** High (better architecture, performance, maintainability)

---

## Next Steps

1. **Review with team** - Discuss timeline and priorities
2. **Create GitHub Project** - Track migration tasks
3. **Set up monitoring** - Baseline performance metrics
4. **Start Phase 1** - Remove NotificationsContext and ActivitiesContext
5. **Iterate and learn** - Adjust strategy based on early results

---

**Document Version:** 1.0
**Last Updated:** 2025-10-27
**Author:** Claude (Architectural Analysis)
**Status:** Ready for Review
