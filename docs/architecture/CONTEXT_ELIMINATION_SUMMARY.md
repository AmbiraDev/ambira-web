# Context Elimination Strategy - Executive Summary

## Current State

**Problem:** 5 global singleton Context providers create tight coupling and architectural violations

```
layout.tsx Provider Hierarchy:
├─ QueryProvider (React Query) ✅ Keep
│   ├─ AuthProvider ❌ 74 files depend on this
│   │   ├─ ToastProvider ⚠️ UI-only, could scope
│   │   │   └─ TimerProvider ❌ 47 files depend on this
│   │   │       └─ {children}
│   │   │
│   │   └─ ActivitiesProvider ⚠️ DEPRECATED (migration ready)
│   │   └─ NotificationsProvider ⚠️ DEPRECATED (migration ready)
```

**Impact:**
- 🔴 **199+ violations** of clean architecture boundaries
- 🔴 **Mixed server/client state** in contexts
- 🔴 **Context-on-context dependencies** (TimerContext → AuthContext)
- 🟡 **74 files depend on AuthContext** across all layers
- 🟡 **Difficult to test** components in isolation

---

## Target Architecture

**Solution:** React Query at feature boundaries + minimal scoped contexts

```
layout.tsx (After):
├─ QueryProvider (React Query) ✅
│   └─ AuthInitializer (Firebase listener only) ✅
│       └─ ToastProvider (scoped to app shell) ⚠️ or use Sonner
│           └─ {children}

Features manage their own state:
src/features/
├─ auth/hooks/useAuth.ts          (React Query)
├─ timer/hooks/useTimer.ts        (React Query + local state)
├─ activities/hooks/useActivities.ts (React Query)
└─ notifications/hooks/useNotifications.ts (React Query)
```

**Benefits:**
- ✅ Clear separation: server state (React Query) vs client state (local)
- ✅ No context nesting or cross-dependencies
- ✅ Features are independently testable
- ✅ Better performance through React Query caching
- ✅ Follows established patterns in `/docs/architecture/CACHING_STRATEGY.md`

---

## Migration Priority Matrix

| Provider | Status | Files Affected | Effort | Risk | Priority |
|----------|--------|----------------|--------|------|----------|
| **NotificationsContext** | ⚠️ Deprecated | ~13 | 🟢 Low (2h) | 🟢 Low | 🔥 **Do First** |
| **ActivitiesContext** | ⚠️ Deprecated | 47 | 🟢 Low (4h) | 🟢 Low | 🔥 **Do Second** |
| **TimerContext** | 50% migrated | 47 | 🟡 Medium (8h) | 🟡 Medium | 🔥 **Do Third** |
| **AuthContext** | Active | 74 | 🔴 High (24h) | 🔴 High | ⏰ **Do Last** |
| **ToastContext** | UI-only | ~40 | 🟢 Low | 🟢 Low | ⏸️ **Optional** |

---

## Quick Wins (Week 1)

### 🎯 Goal: Remove 2 deprecated contexts, prove migration pattern works

#### Day 1-2: NotificationsContext ✅
```bash
# Current:
import { useNotifications } from '@/contexts/NotificationsContext'

# After:
import { useNotifications } from '@/hooks/useNotifications'
```

**Why Easy:**
- ✅ React Query hooks already exist
- ✅ Provider is already a passthrough (no-op)
- ✅ Only 13 files to update

**Steps:**
1. Remove `<NotificationsProvider>` from layout.tsx
2. Find/replace imports
3. Delete context file
4. Test & commit

---

#### Day 3-5: ActivitiesContext ✅
```bash
# Current:
import { useActivities } from '@/contexts/ActivitiesContext'

# After:
import { useActivities } from '@/hooks/useActivitiesQuery'
```

**Why Easy:**
- ✅ React Query hooks have full feature parity
- ✅ Deprecation warnings already in place
- ✅ Automated import replacement possible

**Steps:**
1. Run find/replace script across 47 files
2. Remove provider from layout.tsx
3. Delete context file
4. Update tests
5. Commit

**Week 1 Result:** 🎉 **2 fewer providers, 60 files refactored, migration pattern validated**

---

## Medium Effort (Week 2)

### 🎯 Goal: Eliminate TimerProvider, separate client/server state

#### Challenge:
TimerContext mixes concerns:
- ❌ Server state (active session in Firebase) → Should be React Query
- ❌ Client state (isRunning, elapsed time) → Should be local state
- ❌ Auto-save logic (every 30s) → React Query mutations handle this
- ✅ Already has React Query hooks (`useTimerQuery.ts`)

#### Solution: Split into Two Hooks

**Server State:**
```typescript
// src/features/timer/hooks/useActiveTimer.ts
export function useActiveTimer() {
  return useQuery({
    queryKey: ['timer', 'active'],
    queryFn: () => timerService.getActiveSession(),
    refetchInterval: 10000, // Cross-tab sync
  });
}
```

**Client State:**
```typescript
// src/features/timer/hooks/useTimerState.ts
export function useTimerState() {
  const { data: activeSession } = useActiveTimer();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Timer tick logic (pure client state)
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => setElapsed(e => e + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [isRunning]);

  return { activeSession, isRunning, elapsed };
}
```

**Week 2 Result:** 🎉 **TimerProvider eliminated, 47 components refactored**

---

## High Risk Migration (Week 3-5)

### 🎯 Goal: Eliminate AuthProvider, move to React Query + Firebase listener

#### Challenge:
- 🔴 **74 files** depend on AuthContext (all layers)
- 🔴 Firebase Auth listener must stay reactive
- 🔴 OAuth redirect flows are complex
- 🔴 Navigation coupling (`useRouter`)

#### Solution: Root Listener + React Query

**Architecture:**
```
layout.tsx
└─ AuthInitializer (subscribes to Firebase Auth once)
    ├─ useAuthListener() → Updates React Query cache
    └─ {children}

Components
└─ useAuth() → Reads from React Query cache
```

**Implementation:**

```typescript
// 1. Root listener (runs once)
export function AuthInitializer({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = firebaseAuthApi.onAuthStateChanged((user) => {
      queryClient.setQueryData(['auth', 'session'], user);
    });
    return unsubscribe;
  }, []);

  return <>{children}</>;
}

// 2. Auth hook (reads cache)
export function useAuth() {
  return useQuery({
    queryKey: ['auth', 'session'],
    queryFn: () => authService.getCurrentUser(),
    staleTime: Infinity, // Managed by listener
  });
}

// 3. Auth mutations
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials) => authService.login(credentials),
    onSuccess: (user) => {
      queryClient.setQueryData(['auth', 'session'], user);
      router.push('/');
    },
  });
}
```

**Migration Approach:**
- Week 3: Build infrastructure (services, hooks, tests)
- Week 4: Migrate components (4 features → 23 routes → 47 components)
- Week 5: Remove AuthProvider, monitor production

**Weeks 3-5 Result:** 🎉 **All contexts eliminated, clean architecture achieved**

---

## Risk Mitigation

### Critical Risks

| Risk | Mitigation |
|------|------------|
| **Auth session loss** | • Gradual rollout<br>• Keep provider during migration<br>• Comprehensive OAuth testing<br>• Instant rollback plan |
| **Timer stops working** | • E2E tests for all timer flows<br>• Test cross-tab scenarios<br>• Canary deploy to 10% first<br>• Monitor completion rates |
| **74 files break** | • TypeScript checks<br>• Automated tests<br>• Migrate in batches<br>• Test between batches |

### Rollback Strategy

Each phase has instant rollback:
```bash
# One-line revert if issues arise
git revert <commit-hash>

# Or: Keep old providers in feature flag
if (USE_OLD_AUTH) {
  return <AuthProvider>{children}</AuthProvider>
}
return <AuthInitializer>{children}</AuthInitializer>
```

---

## Success Metrics

### Quantitative

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Global providers | 5 | 1-2 | Count in layout.tsx |
| Context violations | ~200 | 0 | `grep "useAuth\|useTimer" src/` |
| Bundle size | Baseline | -10% | `next build --profile` |
| Time to Interactive | Baseline | -15% | Lighthouse CI |
| Test coverage | 65% | 80% | Jest coverage |

### Qualitative

- ✅ No contexts in component layer
- ✅ Features independently testable
- ✅ Clear data flow
- ✅ TypeScript catches more errors
- ✅ New devs understand architecture

---

## Timeline & Effort

```
┌─────────────────────────────────────────────────────────┐
│ Phase 1: Quick Wins (Week 1)                            │
│ • NotificationsContext removal (2h)                     │
│ • ActivitiesContext removal (4h)                        │
│ • Total: 6 hours, Low risk                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Phase 2: Timer Migration (Week 2)                       │
│ • Create feature hooks (4h)                             │
│ • Migrate components (4h)                               │
│ • Total: 8 hours, Medium risk                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Phase 3: Auth Migration (Weeks 3-5)                     │
│ • Infrastructure (8h)                                    │
│ • Component migration (12h)                             │
│ • Cleanup & monitoring (4h)                             │
│ • Total: 24 hours, High risk                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Phase 4: Cleanup (Week 6)                               │
│ • Delete old code (2h)                                   │
│ • Update docs (2h)                                       │
│ • Add ESLint rules (2h)                                  │
│ • Total: 6 hours, Low risk                               │
└─────────────────────────────────────────────────────────┘

Total: ~44 hours over 6 weeks
```

---

## Architectural Principles Enforced

### ✅ SOLID Principles

- **Single Responsibility**: Hooks do one thing (query OR mutate)
- **Open/Closed**: Features extend without modifying core
- **Dependency Inversion**: Components depend on abstractions (hooks), not implementations (contexts)

### ✅ Clean Architecture

```
Components (UI)
    ↓
Feature Hooks (React Query Boundary) ← ONLY place for useQuery/useMutation
    ↓
Services (Business Logic)
    ↓
Repositories (Data Access)
    ↓
Firebase/Firestore
```

### ✅ Feature-Based Structure

```
src/features/[feature]/
├─ domain/       # Business entities
├─ hooks/        # React Query boundary
├─ services/     # Business logic
└─ types/        # Feature types
```

---

## Code Review Checklist

After migration, enforce these rules:

```markdown
- [ ] No `import { useContext } from 'react'` in components
- [ ] No direct `firebaseApi` imports in components
- [ ] `useQuery`/`useMutation` only in `src/features/*/hooks/*`
- [ ] Services have no React dependencies
- [ ] Components use feature hooks, not services directly
- [ ] Cache keys follow hierarchical pattern
- [ ] Tests cover both service layer and hook layer
```

Add ESLint rules (Phase 4):
```javascript
{
  "no-restricted-imports": [
    "error",
    {
      "patterns": [
        "**/contexts/*Context", // No context imports
        "@tanstack/react-query" // Only in feature hooks
      ]
    }
  ]
}
```

---

## Frequently Asked Questions

### Q: Why not keep contexts for convenience?
**A:** Contexts create tight coupling, prevent proper testing, and mix concerns. React Query provides the same convenience with better architecture.

### Q: What about component-local state?
**A:** Perfectly fine! Use `useState` for UI state that doesn't need to be shared. This strategy only targets global singletons.

### Q: How do we handle real-time subscriptions (Firebase)?
**A:** Use a root-level listener that updates React Query cache. See Auth migration pattern.

### Q: Can we do this incrementally?
**A:** Yes! That's the whole strategy. Start with deprecated contexts (Week 1), work up to complex ones (Weeks 3-5).

### Q: What if we need to rollback?
**A:** Each phase has a one-line `git revert`. Old providers stay in history. Can also use feature flags for gradual rollout.

### Q: Won't this break existing components?
**A:** TypeScript catches most issues. API remains similar (same hook names). Tests verify functionality. Gradual migration minimizes risk.

---

## Next Actions

### Immediate (This Week)
1. ✅ Review this strategy with team
2. ✅ Get alignment on timeline and priorities
3. ✅ Create GitHub Project for tracking
4. ✅ Set up performance monitoring baseline

### Week 1 (Quick Wins)
1. Remove NotificationsContext (Day 1-2)
2. Remove ActivitiesContext (Day 3-5)
3. Validate migration pattern works
4. Celebrate first wins! 🎉

### Week 2 (Timer)
1. Create timer feature hooks
2. Migrate timer components
3. Remove TimerProvider
4. Monitor for issues

### Weeks 3-5 (Auth)
1. Build auth infrastructure
2. Migrate components incrementally
3. Remove AuthProvider
4. Monitor production closely

### Week 6 (Cleanup)
1. Delete dead code
2. Update documentation
3. Add ESLint enforcement
4. Team retrospective

---

## Resources

### Documentation
- [Full Migration Strategy](/docs/architecture/CONTEXT_ELIMINATION_STRATEGY.md) - Comprehensive 200+ page guide
- [Caching Strategy](/docs/architecture/CACHING_STRATEGY.md) - React Query patterns
- [Examples](/docs/architecture/EXAMPLES.md) - Real implementations
- [Migration Guide](/docs/architecture/MIGRATION_GUIDE.md) - Step-by-step instructions

### References
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Effective React Query Keys](https://tkdodo.eu/blog/effective-react-query-keys)

---

## Conclusion

**This migration is achievable, low-risk with phased approach, and will significantly improve architecture quality.**

**Key Insight:** 50% of the work is already done:
- ✅ NotificationsContext deprecated
- ✅ ActivitiesContext deprecated
- ✅ TimerContext partially migrated
- ✅ React Query patterns established

**Recommended:** Start with Week 1 (Quick Wins) to build momentum and validate the approach.

---

**Version:** 1.0
**Created:** 2025-10-27
**Status:** Ready for Implementation
